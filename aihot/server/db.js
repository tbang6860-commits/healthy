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

// ── 内存数据 ──
let _hotspots = [];
let _snapshots = [];
let _dirty = { hotspots: false, snapshots: false };
let _persistTimer = null;

// ── 工具函数 ──
function loadJson(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`[DB] Failed to load ${filePath}:`, e.message);
  }
  return [];
}

function saveJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[DB] Failed to save ${filePath}:`, e.message);
  }
}

function normalizeSources(row) {
  if (!row) return row;
  if (typeof row.sources === 'string') {
    try { row.sources = JSON.parse(row.sources); } catch { row.sources = []; }
  }
  if (typeof row.related_ids === 'string') {
    try { row.related_ids = JSON.parse(row.related_ids); } catch { row.related_ids = []; }
  }
  return row;
}

// ── 初始化加载 ──
function init() {
  _hotspots = loadJson(HOTSPOTS_FILE).map(normalizeSources);
  _snapshots = loadJson(SNAPSHOTS_FILE);
  console.log(`[DB] Loaded ${_hotspots.length} hotspots, ${_snapshots.length} snapshots into memory`);
}
init();

// ── 异步批量持久化 ──
function schedulePersist() {
  if (_persistTimer) return;
  _persistTimer = setTimeout(() => {
    _persistTimer = null;
    if (_dirty.hotspots) {
      saveJson(HOTSPOTS_FILE, _hotspots);
      _dirty.hotspots = false;
    }
    if (_dirty.snapshots) {
      saveJson(SNAPSHOTS_FILE, _snapshots);
      _dirty.snapshots = false;
    }
  }, 500); // 500ms 防抖，批量合并写
}

export function forcePersist() {
  if (_persistTimer) {
    clearTimeout(_persistTimer);
    _persistTimer = null;
  }
  if (_dirty.hotspots) {
    saveJson(HOTSPOTS_FILE, _hotspots);
    _dirty.hotspots = false;
  }
  if (_dirty.snapshots) {
    saveJson(SNAPSHOTS_FILE, _snapshots);
    _dirty.snapshots = false;
  }
}

// ── 快照清理：保留最近 N 天 ──
export function pruneSnapshots(days = 7) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const before = _snapshots.length;
  _snapshots = _snapshots.filter(s => s.snapshot_time >= cutoff);
  const removed = before - _snapshots.length;
  if (removed > 0) {
    _dirty.snapshots = true;
    schedulePersist();
    console.log(`[DB] Pruned ${removed} old snapshots (older than ${days} days)`);
  }
  return removed;
}

// ── 查询 API ──
const db = {
  getAllHotspots({ category, source, onlyNew, heatLevel, sentiment, trend, minSources, sort, limit, offset } = {}) {
    let rows = _hotspots;

    // 分类筛选
    if (category) rows = rows.filter(r => r.category === category);
    // 来源筛选
    if (source) rows = rows.filter(r => r.sources?.some(s => s.source === source));
    // 只看新热点
    if (onlyNew) rows = rows.filter(r => r.is_new === 1);
    // 热度档位
    if (heatLevel === 'high') rows = rows.filter(r => r.heat_score > 70);
    if (heatLevel === 'medium') rows = rows.filter(r => r.heat_score >= 30 && r.heat_score <= 70);
    if (heatLevel === 'low') rows = rows.filter(r => r.heat_score < 30);
    // 情感筛选
    if (sentiment) rows = rows.filter(r => r.sentiment === sentiment);
    // 动态状态
    if (trend === 'new') rows = rows.filter(r => r.is_new === 1);
    if (trend === 'rising') rows = rows.filter(r => r.is_rising === 1);
    // 跨平台：至少 N 个来源
    if (minSources && parseInt(minSources) >= 2) {
      rows = rows.filter(r => (r.sources || []).length >= parseInt(minSources));
    }

    const total = rows.length;

    // 排序
    switch (sort) {
      case 'newest':
        rows = [...rows].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'rising': {
        const deltas = this.getTrendDeltas();
        const deltaMap = {};
        deltas.forEach(d => { deltaMap[d.hotspot_id] = d.delta; });
        rows = [...rows].sort((a, b) => (deltaMap[b.id] || 0) - (deltaMap[a.id] || 0));
        break;
      }
      case 'cross_source':
        rows = [...rows].sort((a, b) => (b.sources || []).length - (a.sources || []).length);
        break;
      case 'sentiment':
        rows = [...rows].sort((a, b) => (b.sentiment_score || 0) - (a.sentiment_score || 0));
        break;
      case 'heat':
      default:
        rows = [...rows].sort((a, b) => b.heat_score - a.heat_score);
        break;
    }

    if (offset !== undefined && limit !== undefined) {
      rows = rows.slice(offset, offset + limit);
    }
    return { rows, total };
  },

  getHotspotById(id) {
    const row = _hotspots.find(r => r.id === parseInt(id)) || null;
    return row ? normalizeSources({ ...row }) : null;
  },

  getNewCount() {
    return _hotspots.filter(r => r.is_new === 1).length;
  },

  replaceAllHotspots(newRows) {
    const oldTitles = new Set(_hotspots.map(r => r.title));
    const now = new Date().toISOString();
    const marked = newRows.map((row, i) => ({
      id: i + 1,
      ...row,
      sources: row.sources || [],
      is_new: oldTitles.has(row.title) ? 0 : 1,
      is_rising: 0,
      snapshot_time: now,
      created_at: row.created_at || now,
      updated_at: now,
    }));
    _hotspots = marked;
    _dirty.hotspots = true;
    schedulePersist();
    return marked;
  },

  getTrends(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    return _snapshots
      .filter(s => s.snapshot_time >= cutoff)
      .map(s => {
        const h = _hotspots.find(r => r.id === s.hotspot_id);
        return { ...s, title: h?.title || '' };
      })
      .sort((a, b) => a.snapshot_time.localeCompare(b.snapshot_time));
  },

  getTrendDeltas(hours = 24) {
    const trends = this.getTrends(hours);

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
      const h = _hotspots.find(r => r.id === parseInt(hotspot_id));
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
    const baseId = _snapshots.length ? Math.max(..._snapshots.map(s => s.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newSnapshots = snapshotRows.map((s, i) => ({
      id: baseId + i,
      ...s,
      snapshot_time: now,
    }));
    _snapshots.push(...newSnapshots);
    _dirty.snapshots = true;
    schedulePersist();
    return newSnapshots;
  },
};

export default db;
