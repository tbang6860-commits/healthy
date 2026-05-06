import { chat } from './client.js';
import { ANALYZE_SYSTEM, ANALYZE_USER } from './prompts.js';

/**
 * 调用 DeepSeek V4 批量分析热点
 * 返回：每个热点的 summary, category, sentiment, sentiment_score
 */
export async function analyzeHotspots(hotspots) {
  if (!hotspots.length) return [];

  const userMsg = ANALYZE_USER(hotspots);

  try {
    const raw = await chat(
      [
        { role: 'system', content: ANALYZE_SYSTEM },
        { role: 'user', content: userMsg },
      ],
      { jsonMode: true, max_tokens: 4096 }
    );

    // 解析 JSON 响应
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const analysisList = JSON.parse(cleaned);

    // 合并分析结果到热点
    return hotspots.map((h, i) => {
      const analysis = Array.isArray(analysisList)
        ? analysisList.find(a => a.index === i + 1) || {}
        : {};

      return {
        ...h,
        summary: analysis.summary || '',
        category: analysis.category || '其他',
        sentiment: analysis.sentiment || 'neutral',
        sentiment_score: analysis.sentiment_score || 0.5,
      };
    });
  } catch (e) {
    console.error('[Analyzer] AI analysis failed:', e.message);
    // 降级：返回未分析的热点
    return hotspots.map(h => ({
      ...h,
      summary: '',
      category: '其他',
      sentiment: 'neutral',
      sentiment_score: 0.5,
    }));
  }
}

export default { analyzeHotspots };
