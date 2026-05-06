import axios from 'axios';
import config from '../config.js';

const { apiKey, baseURL } = config.firecrawl;

const client = axios.create({
  baseURL,
  headers: { Authorization: `Bearer ${apiKey}` },
  timeout: 30000,
});

/**
 * 用 Firecrawl 抓取单个 URL，返回 markdown 内容
 */
async function scrape(url, options = {}) {
  const res = await client.post('/v1/scrape', {
    url,
    formats: ['markdown', 'html'],
    onlyMainContent: options.onlyMainContent ?? true,
    waitFor: options.waitFor || 0,
    ...options,
  });
  return res.data.data;
}

export { scrape };
