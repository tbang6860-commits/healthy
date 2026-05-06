import { Router } from 'express';
import masterAgent from '../agents/masterAgent.js';

const router = Router();

// POST /api/agent/chat — 与 MasterAgent 对话
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: '请提供 message 字段' });
    }

    const result = await masterAgent.run(message);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/agent/clear — 清除对话历史
router.post('/clear', (_req, res) => {
  masterAgent.clearHistory();
  res.json({ message: '对话历史已清除' });
});

// GET /api/agent/skills — 获取可用 Skill 列表
router.get('/skills', (_req, res) => {
  const skills = Object.entries(masterAgent.skills).map(([key, skill]) => ({
    id: key,
    name: skill.name,
    description: skill.description,
  }));
  res.json({ skills });
});

export default router;
