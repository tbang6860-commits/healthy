import cron from 'node-cron';
import config from './config.js';
import db, { pruneSnapshots, forcePersist } from './db.js';
import { fetchAll } from './fetcher/index.js';
import { aggregate } from './aggregator.js';
import { analyzeHotspots } from './ai/analyzer.js';
import { updateSourceStatus } from './routes/sources.js';

let isRunning = false;

/**
 * 执行一轮完整的数据抓取 → 聚合 → AI 分析 → 存储
 */
export async function runFetchCycle() {
  if (isRunning) {
    console.log('[Scheduler] Previous cycle still running, skipping...');
    return;
  }

  isRunning = true;
  const startTime = Date.now();
  console.log('\n========================================');
  console.log('[Scheduler] Starting fetch cycle...');
  console.log('========================================\n');

  try {
    // 1. 并行抓取所有数据源
    const rawItems = await fetchAll();

    // 按 source 统计
    const sourceCounts = {};
    for (const item of rawItems) {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    }
    for (const [src, count] of Object.entries(sourceCounts)) {
      updateSourceStatus(src, 'ok', count);
    }

    // 2. 聚合去重
    const aggregated = aggregate(rawItems, config.analysis.similarityThreshold);
    console.log(`[Scheduler] Aggregated: ${rawItems.length} raw → ${aggregated.length} unique`);

    // 3. AI 分析（取 TOP 30 进行分析，节省 API 调用）
    const topForAI = aggregated.slice(0, Math.min(30, aggregated.length));
    const analyzed = await analyzeHotspots(topForAI);

    // 未分析的热点保留原样
    const final = aggregated.map((h, i) => {
      if (i < analyzed.length) {
        return { ...h, ...analyzed[i], sources: h.sources };
      }
      return h;
    });

    // 4. 存储
    const saved = db.replaceAllHotspots(
      final.slice(0, config.analysis.maxHotspots)
    );
    console.log(`[Scheduler] Saved ${saved.length} hotspots`);

    // 5. 保存快照（用于趋势追踪）
    const snapshotRows = saved.map(h => ({
      hotspot_id: h.id,
      heat_score: h.heat_score,
    }));
    db.addSnapshots(snapshotRows);

    // 6. 清理旧快照（保留最近 7 天）
    pruneSnapshots(7);

    // 7. 强制落盘，确保数据不丢失
    forcePersist();

    const newCount = saved.filter(h => h.is_new).length;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[Scheduler] Cycle complete in ${elapsed}s | ${newCount} new hotspots`);

    return { saved, newCount };
  } catch (e) {
    console.error('[Scheduler] Cycle failed:', e.message);
  } finally {
    isRunning = false;
  }
}

/**
 * 启动定时任务
 */
export function startScheduler() {
  const interval = config.server.refreshIntervalMinutes;

  // Cron 表达式：每 N 分钟执行
  cron.schedule(`*/${interval} * * * *`, () => {
    runFetchCycle().catch(err => console.error('[Scheduler] Error:', err.message));
  });

  // 启动时立即执行一次
  console.log('[Scheduler] Running initial fetch...');
  runFetchCycle().catch(err => console.error('[Scheduler] Initial fetch error:', err.message));

  console.log(`[Scheduler] Started — every ${interval} minutes`);
}
