/**
 * 多源聚合器
 * - 标题相似度去重
 * - 跨源关联合并
 * - 统一热度打分 (0-100)
 */

/**
 * 计算两个字符串的 Jaccard 相似度（基于字符 2-gram）
 */
function similarity(a, b) {
  if (!a || !b) return 0;

  const bigrams = s => {
    const grams = new Set();
    for (let i = 0; i < s.length - 1; i++) {
      grams.add(s.slice(i, i + 2));
    }
    return grams;
  };

  const ga = bigrams(a);
  const gb = bigrams(b);

  if (ga.size === 0 || gb.size === 0) return 0;

  let intersection = 0;
  for (const g of ga) {
    if (gb.has(g)) intersection++;
  }

  return intersection / Math.max(ga.size, gb.size);
}

/**
 * 聚合 + 去重
 */
function aggregate(rawItems, threshold = 0.7) {
  if (!rawItems.length) return [];

  // 按原始热度降序排列
  const sorted = [...rawItems].sort((a, b) => b.raw_heat - a.raw_heat);

  const clusters = [];

  for (const item of sorted) {
    let matched = false;

    for (const cluster of clusters) {
      // 检查是否与聚类中的任一标题相似
      const simScore = Math.max(
        ...cluster.items.map(ci => similarity(ci.title, item.title))
      );

      if (simScore >= threshold) {
        cluster.items.push(item);
        matched = true;
        break;
      }
    }

    if (!matched) {
      clusters.push({ items: [item] });
    }
  }

  // 每个聚类生成一条聚合热点
  return clusters.map(cluster => {
    const mainItem = cluster.items[0];
    const allSources = cluster.items.map(i => ({
      source: i.source,
      url: i.url,
      raw_heat: i.raw_heat,
    }));

    // 综合热度：取聚类中最大热度 + 多源加分
    const maxHeat = Math.max(...cluster.items.map(i => i.raw_heat));
    const sourceBonus = new Set(cluster.items.map(i => i.source)).size * 5;
    const heatScore = Math.min(100, Math.round(normalizeHeat(maxHeat) + sourceBonus));

    return {
      title: mainItem.title,
      sources: allSources,
      heat_score: heatScore,
      // AI 分析字段在下一步填充
      summary: mainItem.summary || '',
      category: mainItem.category || '',
      sentiment: mainItem.sentiment || '',
      sentiment_score: mainItem.sentiment_score || 0,
    };
  });
}

/**
 * 将原始热度值归一化到 0-100
 */
function normalizeHeat(raw) {
  if (raw <= 0) return 10;
  if (raw >= 10000000) return 95;
  // 对数归一化
  return Math.round(Math.log10(raw + 1) * 10);
}

export { aggregate, similarity };
