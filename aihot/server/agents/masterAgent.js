import { MonitorSkill } from './skills/monitorSkill.js';
import { AnalyzeSkill } from './skills/analyzeSkill.js';
import { PushSkill } from './skills/pushSkill.js';
import { chat } from '../ai/client.js';

/**
 * MasterAgent — 热点分析领域的总调度 Agent
 *
 * 架构: Plan → Execute → Reflect 循环（最多 3 轮）
 * 路由策略:
 *   1. 规则匹配 (正则/关键词) — 快路径
 *   2. AI 意图识别 — DeepSeek 选择 Skill
 *   3. 关键词回退
 */
export class MasterAgent {
  constructor() {
    this.skills = {
      monitor: new MonitorSkill(),
      analyze: new AnalyzeSkill(),
      push: new PushSkill(),
    };

    this.maxIterations = 3;
    this.conversationHistory = [];
  }

  /**
   * 主入口: 接收用户自然语言输入，返回结果
   */
  async run(userInput) {
    const originalInput = userInput;
    let currentInput = userInput;
    const steps = [];

    for (let i = 0; i < this.maxIterations; i++) {
      // Phase 1: Plan — 选择 Skill + 提取参数
      const plan = await this._makePlan(currentInput, steps);
      if (!plan) {
        return {
          answer: '抱歉，我无法理解你的需求。你可以试试：\n- "有什么新热点？"\n- "分析一下XX话题"\n- "订阅科技类热点"',
          steps,
          iterations: i + 1,
        };
      }

      // Phase 2: Execute
      const execResult = await this._executePlan(plan);
      steps.push({ plan, result: execResult });

      // Phase 3: Reflect
      const reflection = this._reflect(originalInput, execResult, steps);

      if (reflection.satisfied) {
        // 保存到对话历史
        this.conversationHistory.push(
          { role: 'user', content: originalInput },
          { role: 'assistant', content: execResult.data?.message || execResult.data?.analysis || JSON.stringify(execResult.data) }
        );
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        return {
          answer: this._formatAnswer(execResult, plan),
          plan: { skill: plan.skill, action: plan.action },
          steps,
          iterations: i + 1,
        };
      }

      if (reflection.needMoreInfo) {
        return {
          question: reflection.question,
          pending: true,
          context: { lastSkill: plan.skill, lastAction: plan.action },
          steps,
          iterations: i + 1,
        };
      }

      // 不满意 → 调整输入再试
      currentInput = reflection.adjustInput || currentInput;
    }

    return {
      answer: '我尝试了多次但未能得到满意结果，请换个方式提问。',
      steps,
      iterations: this.maxIterations,
    };
  }

  /**
   * Phase 1: Plan — 决定用哪个 Skill 和什么参数
   */
  async _makePlan(input, history) {
    // Tier 1: 规则匹配（快路径）
    const rulePlan = this._ruleBasedPlan(input);
    if (rulePlan) return rulePlan;

    // Tier 2: AI 意图识别
    try {
      const aiPlan = await this._aiBasedPlan(input, history);
      if (aiPlan) return aiPlan;
    } catch (e) {
      console.error('[MasterAgent] AI plan failed:', e.message);
    }

    // Tier 3: 关键词回退
    return this._fallbackPlan(input);
  }

  /**
   * Tier 1: 规则匹配
   */
  _ruleBasedPlan(input) {
    const text = input.toLowerCase();

    // 推送类（优先匹配，因为更具体）
    if (/订阅.*列表|我.*订阅了.*什么|有哪些订阅/.test(text)) {
      return { skill: 'push', action: 'list', params: { action: 'list' } };
    }
    if (/订阅|关注.*类|想.*看.*类/.test(text)) {
      const cat = this._extractCategory(input);
      return { skill: 'push', action: 'subscribe', params: { action: 'subscribe', category: cat } };
    }
    if (/取消|退订|不再/.test(text)) {
      const cat = this._extractCategory(input);
      return { skill: 'push', action: 'unsubscribe', params: { action: 'unsubscribe', category: cat } };
    }
    if (/推送|给我推|有什么.*推荐|看点.*内容/.test(text)) {
      return { skill: 'push', action: 'push', params: { action: 'push' } };
    }

    // 搜索类
    if (/搜索|找.*话题|查.*热点|有没有.*关于/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'search', params: { action: 'search', topic } };
    }

