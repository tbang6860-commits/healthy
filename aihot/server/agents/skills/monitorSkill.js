import { Skill } from '../skillBase.js';
import db from '../../db.js';

/**
 * 热点监控 Skill — 检测热点异动、爆发性增长、新兴话题
 * R22: 定时检查热点变化，发现异动主动报告
 */
export class MonitorSkill extends Skill {
  constructor() {
    super({
      name: 'hotspot_monitor',
      description: '监控热点变化：检测新出现的热点、热度飙升话题、异常波动。可以查询"有什么新热点"、"热度上升最快的话题"、"今天的热点变化"。',
      schema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['new_hotspots', 'rising_hotspots', 'anomalies', 'summary'],
            description: '监控动作：new_hotspots=新热点, rising_hotspots=飙升话题, anomalies=异常波动, summary=综合摘要',
          },
          category: {
            type: 'string',
            description: '可选：按分类筛选（科技/娱乐/社会/财经/体育/国际/军事/健康/教育/其他）',
          },
          limit: {
            type: 'number',
            description: '返回条数上限，默认 10',
          },
        },
        required: ['action'],
      },
    });
  }

  async run(input = {}) {
    const { action = 'summary', category, limit = 10 } = input;

    try {
      switch (action) {
        case 'new_hotspots':
          return this._getNewHotspots(category, limit);
        case 'rising_hotspots':
          return this._getRisingHotspots(category, limit);
        case 'anomalies':
          return this._detectAnomalies(category, limit);
        case 'summary':
        default:
          return this._getSummary(category, limit);
      }
    } catch (e) {
      return { success: false, error: `监控失败: ${e.message}` };
    }
  }

  /**
   * 获取最新热点
   */
  _getNewHotspots(category, limit) {
    let hotspots = db.getAllHotspots().rows;

    if (category) {
      hotspots = hotspots.filter(h => h.category === category);
    }

    const newOnes = hotspots
      .filter(h => h.is_new)
      .slice(0, limit);

    return {
      success: true,
      data: {
        type: 'new_hotspots',
        count: newOnes.length,
        items: newOnes.map(h => ({
          title: h.title,
          category: h.category,
          heat_score: h.heat_score,
          sources: h.sources.map(s => s.source),
          summary: h.summary,
        })),
        message: newOnes.length > 0
          ? `发现 ${newOnes.length} 个新热点${category ? `（${category}类）` : ''}`
          : '暂无新热点',
      },
    };
  }

  /**
   * 获取热度飙升话题（通过快照对比）
   */
  _getRisingHotspots(category, limit) {
    const trends = db.getTrendDeltas();

    let rising = trends
      .filter(t => t.delta > 0)
      .sort((a, b) => b.delta - a.delta);

    if (category) {
      const hotspots = db.getAllHotspots().rows;
      const catIds = new Set(
        hotspots.filter(h => h.category === category).map(h => h.id)
      );
      rising = rising.filter(t => catIds.has(t.hotspot_id));
    }

    const top = rising.slice(0, limit);

    return {
      success: true,
      data: {
        type: 'rising_hotspots',
        count: top.length,
        items: top.map(t => ({
          title: t.title,
          heat_score: t.heat_score,
          delta: t.delta,
          trend: t.delta > 10 ? 'surging' : t.delta > 5 ? 'rising' : 'steady',
        })),
        message: top.length > 0
          ? `热度上升最快: ${top[0]?.title || '无'}（+${top[0]?.delta || 0}）`
          : '暂无飙升话题',
      },
    };
  }

  /**
   * 检测异常波动
   */
  _detectAnomalies(category, limit) {
    const trends = db.getTrendDeltas();
    const hotspots = db.getAllHotspots().rows;

    // 异常定义：热度变化绝对值 > 15
    const anomalies = trends
      .filter(t => Math.abs(t.delta) > 15)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const top = anomalies.slice(0, limit).map(t => {
      const h = hotspots.find(x => x.id === t.hotspot_id);
      return {
        title: t.title,
        heat_score: t.heat_score,
        delta: t.delta,
        direction: t.delta > 0 ? 'up' : 'down',
        category: h?.category || '',
        alert_level: Math.abs(t.delta) > 30 ? 'high' : Math.abs(t.delta) > 20 ? 'medium' : 'low',
      };
    });

    return {
      success: true,
      data: {
        type: 'anomalies',
        count: top.length,
        items: top,
        message: top.length > 0
          ? `检测到 ${top.length} 个异常波动，最高警报: ${top[0]?.alert_level || 'none'}`
          : '当前无异常波动',
      },
    };
  }

  /**
   * 综合摘要
   */
  _getSummary(category, limit) {
    const newResult = this._getNewHotspots(category, limit);
    const risingResult = this._getRisingHotspots(category, limit);
    const anomalyResult = this._detectAnomalies(category, limit);

    const lines = [];
    if (newResult.data) lines.push(newResult.data.message);
    if (risingResult.data) lines.push(risingResult.data.message);
    if (anomalyResult.data) lines.push(anomalyResult.data.message);

    return {
      success: true,
      data: {
        type: 'summary',
        message: lines.join('；'),
        new: newResult.data,
        rising: risingResult.data,
        anomalies: anomalyResult.data,
      },
    };
  }
}

export default MonitorSkill;
