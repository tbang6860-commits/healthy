# PulseSphere — AI 热点聚合分析平台

> 多源实时热点聚合 · DeepSeek V4 智能分析 · 暗黑高级仪表盘

---

## 快速开始

```bash
# 后端
cd server && npm install && npm start        # http://localhost:3000

# 前端
cd client && npm install && npm run dev      # http://localhost:5173
```

---

## 项目结构

```
aihot/
├── server/                        # Express 5 后端
│   ├── index.js                   # 入口
│   ├── config.js                  # 环境变量
│   ├── db.js                      # better-sqlite3
│   ├── fetcher/                   # Firecrawl + Twitter 抓取
│   ├── ai/                        # DeepSeek V4 分析引擎
│   ├── aggregator.js              # 多源去重 + 热度打分
│   ├── scheduler.js               # node-cron 30min 定时
│   └── routes/                    # REST API
├── client/                        # React 18 前端
│   └── src/
│       ├── App.jsx                # 路由 + 全局状态
│       ├── pages/
│       │   ├── Dashboard.jsx      # Bento Grid 热点看板
│       │   ├── TopicDetail.jsx    # 热点详情 + AI 分析
│       │   ├── Trends.jsx         # 24h 趋势图表
│       │   ├── Settings.jsx       # 数据源状态 + 配置
│       │   └── AgentChat.jsx      # AI 对话助手
│       ├── components/
│       │   ├── HotCard.jsx        # 热点卡片
│       │   ├── HeatBadge.jsx      # 热度条
│       │   ├── SourceTag.jsx      # 平台标签
│       │   ├── Navbar.jsx         # 顶部导航
│       │   └── TrendChart.jsx     # SVG 趋势图
│       └── index.css              # 全局样式 + 设计 Token
├── TECH_PLAN.md                   # 技术方案详情
├── REQUIREMENTS.md                # 需求文档
└── README.md                      # 本文件
```

---

## 设计系统 — PulseSphere Dark Premium

### 设计理念

以"脉冲宇宙"为隐喻 — 每个热点是一颗脉冲星，热度越高脉冲越强。暗黑背景营造太空深邃感，青色霓虹作为统一的高亮色贯穿全平台。

### 色彩 Token

| Token | Hex | 用途 |
|-------|-----|------|
| `--bg-root` | `#0f0f0f` | 页面根背景 |
| `--bg-card` | `#1a1a1a` | 卡片/表面背景 |
| `--border-card` | `#2a2a2a` | 卡片边框 |
| `--border-active` | `#4cc9f0` | 悬停/激活边框 |
| `--accent` | `#4cc9f0` | 全局高亮色（氰蓝） |
| `--text-primary` | `#ffffff` | 主文本 |
| `--text-secondary` | `#a0a0a0` | 次要文本 |
| `--text-muted` | `#8a8a8a` | 辅助文本（通过 WCAG AA） |

### 热度色阶

| 等级 | 渐变 | 阈值 |
|------|------|------|
| 高热 | `#4cc9f0 → #4361ee` | > 70° |
| 中热 | `#3a7bd5 → #3060c0` | 30°–70° |
| 低热 | `#2a4a6c → #3a5478` | < 30° |

### 平台来源标签

| 平台 | 配色 | 说明 |
|------|------|------|
| 微博 | `#ff6498` | 半透明粉底 + 粉色边框 |
| 百度 | `#6d90ff` | 半透明蓝底 |
| 知乎 | `#33eaff` | 半透明青底 |
| Twitter/X | `#33f092` | 半透明绿底 |
| B 站 | `#fb7299` 实底 + 白字 | 品牌粉专属样式 |
| V2EX | `#a0a0a0` | 低调灰 |
| HN | `#ff8844` | 半透明橙底 |
| GitHub | `#c8d2dc` | 半透明白底 |

### 核心交互

- **卡片悬停**: `translateY(-2px)` + 边框高亮 `#4cc9f0` + 阴影扩散
- **入场动画**: `fadeInUp` 0.3s ease-out，卡片按索引交错延迟 40ms
- **分类切换**: framer-motion `AnimatePresence` 淡入淡出 0.2s
- **骨架屏**: shimmer 动画 1.5s，`#1a1a1a → #222 → #1a1a1a` 渐变

---

## UI/UX Pro Max 设计审计记录

> **审计日期**: 2026-05-06 | **审计工具**: UI/UX Pro Max Skill (v10 优先级体系)

### 审计摘要

基于 UI/UX Pro Max 技能的 10 级优先级规则体系（Accessibility → Charts），对 PulseSphere v1.0 暗黑高级仪表盘进行了系统性审查。共发现 **5 类问题**，已全部修复。

