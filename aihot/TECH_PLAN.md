# AI 热点聚合分析平台 — 技术方案

> 版本：v1.1 | 日期：2026-05-05 | 后端：Node.js + Express 5

---

## 1. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **后端框架** | Express 5.1 | 2025-03 起为 npm latest，支持 async/await 自动错误处理 |
| **运行时** | Node.js >= 18 | Express 5 最低要求 |
| **AI 服务** | DeepSeek V4 (`deepseek-v4-flash`) | OpenAI 兼容协议，npm `openai` SDK |
| **网页抓取** | Firecrawl REST API | 通过 `axios` 调用 `/v1/scrape` 端点 |
| **Twitter 数据** | twitterapi.io REST API | `X-API-Key` Header 认证 |
| **数据存储** | better-sqlite3 | 同步 SQLite，零配置，高性能 |
| **定时任务** | node-cron | 30 分钟间隔 cron 表达式 |
| **配置管理** | dotenv | `.env` 文件（Node.js 标准） |
| **前端** | React 18 + Vite + Tailwind CSS | 独特"脉冲宇宙"主题 |
| **浏览器通知** | Web Notification API | 用户授权后弹窗 |

## 2. API 对接方案

### 2.1 DeepSeek V4

```js
// npm install openai
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const response = await client.chat.completions.create({
  model: 'deepseek-v4-flash',
  messages: [
    { role: 'system', content: '你是热点分析助手...' },
    { role: 'user', content: '分析以下热点...' },
  ],
  temperature: 1.0,
  top_p: 1.0,
  max_tokens: 2048,
});

console.log(response.choices[0].message.content);
```

> 旧版 `deepseek-chat` 将于 2026/7/24 停用，直接用 `deepseek-v4-flash`

### 2.2 Firecrawl（通过 REST API，不依赖 SDK）

```js
// 直接调用 REST API，无需额外 SDK
import axios from 'axios';

const res = await axios.post(
  'https://api.firecrawl.dev/v1/scrape',
  {
    url: 'https://weibo.com/ajax/side/hotSearch',
    formats: ['markdown'],
    onlyMainContent: true,
  },
  {
    headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
  }
);

const data = res.data.data; // { markdown, html, metadata }
```

抓取目标：
- 微博热搜: `https://weibo.com/ajax/side/hotSearch` → JSON 直接解析
- 百度热搜: `https://top.baidu.com/board?tab=realtime` → HTML 解析
- 知乎热榜: `https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total` → JSON 解析

### 2.3 twitterapi.io

```js
const res = await axios.get('https://api.twitterapi.io/twitter/trends', {
  headers: { 'X-API-Key': process.env.TWITTER_API_KEY },
});

// 或搜索热推
const res2 = await axios.post(
  'https://api.twitterapi.io/twitter/tweet/advanced_search',
  { query: 'breaking OR trending', queryType: 'Top' },
  { headers: { 'X-API-Key': process.env.TWITTER_API_KEY } }
);
```

## 3. Express 5 关键特性（利用点）

| 特性 | 说明 |
|------|------|
| **async 路由自动错误处理** | `app.get('/', async (req, res) => { ... })` 抛出的 rejected promise 自动转发给错误中间件，无需 try/catch |
| **路径语法更新** | 通配符必须命名：`/{*splat}` 代替 `/*` |
| **查询字符串** | 设置 `app.set('query parser', 'extended')` 恢复嵌套对象支持 |
| **安全增强** | 不再支持路由正则子表达式（防 ReDoS），HTTP 状态码严格校验 |

## 4. 项目结构

```
aihot/
├── REQUIREMENTS.md
├── TECH_PLAN.md
├── README.md
├── .env                        # 环境变量（API Keys，不提交 git）
├── .env.example                # 环境变量示例
├── .gitignore
├── package.json                # 后端 + 前端统一或分离
├── server/                     # ← Express 5 后端
│   ├── index.js                # 入口：Express app + 生命周期
│   ├── config.js               # 读 .env，导出配置对象
│   ├── db.js                   # better-sqlite3 初始化 + 建表
│   ├── fetcher/
│   │   ├── index.js            # 统一调度：并行抓取 4 源 → raw items
│   │   ├── firecrawl.js        # Firecrawl REST 封装
│   │   └── twitter.js          # twitterapi.io 封装
│   ├── ai/
│   │   ├── client.js           # DeepSeek V4 OpenAI SDK 封装
│   │   ├── analyzer.js         # 热点分析引擎（prompt 编排）
│   │   └── prompts.js          # Prompt 模板
│   ├── aggregator.js           # 多源去重 + 热度打分 + 新旧对比
│   ├── scheduler.js            # node-cron 30min 定时任务
│   └── routes/
│       ├── hotspots.js         # /api/hotspots, /api/hotspots/:id
│       ├── analyze.js          # POST /api/analyze
│       └── sources.js          # /api/sources, POST /api/sources/refresh
├── client/                     # ← React 前端
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── hooks/
│       │   └── useNotifications.js
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── TopicDetail.jsx
│       │   ├── Trends.jsx
│       │   └── Settings.jsx
│       ├── components/
│       │   ├── HotCard.jsx
│       │   ├── HeatBadge.jsx
│       │   ├── SourceTag.jsx
│       │   ├── Navbar.jsx
│       │   ├── TrendChart.jsx
│       │   └── PulseRing.jsx
│       └── index.css
```

