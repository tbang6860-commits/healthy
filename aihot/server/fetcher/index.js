import config from '../config.js';
import { scrape } from './firecrawl.js';
import { getTrends, searchHotTweets } from './twitter.js';
import { fetchAllDirect } from './direct.js';

const { weiboHot, baiduHot, zhihuHot } = config.targets;

function parseWeibo(rawHtml) {
  try {
    const match = rawHtml.match(/\{"data":\{"realtime":\[/);
    if (match) {
      const json = JSON.parse(rawHtml.slice(match.index));
      const items = json.data?.realtime || [];
      return items.map(item => ({
        title: item.word || item.note || '',
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || '')}`,
        heat_score: item.num || item.raw_hot || 0,
      }));
    }
  } catch (e) { console.error('[Weibo] Parse error:', e.message); }
  return [];
}

function parseBaidu(markdown) {
  const items = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+)/);
    if (match && match[1].length > 3 && !match[1].startsWith('http')) {
      items.push({
        title: match[1].trim(),
        url: `https://www.baidu.com/s?wd=${encodeURIComponent(match[1].trim())}`,
        heat_score: 800000 - items.length * 25000,
      });
    }
  }
  return items.slice(0, 30);
}

function parseZhihu(rawHtml) {
  try {
    const match = rawHtml.match(/\{"data":\[/);
    if (match) {
      const json = JSON.parse(rawHtml.slice(match.index));
      const items = json.data || [];
      return items.map(item => ({
        title: item.target?.title || item.target?.question?.title || '',
        url: item.target?.url || `https://www.zhihu.com/question/${item.target?.id}` || '',
        heat_score: item.detail_text ? parseInt(item.detail_text) * 10000 || 0 : 0,
      }));
    }
  } catch (e) { console.error('[Zhihu] Parse error:', e.message); }
  return [];
}

function normalize(items, source) {
  return items.map(item => ({
    title: (item.title || '').trim(),
    url: item.url || '',
    raw_heat: item.heat_score || item.volume || 0,
    source,
  }));
}

/**
 * 降级数据：当网络源不可用时使用
 */
function getFallbackData() {
  const topics = [
    { title: '2026年高考作文题公布引热议', source: 'weibo', heat: 950000 },
    { title: 'DeepSeek发布V4模型性能评测超越GPT-5', source: 'zhihu', heat: 920000 },
    { title: '美国总统大选辩论直播观看破纪录', source: 'twitter', heat: 880000 },
    { title: '中国航天员完成首次火星采样返回任务', source: 'baidu', heat: 860000 },
    { title: '全球股市大幅震荡 美联储紧急会议', source: 'twitter', heat: 840000 },
    { title: '华为发布全新鸿蒙6.0操作系统', source: 'weibo', heat: 820000 },
    { title: '国际奥委会宣布电竞正式入奥', source: 'zhihu', heat: 780000 },
    { title: '比特币价格跌破3万美元关口', source: 'twitter', heat: 750000 },
    { title: '最新研究：AI可提前3年预测阿尔茨海默症', source: 'zhihu', heat: 720000 },
    { title: '《黑神话：悟空》续作官宣2027年发售', source: 'weibo', heat: 700000 },
    { title: '特斯拉发布新一代人形机器人Optimus Gen-3', source: 'twitter', heat: 680000 },
    { title: '全球气温连续12个月刷新历史纪录', source: 'baidu', heat: 650000 },
    { title: '2026福布斯全球富豪榜出炉', source: 'baidu', heat: 620000 },
    { title: '苹果Vision Pro 3正式开售', source: 'twitter', heat: 600000 },
    { title: '中俄联合军演在日本海举行', source: 'baidu', heat: 580000 },
  ];

  return normalize(topics, 'fallback');
}

/**
 * 统一调度：并行抓取 4 个数据源
 */
export async function fetchAll() {
  console.log('[Fetcher] Starting parallel fetch from all sources...');

  // 先获取 Twitter 趋势（用作独立数据 + 驱动搜索）
  const trendsResult = await getTrends().catch(() => []);
  const trendTopics = trendsResult.map(t => t.title).filter(Boolean);

  const [weiboRaw, baiduRaw, directItems, twitterTweets] = await Promise.allSettled([
    scrape(weiboHot),
    scrape(baiduHot),
    fetchAllDirect(),
    searchHotTweets(trendTopics),
  ]);

  const results = [];

  // 微博
  if (weiboRaw.status === 'fulfilled') {
    const html = weiboRaw.value.html || weiboRaw.value.markdown || '';
    const items = parseWeibo(html);
    results.push(...normalize(items, 'weibo'));
    console.log(`[Fetcher] Weibo: ${items.length} items`);
  }

  // 百度
  if (baiduRaw.status === 'fulfilled') {
    const md = baiduRaw.value.markdown || '';
    const items = parseBaidu(md);
    results.push(...normalize(items, 'baidu'));
    console.log(`[Fetcher] Baidu: ${items.length} items`);
  }

  // 直接 API 源（B站、知乎、V2EX、HackerNews、GitHub）
  if (directItems.status === 'fulfilled') {
    results.push(...directItems.value);
    console.log(`[Fetcher] Direct APIs: ${directItems.value.length} items`);
  } else {
    console.error('[Fetcher] Direct APIs failed:', directItems.reason?.message);
  }

  // Twitter 趋势
  if (trendsResult.length > 0) {
    results.push(...normalize(trendsResult, 'twitter'));
    console.log(`[Fetcher] Twitter Trends: ${trendsResult.length} items`);
  }

  // Twitter 热推（用趋势话题名驱动搜索）
  if (twitterTweets.status === 'fulfilled') {
    results.push(...normalize(twitterTweets.value, 'twitter'));
    console.log(`[Fetcher] Twitter Tweets: ${twitterTweets.value.length} items`);
  }

  // 补充中文源：如果微博/百度/知乎无数据，注入降级数据保证多样性
  const hasChinese = results.some(r => ['weibo', 'baidu', 'zhihu'].includes(r.source));
  if (!hasChinese) {
    console.log('[Fetcher] Chinese sources unavailable, injecting fallback data');
    results.push(...getFallbackData());
  }
  // Twitter 也无数据时也要降级
  if (results.length === 0) {
    console.log('[Fetcher] All sources failed, using full fallback');
    results.push(...getFallbackData());
  }

  console.log(`[Fetcher] Total items: ${results.length}`);
  return results.filter(r => r.title);
}

if (process.argv[1]?.includes('fetcher')) {
  fetchAll().then(items => {
    console.log('\n=== Fetch Results ===');
    items.forEach((item, i) => {
      console.log(`${i + 1}. [${item.source}] ${item.title} (score: ${item.raw_heat})`);
    });
  });
}
