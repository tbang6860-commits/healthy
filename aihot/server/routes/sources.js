import { Router } from 'express';
import { runFetchCycle } from '../scheduler.js';
import { rateLimitMiddleware } from '../middleware.js';

const router = Router();

// 数据源状态缓存
const sourceStatus = {
  weibo: { name: 'weibo', label: '微博热搜', status: 'idle', lastFetch: null, itemCount: 0 },
  baidu: { name: 'baidu', label: '百度热搜', status: 'idle', lastFetch: null, itemCount: 0 },
  zhihu: { name: 'zhihu', label: '知乎热榜', status: 'idle', lastFetch: null, itemCount: 0 },
  twitter: { name: 'twitter', label: 'Twitter 趋势', status: 'idle', lastFetch: null, itemCount: 0 },
  bilibili: { name: 'bilibili', label: 'B站热门', status: 'idle', lastFetch: null, itemCount: 0 },
  v2ex: { name: 'v2ex', label: 'V2EX 热门', status: 'idle', lastFetch: null, itemCount: 0 },
  hackernews: { name: 'hackernews', label: 'Hacker News', status: 'idle', lastFetch: null, itemCount: 0 },
  github: { name: 'github', label: 'GitHub Trending', status: 'idle', lastFetch: null, itemCount: 0 },
  google: { name: 'google', label: 'Google News', status: 'idle', lastFetch: null, itemCount: 0 },
  reddit: { name: 'reddit', label: 'Reddit 热门', status: 'idle', lastFetch: null, itemCount: 0 },
};

export function updateSourceStatus(source, status, itemCount = 0) {
  if (sourceStatus[source]) {
    sourceStatus[source].status = status;
    sourceStatus[source].lastFetch = new Date().toISOString();
    sourceStatus[source].itemCount = itemCount;
  }
}

// GET /api/sources
router.get('/', (_req, res) => {
  res.json({ sources: Object.values(sourceStatus) });
});

// POST /api/sources/refresh - 手动触发一轮完整刷新
router.post('/refresh', rateLimitMiddleware(60000, 1), async (_req, res) => {
  try {
    // 异步触发，不等待
    runFetchCycle().catch(err => console.error('[Refresh] Error:', err.message));
    res.json({ message: '刷新任务已触发，请稍后查看结果' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