### 修复清单

#### 1. 颜色对比度 — Accessibility (Priority 1)

**问题**: `#6b6b6b` 辅助文本在 `#1a1a1a`(卡片) 和 `#0f0f0f`(背景) 上的对比度分别为 ~3.3:1 和 ~3.6:1，**未达 WCAG AA 4.5:1 标准**。

**修复**: 全局 `#6b6b6b → #8a8a8a`。新对比度在卡片背景上为 ~4.7:1，在根背景上为 ~5.3:1，**均通过 AA 级**。

| 场景 | 修复前 | 修复后 | 标准 |
|------|--------|--------|------|
| 辅助文本 on 卡片 | 3.3:1 | 4.7:1 | ≥ 4.5:1 |
| 辅助文本 on 背景 | 3.6:1 | 5.3:1 | ≥ 4.5:1 |

**影响文件**: `index.css`, `Navbar.jsx`, `Dashboard.jsx`, `Trends.jsx`, `TopicDetail.jsx`, `TrendChart.jsx`, `Settings.jsx`, `AgentChat.jsx`

#### 2. Focus 环 — Accessibility (Priority 1)

**问题**: 所有交互元素缺少 `:focus-visible` 样式，键盘 Tab 导航用户无法判断当前焦点位置。

**修复**:
- 全局 CSS 添加 `:focus-visible { outline: 2px solid #4cc9f0; outline-offset: 2px; }`
- App.jsx 添加 `.skip-link` 组件，首个 Tab 即可跳至 `<main id="main-content">`

#### 3. 触摸目标 — Touch & Interaction (Priority 2)

**问题**: 分类标签(~38px)、来源标签(<30px)、刷新按钮(32px) 高度均小于 Apple HIG / Material Design 规定的 44px 最小触摸目标。

**修复**:
- 导航标签、分类标签、快捷按钮: 添加 `min-h-[44px]`
- 刷新按钮: `min-w-[44px] min-h-[44px]`
- 分类标签间距: `gap-1.5`(6px) → `gap-2`(8px)

#### 4. 减少动画 — Animation (Priority 7)

**问题**: 未提供 `prefers-reduced-motion` 媒体查询，动画对前庭敏感用户不友好。

**修复**:
- 添加 `@media (prefers-reduced-motion: reduce)` 规则，所有动画/过渡归零
- Card hover 的 `translateY` 在 reduced-motion 下禁用
- `fadeInUp` 入场动画从 0.4s 收紧至 0.3s（Apple HIG 推荐范围）

#### 5. 键盘无障碍 — Navigation (Priority 9)

**问题**: HotCard 为 `<div onclick>` 实现，键盘用户无法通过 Enter/Space 激活。

**修复**:
- HotCard 添加 `role="button"` + `tabIndex={0}` + `onKeyDown` 处理 Enter/Space
- 每个 HotCard 设置 `aria-label` 告知屏幕阅读器目标内容
- AgentChat 对话区添加 `role="log"`，输入框添加 `aria-label`
- 刷新按钮添加 `aria-label="手动刷新数据"`

#### 6. 元数据修正

- `<html lang="en">` → `lang="zh-CN"`（页面内容为中文）
- `<title>client</title>` → `<title>PulseSphere — AI 热点聚合分析</title>`

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19.x |
| 构建工具 | Vite | 8.x |
| CSS 框架 | Tailwind CSS | 4.x |
| 动画库 | framer-motion | 12.x |
| 图标库 | lucide-react | 1.x |
| 后端框架 | Express | 5.x |
| 数据库 | better-sqlite3 | - |
| AI 引擎 | DeepSeek V4 | `deepseek-v4-flash` |
| 定时任务 | node-cron | - |

---

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hotspots` | 热点列表（`?category=&source=&limit=`） |
| GET | `/api/hotspots/trends` | 24h 趋势数据 |
| GET | `/api/hotspots/:id` | 热点详情 + AI 分析 |
| GET | `/api/sources` | 数据源状态 |
| POST | `/api/sources/refresh` | 手动触发刷新 |
| POST | `/api/agent/chat` | AI 助手对话 |

---

## 数据流

```
node-cron (30min)
    │
    ├─→ Firecrawl API → 微博 / 百度 / 知乎
    └─→ twitterapi.io  → Twitter 趋势
            │
            ▼
    Aggregator (去重 + 打分)
            │
            ▼
    DeepSeek V4 (摘要 + 分类 + 情感)
            │
            ▼
    SQLite → Express 5 API → React Frontend
```
