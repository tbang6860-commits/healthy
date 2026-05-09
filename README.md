# FitCal — 小食智能健身饮食助手

基于 **纯前端 AI Agent 架构** 的健身饮食管理应用。支持食物热量计算、AI 饮食规划、食谱推荐、饮食记录，以及大模型智能对话。核心计算完全本地执行，AI 仅用于复杂咨询和对话润色。

---

## 核心功能

| 功能 | 说明 | 技术特点 |
|------|------|---------|
| **热量计算** | 输入"鸡胸肉 200g"自动计算热量和营养 | 本地正则解析 + 食物数据库 |
| **人体分析** | BMI、BMR、TDEE 计算与解读 | Mifflin-St Jeor 公式 |
| **食谱推荐** | 根据减脂/维持/增肌目标推荐一日食谱 | 内置食谱库 + AI 生成 |
| **饮食记录** | 记录每日饮食，统计热量进度 | localStorage 持久化 |
| **AI 对话** | 通过 Agent 自主决策调用 Skill | 硅基流动 API（OpenAI 兼容） |
| **离线使用** | 无网络、无 API Key 时核心功能 100% 可用 | 本地公式 + 内置数据库 |

---

## 技术栈总览

### 基础设施
- **前端框架**：React 18 + Vite + JSX
- **存储**：localStorage（前端本地）
- **网络**：Fetch API（调用硅基流动 LLM API）
- **向量化**：`@xenova/transformers`（浏览器端文本 Embedding）

### AI 核心技术
- **Prompt 工程**：BROKE 框架 + Few-shot 学习
- **Function Calling**：OpenAI 兼容格式工具调用
- **Agent 模式**：ReAct 思想（推理→行动→观察→回答）
- **RAG**：向量检索增强生成（语义相似度匹配）
- **LangChain 思想**：纯 JS 实现 Chain、Pipe、Memory、Tool、Agent
- **Skill 封装**：5 个业务 Skill，支持 Skill 间互相调用

---

## 项目结构

```
health/
├── assets/                    ← 图片、字体等资源
├── src/
│   ├── components/            ← React 组件（Modal、Tabs）
│   │   ├── Modal.css / Modal.jsx
│   │   └── Tabs.css / Tabs.jsx
│   ├── pages/                 ← React 页面组件
│   │   ├── Home.css / Home.jsx
│   │   ├── Diet.css / Diet.jsx
│   │   ├── Calorie.css / Calorie.jsx
│   │   ├── Records.css / Records.jsx
│   │   └── Settings.css / Settings.jsx
│   ├── js/                    ← 业务逻辑层
│   │   ├── agents/
│   │   │   └── masterAgent.js      ← 主控 Agent（规划→执行→反思）
│   │   ├── autogen/           ← 4 个业务助手
│   │   │   ├── calorieCalculator.js
│   │   │   ├── dietPlanner.js
│   │   │   ├── recipeRecommender.js
│   │   │   └── systemManager.js    ← AI 路由 + 离线降级
│   │   ├── core/              ← LangChain + PromptBuilder
│   │   │   ├── langchain.js
│   │   │   └── promptBuilder.js
│   │   ├── data/              ← 数据层
│   │   │   ├── foodData.js
│   │   │   ├── importer.js
│   │   │   └── storage.js
│   │   ├── rag/               ← 向量检索
│   │   │   ├── retriever.js
│   │   │   ├── sync.js
│   │   │   └── vectorDb.js
│   │   ├── skills/            ← 🔥 业务 Skill 层（5 个 Skill）
│   │   │   ├── skillBase.js
│   │   │   ├── bodyAnalysisSkill.js
│   │   │   ├── calorieSkill.js
│   │   │   ├── dietSkill.js
│   │   │   ├── foodQuerySkill.js
│   │   │   └── recipeSkill.js
│   │   └── utils/
│   │       └── helpers.js
│   ├── App.css / App.jsx      ← 根组件
│   ├── main.jsx               ← React 入口
│   └── style.css              ← 全局样式
├── index.html                 ← Vite 入口
├── vite.config.js             ← Vite 配置
├── package.json               ← 依赖配置（react + vite）
├── .gitignore
├── README.md                  ← 项目总览（本文档）
├── SKILLS.md                  ← Skill 使用指南
├── TECHNOLOGY.md              ← AI 技术详解
├── UI_DESIGN.md               ← 前端设计系统
├── INSTALL.md                 ← 安装和运行指南
├── CHECKLIST.md               ← 改造检查清单
├── DEBUG.md                   ← 调试指南
└── FIX-GUIDE.md               ← 常见错误修复
```

---

## AI 架构详解

### 六层架构

