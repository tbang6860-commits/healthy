import 'dotenv/config';

export default {
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  },
  firecrawl: {
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    baseURL: process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev',
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    baseURL: process.env.TWITTER_BASE_URL || 'https://api.twitterapi.io',
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    refreshIntervalMinutes: parseInt(process.env.REFRESH_INTERVAL_MINUTES, 10) || 30,
  },
  targets: {
    weiboHot: 'https://weibo.com/ajax/side/hotSearch',
    baiduHot: 'https://top.baidu.com/board?tab=realtime',
    zhihuHot: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total',
  },
  analysis: {
    similarityThreshold: 0.7,
    maxHotspots: 50,
    categories: ['科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育', '其他'],
  },
};
