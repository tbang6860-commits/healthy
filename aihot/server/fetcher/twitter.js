import axios from 'axios';
import config from '../config.js';

const { apiKey, baseURL } = config.twitter;

const client = axios.create({
  baseURL,
  headers: { 'X-API-Key': apiKey },
  timeout: 20000,
});

/**
 * 获取 Twitter 趋势话题
 */
async function getTrends(woeid = 1) {
  try {
    const res = await client.get('/twitter/trends', { params: { woeid } });
    const data = res.data;

    // 实际响应格式: { trends: [{ trend: { name, target: { query }, rank } }] }
    const trends = (data.trends || []).map(t => ({
      title: t.trend?.name || t.name || '',
      url: `https://twitter.com/search?q=${encodeURIComponent(t.trend?.target?.query || t.trend?.name || '')}`,
      volume: (t.trend?.rank || t.rank) ? 1000000 - (t.trend?.rank || t.rank) * 50000 : 0,
    }));

    return trends;
  } catch (e) {
    console.error('[Twitter] Failed to fetch trends:', e.message);
    return [];
  }
}

/**
 * 搜索热门推文（使用趋势话题驱动搜索 + 互动量过滤）
 * 策略：从趋势话题中取 Top 5 作为搜索关键词，替代固定关键词
 */
async function searchHotTweets(trendTopics = [], count = 15) {
  const minEngagement = config.twitter.minEngagement;

  // 用趋势话题名作为搜索关键词；若无趋势则回退到通用查询
  const queries = trendTopics.length > 0
    ? trendTopics.slice(0, 5).map(t => `"${t}"`)
    : ['trending'];

  let allTweets = [];

  for (const query of queries) {
    try {
      const res = await client.get('/v2/tweets/search/recent', {
        params: {
          query,
          'tweet.fields': 'public_metrics',
          max_results: Math.ceil(count / queries.length) || 5,
        },
      });
      const tweets = res.data.data || res.data.tweets || [];
      allTweets.push(...tweets);
    } catch (e) {
      // 单个查询失败不中断整体
      console.error(`[Twitter] Search failed for "${query}":`, e.message);
    }
  }

  // 按互动量排序 + 过滤低质量推文
  const scored = allTweets
    .map(t => {
      const retweets = t.public_metrics?.retweet_count || 0;
      const likes = t.public_metrics?.like_count || 0;
      const replies = t.public_metrics?.reply_count || 0;
      return {
        title: (t.text || '').slice(0, 80),
        url: `https://twitter.com/i/status/${t.id}`,
        volume: retweets * 2 + likes + replies * 0.5,
        engagement: retweets + likes,
      };
    })
    .filter(t => t.engagement >= minEngagement)
    .sort((a, b) => b.volume - a.volume);

  const filtered = allTweets.length - scored.length;
  if (filtered > 0) {
    console.log(`[Twitter] Filtered ${filtered} low-engagement tweets (threshold: ${minEngagement})`);
  }

  return scored.slice(0, count);
}

export { getTrends, searchHotTweets };
