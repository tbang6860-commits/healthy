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
 * 搜索热门推文（使用 v2 recent search）
 */
async function searchHotTweets(query = 'breaking OR trending OR AI', count = 10) {
  try {
    const res = await client.get('/v2/tweets/search/recent', {
      params: {
        query,
        'tweet.fields': 'public_metrics',
        max_results: count,
      },
    });
    const tweets = res.data.data || res.data.tweets || [];
    return tweets.slice(0, count).map(t => ({
      title: (t.text || '').slice(0, 80),
      url: `https://twitter.com/i/status/${t.id}`,
      volume: (t.public_metrics?.retweet_count || 0) + (t.public_metrics?.like_count || 0),
    }));
  } catch (e) {
    console.error('[Twitter] Failed to search tweets:', e.message);
    return [];
  }
}

export { getTrends, searchHotTweets };
