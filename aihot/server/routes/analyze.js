import { Router } from 'express';
import { analyzeHotspots } from '../ai/analyzer.js';

const router = Router();

// POST /api/analyze - 手动触发 AI 分析指定热点
router.post('/', async (req, res) => {
  try {
    const { hotspots } = req.body;

    if (!hotspots || !Array.isArray(hotspots)) {
      return res.status(400).json({ error: '请提供 hotspots 数组' });
    }

    const analyzed = await analyzeHotspots(hotspots);
    res.json({ data: analyzed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
