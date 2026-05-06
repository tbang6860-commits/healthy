import { Skill } from '../skillBase.js';
import db from '../../db.js';
import { chat } from '../../ai/client.js';
// prompts 按需导入，此处不直接使用

/**
 * 热点分析 Skill — 深度分析话题、跨源对比、趋势预判
 * R23: 接收用户问题，基于实时热点数据回答
 */
export class AnalyzeSkill extends Skill {
  constructor() {
    super({
      name: 'hotspot_analyze',
      description: '深度分析热点话题：对指定话题进行详细解读、跨平台来源对比、情感分析、趋势预判。可以分析"某个话题为什么火了"、"这个话题在不同平台的讨论差异"、"未来几小时的热度趋势"。',
      schema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['deep_analyze', 'cross_source', 'trend_predict', 'related_topics', 'search'],
            description: '分析动作：deep_analyze=深度解读, cross_source=跨源对比, trend_predict=趋势预判, related_topics=相关话题, search=搜索话题',
          },
          topic: {
            type: 'string',
            description: '要分析的话题关键词或标题',
          },
          hotspot_id: {
            type: 'number',
            description: '可选：指定热点 ID 进行分析',
          },
        },
        required: ['action'],
      },
    });
  }

  async run(input = {}) {
    const { action = 'deep_analyze', topic, hotspot_id } = input;

    try {
      // 查找目标热点
      const hotspot = hotspot_id
        ? db.getHotspotById(hotspot_id)
        : this._findHotspotByTopic(topic);

      if (!hotspot && action !== 'search') {
        return {
          success: false,
          error: topic
            ? `未找到与"${topic}"相关的热点，试试用 search 动作搜索`
            : '请提供要分析的话题关键词或热点 ID',
        };
      }

      switch (action) {
        case 'deep_analyze':
          return await this._deepAnalyze(hotspot);
        case 'cross_source':
          return await this._crossSource(hotspot);
        case 'trend_predict':
          return await this._trendPredict(hotspot);
        case 'related_topics':
          return await this._relatedTopics(hotspot);
        case 'search':
          return this._searchTopics(topic);
        default:
          return await this._deepAnalyze(hotspot);
      }
    } catch (e) {
      return { success: false, error: `分析失败: ${e.message}` };
    }
  }

  /**
   * 深度解读 — 利用 AI 生成详细分析
   */
  async _deepAnalyze(hotspot) {
    const prompt = `请对以下热点话题进行深度分析：

标题：${hotspot.title}
分类：${hotspot.category || '未分类'}
热度指数：${hotspot.heat_score}/100
数据来源：${hotspot.sources.map(s => s.source).join('、')}
已有摘要：${hotspot.summary || '无'}

请从以下角度分析（用中文回答，控制在 300 字以内）：
1. 话题核心要点
2. 为什么引发关注
3. 各方观点概述
4. 后续发展预判`;

    const analysis = await chat([
      { role: 'system', content: '你是热点事件分析专家，擅长快速解读新闻事件背后的逻辑。' },
      { role: 'user', content: prompt },
    ]);

    return {
      success: true,
      data: {
        type: 'deep_analyze',
        topic: hotspot.title,
        heat_score: hotspot.heat_score,
        category: hotspot.category,
        sources: hotspot.sources.map(s => ({ source: s.source, url: s.url })),
        analysis,
      },
    };
  }

  /**
   * 跨源对比 — 同一话题在不同平台的讨论差异
   */
  async _crossSource(hotspot) {
    const sources = hotspot.sources || [];
    if (sources.length <= 1) {
      return {
        success: true,
        data: {
          type: 'cross_source',
          topic: hotspot.title,
          message: '该话题仅出现在单一平台，无法进行跨源对比。',
          sources: sources.map(s => ({ source: s.source, url: s.url })),
        },
      };
    }

    const sourceList = sources.map(s => `${s.source}（热度: ${s.raw_heat}）`).join('、');

    const prompt = `同一个话题"${hotspot.title}"同时出现在以下平台：${sourceList}

请分析各平台对此话题的讨论特点和差异（用中文，150 字以内）。`;

    const analysis = await chat([
      { role: 'system', content: '你是社交媒体跨平台分析专家。' },
      { role: 'user', content: prompt },
    ]);

    return {
      success: true,
      data: {
        type: 'cross_source',
        topic: hotspot.title,
        platform_count: sources.length,
        sources: sources.map(s => ({ source: s.source, url: s.url, raw_heat: s.raw_heat })),
        analysis,
      },
    };
  }

  /**
   * 趋势预判
   */
  async _trendPredict(hotspot) {
    const trends = db.getTrendDeltas();
    const trend = trends.find(t => t.hotspot_id === hotspot.id);

    const trendData = trend
      ? `近期热度变化: ${trend.delta > 0 ? '+' : ''}${trend.delta}`
      : '暂无历史趋势数据';

    const prompt = `热点"${hotspot.title}"当前热度指数 ${hotspot.heat_score}/100。${trendData}。

请预判该话题未来几小时的热度趋势（上升/平稳/下降），并说明判断依据（用中文，100 字以内）。`;

    const prediction = await chat([
      { role: 'system', content: '你是热点趋势分析师。' },
      { role: 'user', content: prompt },
    ]);

    return {
      success: true,
      data: {
        type: 'trend_predict',
        topic: hotspot.title,
        current_heat: hotspot.heat_score,
        delta: trend?.delta || 0,
        prediction,
      },
    };
  }

  /**
   * 查找相关话题
   */
  async _relatedTopics(hotspot) {
    const all = db.getAllHotspots().rows;

    // 同分类 + 关键词重叠
    const sameCategory = all.filter(
      h => h.id !== hotspot.id && h.category === hotspot.category
    ).slice(0, 5);

    // 标题关键词匹配
    const keywords = hotspot.title.replace(/[，。！？、《》【】]/g, '').slice(0, 4);
    const keywordMatch = all
      .filter(h => h.id !== hotspot.id)
      .filter(h => keywords.split('').some(k => h.title.includes(k)))
      .slice(0, 5);

    const related = [...new Map([...sameCategory, ...keywordMatch].map(h => [h.id, h])).values()]
      .slice(0, 8);

    return {
      success: true,
      data: {
        type: 'related_topics',
        topic: hotspot.title,
        count: related.length,
        items: related.map(h => ({
          id: h.id,
          title: h.title,
          category: h.category,
          heat_score: h.heat_score,
        })),
      },
    };
  }

  /**
   * 搜索话题
   */
  _searchTopics(keyword) {
    if (!keyword) {
      return { success: false, error: '请提供搜索关键词' };
    }

    const all = db.getAllHotspots().rows;
    const results = all
      .filter(h => h.title.includes(keyword) || (h.summary || '').includes(keyword))
      .slice(0, 10);

    return {
      success: true,
      data: {
        type: 'search',
        keyword,
        count: results.length,
        items: results.map(h => ({
          id: h.id,
          title: h.title,
          category: h.category,
          heat_score: h.heat_score,
          summary: h.summary,
          sources: h.sources.map(s => s.source),
        })),
        message: results.length > 0
          ? `找到 ${results.length} 个与"${keyword}"相关的热点`
          : `未找到与"${keyword}"相关的热点`,
      },
    };
  }

  /**
   * 根据关键词查找热点
   */
  _findHotspotByTopic(topic) {
    if (!topic) return null;
    const all = db.getAllHotspots().rows;
    return all.find(h => h.title.includes(topic)) || null;
  }
}

export default AnalyzeSkill;