## 5. 数据流

```
┌─────────────────────────────────────────────────┐
│              node-cron (每30分钟)                  │
│                      │                            │
│      ┌───────────────┼───────────────┐            │
│      ▼               ▼               ▼            │
│  Firecrawl API  Firecrawl API  twitterapi.io     │
│  微博热搜 JSON  百度热搜 HTML  知乎热榜 JSON      │
│      │               │               │            │
│      └───────────────┼───────────────┘            │
│                      ▼                            │
│           Fetcher → 解析 → 标准化                  │
│      [{title, url, heatScore, source}]            │
│                      │                            │
│                      ▼                            │
│           Aggregator                             │
│      · 标题相似度去重（阈值 0.7）                  │
│      · 跨源关联合并                               │
│      · 统一热度打分（0-100）                      │
│      · 对比上一轮 → 标记 isNew / isRising         │
│                      │                            │
│                      ▼                            │
│           AI Analyzer (DeepSeek V4)               │
│      · 热点摘要（50字）                           │
│      · 分类标注（10类别）                         │
│      · 情感分析                                   │
│                      │                            │
│                      ▼                            │
│           better-sqlite3 存储                     │
│      hotspots 表 + snapshots 表                   │
│                      │                            │
│                      ▼                            │
│           Express 5 REST API                     │
│      /api/hotspots?category=&source=&page=       │
│      /api/hotspots/:id                            │
│      /api/hotspots/trends                         │
│                      │                            │
│                      ▼                            │
│           React Frontend                         │
│      Dashboard → HotCard → PulseRing             │
│      Browser Notification API                    │
└─────────────────────────────────────────────────┘
```

## 6. .env 设计

```env
# DeepSeek V4
DEEPSEEK_API_KEY=sk-94aa400554e24512853b940c8f433d79
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-v4-flash

# Firecrawl
FIRECRAWL_API_KEY=ctx7sk-3203e30b-89f5-4a4a-bc00-2e8bc424294d
FIRECRAWL_BASE_URL=https://api.firecrawl.dev

# Twitter API
TWITTER_API_KEY=new1_8aa4d2d2ba5c49eb927f61dcc4ff1638
TWITTER_BASE_URL=https://api.twitterapi.io

# Server
PORT=3000
REFRESH_INTERVAL_MINUTES=30
```

## 7. 数据库设计

```sql
CREATE TABLE hotspots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    category TEXT,
    sentiment TEXT,
    sentiment_score REAL,
    heat_score REAL DEFAULT 0,
    sources TEXT,           -- JSON: [{source, url, rawHeat}]
    related_ids TEXT,
    is_new INTEGER DEFAULT 1,
    is_rising INTEGER DEFAULT 0,
    snapshot_time TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hotspot_id INTEGER,
    heat_score REAL,
    snapshot_time TEXT,
    FOREIGN KEY (hotspot_id) REFERENCES hotspots(id)
);
```

## 8. API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hotspots?source=&category=&page=&limit=&onlyNew=` | 热点列表 |
| GET | `/api/hotspots/:id` | 热点详情 + AI 分析 |
| GET | `/api/hotspots/trends` | 24h 趋势数据 |
| GET | `/api/sources` | 数据源状态 |
| POST | `/api/sources/refresh` | 手动触发刷新 |

## 9. 前端通知机制

```
后端 API 返回 { hasNew: true, newCount: 3 }
        │
        ▼
1. Notification API 弹窗
   "🔥 发现 3 个新热点：XXX、YYY..."
        │
2. 页面 Title 闪烁
   "[新] AI热点聚合" ↔ "AI热点聚合"
        │
3. HotCard 红色脉冲标记
   isNew=true → PulseRing 动画
        │
4. Navbar 新热点计数角标
   红色数字 badge
```

## 10. 实施步骤

| 步 | 内容 | 关键文件 | 验证 |
|----|------|----------|------|
| 1 | 项目骨架 + .env + 依赖 | server/index.js, server/config.js, server/db.js | `node server/index.js` 启动 |
| 2 | 数据抓取模块 | server/fetcher/* | `node -e "require('./server/fetcher').fetchAll()"` |
| 3 | AI + 聚合 + 路由 | server/ai/*, aggregator.js, routes/* | `curl /api/hotspots` |
| 4 | 前端 UI | client/* | `npm run dev` → 浏览器 |
| 5 | 联调 + 通知 + 定时 | scheduler.js, useNotifications.js | 30min 刷新 + 通知 |
| 6 | Agent Skills | skills/* | Agent 自主分析 |
