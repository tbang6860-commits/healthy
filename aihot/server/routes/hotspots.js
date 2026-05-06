import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/hotspots
router.get('/', (req, res) => {
  const { source, category, page = 1, limit = 30, onlyNew } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { rows, total } = db.getAllHotspots({
    category,
    source,
    onlyNew: onlyNew === 'true',
    limit: parseInt(limit),
    offset,
  });

  const newCount = db.getNewCount();

  // 确保 sources 是解析后的数组
  const data = rows.map(row => ({
    ...row,
    sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
  }));

  res.json({
    data,
    total,
    page: parseInt(page),
    hasNew: newCount > 0,
    newCount,
  });
});

// GET /api/hotspots/trends
router.get('/trends', (req, res) => {
  const trends = db.getTrends(24);
  res.json({ data: trends });
});

// GET /api/hotspots/:id
router.get('/:id', (req, res) => {
  const row = db.getHotspotById(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Hotspot not found' });
  }

  const allSnapshots = db.getTrends(24);
  const snapshots = allSnapshots.filter(s => s.hotspot_id === row.id);

  res.json({
    ...row,
    sources: typeof row.sources === 'string' ? JSON.parse(row.sources) : (row.sources || []),
    relatedIds: typeof row.related_ids === 'string' ? JSON.parse(row.related_ids) : (row.related_ids || []),
    snapshots,
  });
});

export default router;