```
┌─────────────────────────────────────────┐
│  Layer 6: 用户界面层（UI Layer）         │
│    首页仪表盘 / 食谱聊天页 / 热量计算页   │
│    记录管理页 / 设置页                   │
│    技术：React 18 + CSS3 Flex/Grid       │
├─────────────────────────────────────────┤
│  Layer 5: 应用调度层（App Layer）        │
│    Tab 切换 / 表单绑定 / 页面刷新         │
│    技术：React Hooks + Vite HMR          │
├─────────────────────────────────────────┤
│  Layer 4: 智能代理层（Agent Layer）      │
│    MasterAgent — 统一 AI 入口            │
│    ├─ 5 个 Skill（业务场景封装）          │
│    ├─ LangChain Agent（工具选择与调度）   │
│    ├─ Conversation Memory（对话上下文）   │
│    └─ API 路由（硅基流动 / 离线降级）     │
├─────────────────────────────────────────┤
│  Layer 3: AI 核心层（AI Core Layer）     │
│    PromptBuilder（BROKE + Few-shot）     │
│    LangChainCore（链式调用基础设施）      │
│    技术：纯 JS 实现                       │
├─────────────────────────────────────────┤
│  Layer 2: 业务封装层（Business Layer）   │
│    5 个 Skill + 4 个 Autogen 助手         │
│    ├─ BodyAnalysisSkill（BMI/BMR/TDEE）   │
│    ├─ CalorieSkill（热量/营养计算）       │
│    ├─ RecipeSkill（食谱推荐）             │
│    ├─ FoodQuerySkill（食物查询）          │
│    └─ DietSkill（饮食规划，组合调用）     │
├─────────────────────────────────────────┤
│  Layer 1: 数据层（Data Layer）           │
│    食物数据库 / 食谱库 / 用户资料         │
│    向量数据库 / 对话记忆                   │
│    技术：localStorage + @xenova/transformers
└─────────────────────────────────────────┘
```

### 5 个 Skill 及调用关系

| Skill | 职责 | 是否调用其他 Skill |
|-------|------|------------------|
| `body_analysis` | BMI、BMR、TDEE 计算 | ❌ 独立 |
| `food_query` | 食物营养查询 | ❌ 独立 |
| `recipe_recommend` | 食谱推荐 | ❌ 独立 |
| `calorie_calculate` | 热量计算 | ❌ 独立 |
| `diet_plan` | 完整饮食规划 | ✅ 组合 calorie + recipe |

**Skill 间调用示例**：
```
用户："帮我制定一周减脂计划"
  → MasterAgent 选择 diet_plan Skill
  → DietSkill 内部调用 CalorieSkill 计算每日热量
  → DietSkill 内部调用 RecipeSkill 生成食谱
  → 组装成完整的一周饮食方案返回
```

---

## 快速启动

### 方式一：开发模式

```bash
# 进入项目目录
cd health

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器自动打开 http://localhost:3000
```

### 方式二：构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

---

## 配置 AI API（可选）

应用**无需 API Key 也能使用**核心功能。如需 AI 对话：

1. 访问 [siliconflow.cn](https://siliconflow.cn) 注册并获取 API Key
2. 在「设置」页填写：
   - API 地址：`https://api.siliconflow.cn/v1/chat/completions`
   - API Key：你的密钥
   - 模型：`Qwen/Qwen2.5-7B-Instruct`（免费）


## 技术亮点

1. **AI 按需调用**：简单计算本地做，复杂问答走 AI，历史问题靠 RAG。不是事事问 AI。
2. **纯前端 AI Agent**：无后端服务器，浏览器直接跑 LLM 调用 + 向量检索 + Agent 决策 + 工具执行。
3. **Prompt 工程系统化**：BROKE 框架 + Few-shot 示例，让 AI 输出稳定、专业、有风格。
4. **模块化 Skill 架构**：从"散装 Tool"升级到"业务 Skill"，支持 Skill 间互相调用。
5. **离线优先设计**：三级降级策略，无网/无 API 时核心功能 100% 可用。

---

## 更新日志

### 2024-05-07
- **修复模块加载顺序**: MasterAgent 改为延迟初始化，确保所有 Skill 加载完成后再创建实例
- **修复 ES Module 导入**: systemManager.js、calorieCalculator.js、dietPlanner.js 添加兼容导出
- **改进错误处理**: Diet.jsx 正确显示 Skill 错误信息而非 JSON 字符串
- **优化用户体验**: 首页当资料不完整时显示明确提示，引导用户完善信息

## 相关文档

| 文档 | 内容 |
|------|------|
| [SKILLS.md](SKILLS.md) | 5 个 Skill 的详细用法、参数、返回值 |
| [TECHNOLOGY.md](TECHNOLOGY.md) | AI 技术详解（BROKE、Function Calling、Agent、RAG、LangChain） |
| [UI_DESIGN.md](UI_DESIGN.md) | 前端设计系统（颜色、组件、图标规范） |
| [INSTALL.md](INSTALL.md) | 安装和运行指南 |
| [CHECKLIST.md](CHECKLIST.md) | 改造检查清单 |
| [DEBUG.md](DEBUG.md) | 调试指南 |
| [FIX-GUIDE.md](FIX-GUIDE.md) | 常见错误修复指南 |