    // 分析类
    if (/分析|解读|怎么看|评价/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'deep_analyze', params: { action: 'deep_analyze', topic } };
    }
    if (/对比|各平台|不同.*讨论|跨平台/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'cross_source', params: { action: 'cross_source', topic } };
    }
    if (/预测|趋势|未来|走向|还会.*火/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'trend_predict', params: { action: 'trend_predict', topic } };
    }
    if (/相关|关联|相似|同类型/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'related_topics', params: { action: 'related_topics', topic } };
    }

    // 监控类（通用模式放最后）
    if (/新热点|最新|有什么新|新话题|刚出来的/.test(text)) {
      return { skill: 'monitor', action: 'new_hotspots', params: { action: 'new_hotspots' } };
    }
    if (/飙升|上升|涨了|热度涨|什么话题火|最火/.test(text)) {
      return { skill: 'monitor', action: 'rising_hotspots', params: { action: 'rising_hotspots' } };
    }
    if (/异常|波动|突[然发]|警报|爆了/.test(text)) {
      return { skill: 'monitor', action: 'anomalies', params: { action: 'anomalies' } };
    }
    if (/概况|总体|总结|最近怎么样|热点情况/.test(text)) {
      return { skill: 'monitor', action: 'summary', params: { action: 'summary' } };
    }

    return null;
  }

  /**
   * Tier 2: AI 意图识别
   */
  async _aiBasedPlan(input, history) {
    const toolDefs = Object.values(this.skills).map(s => s.toToolDef());

    const systemPrompt = `你是热点分析助手，根据用户输入选择合适的工具。

可用工具:
1. hotspot_monitor - 监控热点变化：新热点、飙升话题、异常波动、综合摘要
   参数: action (new_hotspots/rising_hotspots/anomalies/summary), category (可选), limit (可选)

2. hotspot_analyze - 深度分析：话题解读、跨源对比、趋势预判、相关话题、搜索
   参数: action (deep_analyze/cross_source/trend_predict/related_topics/search), topic (必填，搜索关键词或话题名)

3. hotspot_push - 订阅管理：订阅、取消、查看订阅、获取推送
   参数: action (subscribe/unsubscribe/list/push), category (subscribe/unsubscribe时需要)

请直接回复 JSON（不要包含其他文字）:
{"skill": "monitor|analyze|push", "action": "...", "params": {"action": "...", ...}}`;

    const response = await chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ], { temperature: 0.3, max_tokens: 300, jsonMode: true });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]);
        if (plan.skill && this.skills[plan.skill]) {
          return plan;
        }
      }
    } catch { /* parse error, fall through */ }

    return null;
  }

  /**
   * Tier 3: 关键词回退
   */
  _fallbackPlan(input) {
    // 分类检测
    const categoryMap = {
      '科技': 'analyze', '娱乐': 'analyze', '社会': 'analyze',
      '财经': 'analyze', '体育': 'analyze', '国际': 'analyze',
      '军事': 'analyze', '健康': 'analyze', '教育': 'analyze',
    };
    const cat = this._extractCategory(input);
    if (cat && categoryMap[cat]) {
      return { skill: 'analyze', action: 'deep_analyze', params: { action: 'deep_analyze', topic: cat } };
    }

    // 搜索意图
    if (input.length > 2) {
      return { skill: 'analyze', action: 'search', params: { action: 'search', topic: input } };
    }

    return null;
  }

  /**
   * Phase 2: Execute
   */
  async _executePlan(plan) {
    const skill = this.skills[plan.skill];
    if (!skill) {
      return { success: false, error: `未找到 Skill: ${plan.skill}` };
    }

    const validation = skill.validate(plan.params || {});
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    return await skill.run(plan.params || {});
  }

  /**
   * Phase 3: Reflect — 评估结果质量
   */
  _reflect(originalInput, result, history) {
    // 错误
    if (!result.success) {
      // 如果是"未找到话题"，提示用户
      if (result.error?.includes('未找到')) {
        return {
          satisfied: false,
          needMoreInfo: true,
          question: `未找到相关话题，请提供更具体的关键词或热点标题。`,
        };
      }
      // 其他错误先返回
      return { satisfied: true };
    }

    // 空数据
    if (result.data && result.data.count === 0 && result.data.message) {
      return { satisfied: true };
    }

    // 满意
    return { satisfied: true };
  }

  /**
   * 格式化最终回答
   */
  _formatAnswer(result, plan) {
    if (!result.success) {
      return `操作失败: ${result.error}`;
    }

    const data = result.data;

    switch (plan.skill) {
      case 'monitor':
        return data.message || JSON.stringify(data);

      case 'analyze':
        if (data.analysis) return data.analysis;
        if (data.message) return data.message;
        return `关于"${data.topic || '该话题'}"的分析结果:\n${JSON.stringify(data, null, 2)}`;

      case 'push':
        if (data.notification) {
          return `${data.message}\n\n${data.notification.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;
        }
        return data.message || JSON.stringify(data);

      default:
        return data.message || data.analysis || '操作完成';
    }
  }

  /**
   * 从输入中提取话题关键词
   */
  _extractTopic(input) {
    // 移除常见的动作词，提取剩余内容作为话题
    const cleaned = input
      .replace(/分析|解读|怎么看|评价|对比|预测|趋势|搜索|是什么|为什么|怎么样/g, '')
      .replace(/一下|帮我|请你|请|想知道|想了解/g, '')
      .trim();

    return cleaned || input.trim();
  }

  /**
   * 从输入中提取分类
   */
  _extractCategory(input) {
    const cats = ['科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育'];
    for (const cat of cats) {
      if (input.includes(cat)) return cat;
    }
    return null;
  }

  /**
   * 清除对话历史
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}

// 单例
const masterAgent = new MasterAgent();
export default masterAgent;
