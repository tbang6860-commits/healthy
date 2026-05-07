import express from 'express';
import cors from 'cors';
import config from './config.js';
import hotspotsRouter from './routes/hotspots.js';
import analyzeRouter from './routes/analyze.js';
import sourcesRouter from './routes/sources.js';
import agentRouter from './routes/agent.js';
import { startScheduler } from './scheduler.js';
import { forcePersist } from './db.js';
import { cacheMiddleware } from './middleware.js';

const app = express();

// ── 中间件 ──
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Express 5 查询字符串：支持嵌套对象
app.set('query parser', 'extended');

// ── 路由 ──
app.use('/api/hotspots', cacheMiddleware(), hotspotsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/agent', agentRouter);

// ── 健康检查 ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Express 5 全局错误处理（自动捕获 async 路由中的 rejected promise）──
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── 优雅关闭 ──
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  forcePersist();
  process.exit(0);
});

// ── 启动 ──
const { port } = config.server;
app.listen(port, () => {
  console.log(`[AIHot] Server running at http://localhost:${port}`);
  console.log(`[AIHot] Refresh interval: ${config.server.refreshIntervalMinutes} min`);

  // 启动定时任务
  startScheduler();
});

export default app;
