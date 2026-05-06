import axios from 'axios';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const http = axios.create({
  headers: { 'User-Agent': UA },
  timeout: 15000,
});

/**
 * 哔哩哔哩热门视频
 */
async function fetchBilibili() {
  try {
    const res = await http.get('https://api.bilibili.com/x/web-interface/popular?ps=30');
    const list = res.data?.data?.list || [];
    return list.map(v => ({
      title: v.title || '',
      url: `https://www.bilibili.com/video/${v.bvid}`,
      raw_heat: (v.stat?.view || 0) + (v.stat?.like || 0) * 2,
      source: 'bilibili',
    }));
  } catch (e) { console.error('[Bilibili]', e.message); return []; }
}

/**
 * 知乎热榜（直接 API 调用）
 */
async function fetchZhihu() {
  try {
    const res = await http.get('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=30');
    const list = res.data?.data || [];
    return list.map(item => ({
      title: item.target?.title || item.target?.question?.title || '',
      url: `https://www.zhihu.com/question/${item.target?.id}`,
      raw_heat: parseInt(item.detail_text?.replace(/\D/g, '') || '0') * 10000 || item.target?.follower_count || 0,
      source: 'zhihu',
    }));
  } catch (e) { console.error('[Zhihu]', e.message); return []; }
}

/**
 * V2EX 热门话题
 */
async function fetchV2ex() {
  try {
    const res = await http.get('https://www.v2ex.com/api/topics/hot.json', { timeout: 30000 });
    const list = res.data || [];
    return list.slice(0, 30).map(t => ({
      title: t.title || '',
      url: t.url || `https://www.v2ex.com/t/${t.id}`,
      raw_heat: (t.replies || 0) * 5000,
      source: 'v2ex',
    }));
  } catch (e) { console.error('[V2EX]', e.message); return []; }
}

/**
 * Hacker News Top Stories
 */
async function fetchHackerNews() {
  try {
    const topRes = await http.get('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = (topRes.data || []).slice(0, 20);

    const items = await Promise.all(
      ids.map(id =>
        http.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.data)
          .catch(() => null)
      )
    );

    return items.filter(Boolean).map(item => ({
      title: item.title || '',
      url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
      raw_heat: (item.score || 0) * 1000,
      source: 'hackernews',
    }));
  } catch (e) { console.error('[HackerNews]', e.message); return []; }
}

/**
 * GitHub Trending (via Search API — 按 stars 排序的近期热门仓库)
 */
async function fetchGithubTrending() {
  try {
    // 使用 GitHub Search API：最近创建的高星仓库
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const res = await http.get(
      `https://api.github.com/search/repositories?q=created:>${sevenDaysAgo}&sort=stars&order=desc&per_page=20`,
      { timeout: 30000, headers: { Accept: 'application/vnd.github.v3+json' } }
    );

    const items = res.data?.items || [];
    return items.map(repo => ({
      title: `${repo.full_name} — ${(repo.description || '').slice(0, 60)}`,
      url: repo.html_url || '',
      raw_heat: (repo.stargazers_count || 0) * 100 + (repo.forks_count || 0) * 50,
      source: 'github',
    }));
  } catch (e) { console.error('[GitHub]', e.message); return []; }
}

/**
 * Google News RSS — 全球新闻热点聚合
 */
async function fetchGoogleNews() {
  try {
    const res = await http.get('https://news.google.com/rss', { timeout: 15000 });
    const xml = typeof res.data === 'string' ? res.data : String(res.data);

    // 用正则解析 RSS <item> 块，提取 title 和 link
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;

    const items = [];
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 30) {
      const block = match[0];
      const titleMatch = block.match(titleRegex);
      const linkMatch = block.match(linkRegex);

      if (titleMatch) {
        const title = (titleMatch[1] || titleMatch[2] || '').trim();
        // 跳过 RSS feed 自身的 title
        if (!title) continue;
        const url = linkMatch ? linkMatch[1].trim() : '';
        items.push({
          title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'),
          url,
          raw_heat: 500000 + items.length * 5000,
          source: 'google',
        });
      }
    }

    return items.reverse(); // 最近的在前
  } catch (e) { console.error('[GoogleNews]', e.message); return []; }
}

/**
 * Reddit r/popular — 全站热门帖子
 */
async function fetchRedditPopular() {
  try {
    const res = await http.get('https://www.reddit.com/r/popular/hot.json?limit=30', {
      timeout: 15000,
      headers: { 'User-Agent': 'PulseSphere/1.0' },
    });

    const children = res.data?.data?.children || [];
    return children.map(c => {
      const d = c.data || {};
      return {
        title: (d.title || '').slice(0, 100),
        url: `https://www.reddit.com${d.permalink || ''}`,
        raw_heat: (d.score || 0) * 100 + (d.num_comments || 0) * 500,
        source: 'reddit',
      };
    });
  } catch (e) { console.error('[Reddit]', e.message); return []; }
}

/**
 * 统一入口：并行抓取所有直接 API 源
 */
export async function fetchAllDirect() {
  console.log('[Direct] Fetching 7 direct API sources...');

  const [bili, zhihu, v2ex, hn, github, google, reddit] = await Promise.allSettled([
    fetchBilibili(),
    fetchZhihu(),
    fetchV2ex(),
    fetchHackerNews(),
    fetchGithubTrending(),
    fetchGoogleNews(),
    fetchRedditPopular(),
  ]);

  const results = [];

  if (bili.status === 'fulfilled') {
    results.push(...bili.value);
    console.log(`[Direct] Bilibili: ${bili.value.length} items`);
  } else {
    console.error('[Direct] Bilibili failed:', bili.reason?.message);
  }

  if (zhihu.status === 'fulfilled') {
    results.push(...zhihu.value);
    console.log(`[Direct] Zhihu: ${zhihu.value.length} items`);
  } else {
    console.error('[Direct] Zhihu failed:', zhihu.reason?.message);
  }

  if (v2ex.status === 'fulfilled') {
    results.push(...v2ex.value);
    console.log(`[Direct] V2EX: ${v2ex.value.length} items`);
  } else {
    console.error('[Direct] V2EX failed:', v2ex.reason?.message);
  }

  if (hn.status === 'fulfilled') {
    results.push(...hn.value);
    console.log(`[Direct] HackerNews: ${hn.value.length} items`);
  } else {
    console.error('[Direct] HackerNews failed:', hn.reason?.message);
  }

  if (github.status === 'fulfilled') {
    results.push(...github.value);
    console.log(`[Direct] GitHub: ${github.value.length} items`);
  } else {
    console.error('[Direct] GitHub failed:', github.reason?.message);
  }

  if (google.status === 'fulfilled') {
    results.push(...google.value);
    console.log(`[Direct] Google News: ${google.value.length} items`);
  } else {
    console.error('[Direct] Google News failed:', google.reason?.message);
  }

  if (reddit.status === 'fulfilled') {
    results.push(...reddit.value);
    console.log(`[Direct] Reddit: ${reddit.value.length} items`);
  } else {
    console.error('[Direct] Reddit failed:', reddit.reason?.message);
  }

  return results.filter(r => r.title);
}
