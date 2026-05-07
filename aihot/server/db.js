import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const HOTSPOTS_FILE = path.join(DATA_DIR, 'hotspots.json');
const SNAPSHOTS_FILE = path.join(DATA_DIR, 'snapshots.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function load(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`[DB] Failed to load ${filePath}:`, e.message);
  }
  return [];
}

function save(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const db = {
  getAllHotspots({ category, source, onlyNew, heatLevel, sentiment, trend, minSources, sort, limit, offset } = {}) {
    let rows = load(HOTSPOTS_FILE);

    // 分类筛选
    if (category) rows = rows.filter(r => r.category === category);
    // 来源筛选
    if (source) rows = rows.filter(r => r.sources?.some(s => s.source === source));
    // 只看新热点
    if (onlyNew) rows = rows.filter(r => r.is_new === 1);
    // 热度档位
    // 热度档位 — 基于当前数据分布的动态百分位阈值（前33%=高热，后33%=低热，中间=中热）
    if (heatLevel) {
      const sortedScores = [...rows].map(r => r.heat_score).sort((a, b) => b - a);
      const n = sortedScores.length;
      const p33 = sortedScores[Math.floor(n * 0.33)] ?? 70;
      const p67 = sortedScores[Math.floor(n * 0.67)] ?? 30;
      if (heatLevel === 'high') rows = rows.filter(r => r.heat_score >= p33);
      else if (heatLevel === 'medium') rows = rows.filter(r => r.heat_score >= p67 && r.heat_score < p33);
      else if (heatLevel === 'low') rows = rows.filter(r => r.heat_score < p67);
    }
    // 情感筛选
    if (sentiment) rows = rows.filter(r => r.sentiment === sentiment);
    // 动态状态
    if (trend === 'new') {
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      rows = rows.filter(r => r.is_new === 1 || (r.first_seen_at && r.first_seen_at >= oneDayAgo));
    }
    if (trend === 'rising') {
      const deltas = this.getTrendDeltas(24);
      const risingIds = new Set(deltas.filter(d => d.delta > 0).map(d => d.hotspot_id));
      rows = rows.filter(r => risingIds.has(r.id));
    }
    // 跨平台：至少 N 个来源
    if (minSources && parseInt(minSources) >= 2) {
      rows = rows.filter(r => {
        const srcs = typeof r.sources === 'string' ? JSON.parse(r.sources) : (r.sources || []);
        return srcs.length >= parseInt(minSources);
      });
    }

    const total = rows.length;

    // 排序
    switch (sort) {
      case 'newest':
        rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'rising': {
        const deltas = this.getTrendDeltas();
        const deltaMap = {};
        deltas.forEach(d => { deltaMap[d.hotspot_id] = d.delta; });
        rows.sort((a, b) => (deltaMap[b.id] || 0) - (deltaMap[a.id] || 0));
        break;
      }
      case 'cross_source':
        rows.sort((a, b) => {
          const sa = typeof a.sources === 'string' ? JSON.parse(a.sources) : (a.sources || []);
          const sb = typeof b.sources === 'string' ? JSON.parse(b.sources) : (b.sources || []);
          return sb.length - sa.length;
        });
        break;
      case 'sentiment':
        rows.sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0));
        break;
      case 'heat':
      default:
        rows.sort((a, b) => b.heat_score - a.heat_score);
        break;
    }

    if (offset !== undefined && limit !== undefined) {
      rows = rows.slice(offset, offset + limit);
    }
    return { rows, total };
  },

  getHotspotById(id) {
    return load(HOTSPOTS_FILE).find(r => r.id === parseInt(id)) || null;
  },

  getNewCount() {
    return load(HOTSPOTS_FILE).filter(r => r.is_new === 1).length;
  },

  replaceAllHotspots(newRows) {
    const oldRows = load(HOTSPOTS_FILE);
    const oldMap = new Map(oldRows.map(r => [r.title, r]));
    const now = new Date().toISOString();
    const marked = newRows.map((row, i) => {
      const old = oldMap.get(row.title);
      return {
        id: i + 1,
        ...row,
        is_new: old ? 0 : 1,
        // rising = 之前存在 且 本次热度 > 上次热度
        is_rising: (old && row.heat_score > (old.heat_score || 0)) ? 1 : 0,
        first_seen_at: old?.first_seen_at || row.first_seen_at || now,
        snapshot_time: now,
        created_at: row.created_at || now,
        updated_at: now,
      };
    });
    save(HOTSPOTS_FILE, marked);
    return marked;
  },

  getTrends(hours = 24) {
    const snapshots = load(SNAPSHOTS_FILE);
    const hotspots = load(HOTSPOTS_FILE);
    const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    return snapshots
      .filter(s => s.snapshot_time >= cutoff)
      .map(s => {
        const h = hotspots.find(r => r.id === s.hotspot_id);
        return { ...s, title: h?.title || '' };
      })
      .sort((a, b) => a.snapshot_time.localeCompare(b.snapshot_time));
  },

  getTrendDeltas(hours = 24) {
    const trends = this.getTrends(hours);
    const hotspots = load(HOTSPOTS_FILE);

    // 按 hotspot_id 分组，取每组最早和最晚的快照计算 delta
    const groups = {};
    for (const s of trends) {
      if (!groups[s.hotspot_id]) groups[s.hotspot_id] = [];
      groups[s.hotspot_id].push(s);
    }

    const deltas = [];
    for (const [hotspot_id, snaps] of Object.entries(groups)) {
      if (snaps.length < 2) continue;
      const first = snaps[0];
      const last = snaps[snaps.length - 1];
      const h = hotspots.find(r => r.id === parseInt(hotspot_id));
      deltas.push({
        hotspot_id: parseInt(hotspot_id),
        title: h?.title || '',
        heat_score: last.heat_score,
        delta: last.heat_score - first.heat_score,
        snapshot_count: snaps.length,
      });
    }

    return deltas;
  },

  addSnapshots(snapshotRows) {
    const snapshots = load(SNAPSHOTS_FILE);
    const baseId = snapshots.length ? Math.max(...snapshots.map(s => s.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newSnapshots = snapshotRows.map((s, i) => ({
      id: baseId + i,
      ...s,
      snapshot_time: now,
    }));
    snapshots.push(...newSnapshots);
    save(SNAPSHOTS_FILE, snapshots);
    return newSnapshots;
  },
};

export default db;
