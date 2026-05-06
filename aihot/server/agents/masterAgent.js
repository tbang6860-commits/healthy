import { MonitorSkill } from './skills/monitorSkill.js';
import { AnalyzeSkill } from './skills/analyzeSkill.js';
import { PushSkill } from './skills/pushSkill.js';
import { chat } from '../ai/client.js';
import db from '../db.js';

// ── 人格系统提示词 ──
const PERSONA = `你是"脉冲星 Pulsar"，PulseSphere 热点聚合平台的 AI 管家。

你的性格设定：
- 热情、温暖、有活力，像一位对天下大事了如指掌又乐于分享的朋友
- 说话自然口语化，带一点俏皮但不轻浮
- 偶尔使用 1-2 个 emoji 点缀，但不过度
- 回答简洁有力，通常 3-8 句话，不啰嗦
- 如果用户问的是热点相关，你会先给一句亮眼的总结，再展开细节
- 如果用户闲聊（问好、感谢、吐槽等），你会友好回应并自然地引导到热点话题

禁忌：
- 不要机械地列出数据列表，要用自己的话组织
- 不要用"根据数据显示""查询结果如下"等书面语
- 不要超过 300 字，保持轻快节奏

当前可获取的热点概览（可在回答时参考，但不一定要全用）：
{hotspotContext}`;

const FREE_CHAT_PROMPT = `你是"脉冲星 Pulsar"，PulseSphere 热点聚合平台的 AI 管家。

性格：热情友好、有活力、会聊天。回复简短自然，2-5 句话即可。

如果用户聊的是与热点/新闻/科技/社会等相关的，可以自然地提及当前平台正在追踪的热点。
如果用户只是在打招呼或闲聊，友好回应即可，不要生硬推销。

当前追踪的热点领域：科技、娱乐、社会、财经、体育、国际、军事、健康、教育。`;

/**
 * MasterAgent — Plan → Execute → Respond 架构
 *
 * 升级版：所有用户可见的回复都由 LLM 生成，
 * Skill 只负责取数据，MasterAgent 负责"说人话"。
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
   * 主入口
   */
  async run(userInput) {
    const originalInput = userInput;
    const steps = [];

    // Phase 1: Plan — 判断意图
    const plan = this._makePlan(userInput);

    // 无明确意图 → 自由闲聊模式
    if (!plan || !this.skills[plan.skill]) {
      const answer = await this._freeChat(originalInput);
      this._saveHistory(originalInput, answer);
      return { answer, plan: { skill: 'chat', action: 'free_chat' }, steps, iterations: 1 };
    }

    // Phase 2: Execute skill
    let execResult;
    try {
      const skill = this.skills[plan.skill];
      const validation = skill.validate(plan.params || {});
      if (!validation.valid) {
        return { answer: `唔，参数不太对：${validation.error}。能再说具体一点吗？`, plan, steps, iterations: 1 };
      }
      execResult = await skill.run(plan.params || {});
    } catch (e) {
      execResult = { success: false, error: e.message };
    }

    steps.push({ plan, result: execResult });

    // Phase 3: LLM 生成自然语言回复
    let answer;
    if (execResult.success && execResult.data) {
      answer = await this._generateResponse(originalInput, plan, execResult.data);
    } else if (!execResult.success) {
      // Skill 执行失败，用 LLM 生成友好的错误提示
      answer = await this._generateErrorResponse(originalInput, execResult.error);
    } else {
      answer = await this._freeChat(originalInput);
    }

    this._saveHistory(originalInput, answer);

    return {
      answer,
      plan: { skill: plan.skill, action: plan.action },
      steps,
      iterations: 1,
    };
  }

  // ── Phase 1: Plan ──

  _makePlan(input) {
    // 先判断是否为纯闲聊（无明确意图）
    if (this._isFreeChat(input)) return null;

    // Tier 1: 规则匹配
    const rulePlan = this._ruleBasedPlan(input);
    if (rulePlan) return rulePlan;

    // Tier 2: 关键词回退
    return this._fallbackPlan(input);
  }

  // 闲聊/问候检测
  _isFreeChat(input) {
    const text = input.trim();
    // 短问候
    if (/^(你好|嗨|嘿|哈[喽罗]|早上好|下午好|晚上好|早啊|在吗|在[不在]|hello|hi|hey)[!！。.]*$/i.test(text)) return true;
    // 纯闲聊短语
    if (/^(谢谢|多谢|感谢|辛苦|再见|拜拜|晚安|好的|OK|ok|嗯|哦|啊|哈哈|嘻嘻|嘿嘿)[!！。.]*$/i.test(text)) return true;
    // 跟助手聊天
    if (/你.*(叫.*什么|是谁|多大了|男.*女|有没有.*名字|会.*什么|能.*做什么|有什么.*功能)/.test(text)) return true;
    // 短闲聊（≤4字且无实质性内容）
    if (text.length <= 4 && !/[搜找查阅看订].*/.test(text)) return true;
    return false;
  }

  _ruleBasedPlan(input) {
    const text = input.toLowerCase();

    // 推送类
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
    if (/推送|给我推|有什么.*推荐/.test(text)) {
      return { skill: 'push', action: 'push', params: { action: 'push' } };
    }

    // 搜索类
    if (/搜索|找.*话题|查.*热点|有没有.*关于/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'search', params: { action: 'search', topic } };
    }

    // 深度分析类
    if (/分析|解读|怎么看|评价|为什么.*火/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'deep_analyze', params: { action: 'deep_analyze', topic } };
    }
    if (/对比|各平台|不同.*讨论|跨平台/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'cross_source', params: { action: 'cross_source', topic } };
    }
    if (/预测|趋势|未来|走向|还会/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'trend_predict', params: { action: 'trend_predict', topic } };
    }
    if (/相关|关联|相似|同类型/.test(text)) {
      const topic = this._extractTopic(input);
      return { skill: 'analyze', action: 'related_topics', params: { action: 'related_topics', topic } };
    }

    // 监控类
    if (/新热点|最新|有什么新|新话题|刚出来|新鲜事|最近.*热点/.test(text)) {
      return { skill: 'monitor', action: 'new_hotspots', params: { action: 'new_hotspots' } };
    }
    if (/飙升|上升|涨了|热度涨|什么.*火|最火|热搜|热门/.test(text)) {
      return { skill: 'monitor', action: 'rising_hotspots', params: { action: 'rising_hotspots' } };
    }
    if (/异常|波动|突[然发]|警报|爆了/.test(text)) {
      return { skill: 'monitor', action: 'anomalies', params: { action: 'anomalies' } };
    }
    if (/概况|总体|总结|最近怎么样|热点情况|有什么|看看|看点/.test(text)) {
      return { skill: 'monitor', action: 'summary', params: { action: 'summary' } };
    }

    return null;
  }

  _fallbackPlan(input) {
    const cat = this._extractCategory(input);
    if (cat) {
      return { skill: 'analyze', action: 'deep_analyze', params: { action: 'deep_analyze', topic: cat } };
    }
    if (input.length > 2 && input.length < 30) {
      return { skill: 'analyze', action: 'search', params: { action: 'search', topic: input } };
    }
    return null;
  }

  // ── Phase 2: Execute (在 run() 中内联) ──

  // ── Phase 3: LLM 生成自然语言 ──

  async _generateResponse(userInput, plan, data) {
    const skillName = { monitor: '热点监控', analyze: '热点分析', push: '订阅推送' }[plan.skill] || plan.skill;
    const actionName = plan.action || '';

    // 将结构化数据转为 JSON，方便 LLM 理解
    const dataStr = JSON.stringify(data, null, 2).slice(0, 2000);

    const prompt = PERSONA.replace('{hotspotContext}', this._buildHotspotContext());

    const messages = [
      { role: 'system', content: prompt },
      ...this.conversationHistory.slice(-6),
      {
        role: 'user',
        content: `用户刚才说："${userInput}"\n\n系统通过「${skillName} > ${actionName}」取到了以下数据：\n${dataStr}\n\n请用你的人格化口吻，把这些数据变成一个自然亲切的回复。记住：不要列数据清单，要像朋友聊天一样组织语言。`,
      },
    ];

    try {
      const response = await chat(messages, { temperature: 1.0, max_tokens: 600 });
      return response.trim() || this._templateFallback(plan, data);
    } catch (e) {
      console.error('[MasterAgent] Response generation failed:', e.message);
      return this._templateFallback(plan, data);
    }
  }

  async _generateErrorResponse(userInput, error) {
    const prompt = PERSONA.replace('{hotspotContext}', this._buildHotspotContext());

    const messages = [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: `用户说："${userInput}"，但系统查询时遇到了问题：${error}。请用友好的方式告诉用户这个情况，并建议替代方案。`,
      },
    ];

    try {
      const response = await chat(messages, { temperature: 0.8, max_tokens: 300 });
      return response.trim() || `唔，出了点小状况——${error}。要不换个方式试试？`;
    } catch {
      return `唔，出了点小状况——${error}。要不换个方式试试？`;
    }
  }

  async _freeChat(userInput) {
    const ctx = this._buildHotspotContext();
    const systemPrompt = ctx
      ? FREE_CHAT_PROMPT + `\n\n当前热点快照：\n${ctx}`
      : FREE_CHAT_PROMPT;

    try {
      const response = await chat(
        [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory.slice(-6),
          { role: 'user', content: userInput },
        ],
        { temperature: 1.0, max_tokens: 400 }
      );
      return response.trim() || '嘿嘿，我在呢～ 想看看最近有什么新鲜热点吗？';
    } catch (e) {
      console.error('[MasterAgent] Free chat failed:', e.message);
      return '嘿嘿，我在呢～ 想看看最近有什么新鲜热点吗？';
    }
  }

  // ── 辅助方法 ──

  _buildHotspotContext() {
    try {
      const { rows } = db.getAllHotspots({ limit: 15 });
      if (!rows.length) return '暂无热点数据。';
      return rows.slice(0, 10).map((h, i) =>
        `${i + 1}. [${h.category || '未分类'}] ${h.title}（热度 ${h.heat_score}，来源: ${(h.sources || []).map(s => s.source).join(', ')}）`
      ).join('\n');
    } catch { return ''; }
  }

  _templateFallback(plan, data) {
    // LLM 不可用时的极简回退
    const msg = data.message || '';
    if (plan.skill === 'monitor') {
      const items = data.items || [];
      if (!items.length) return msg || '目前没有新的热点动态～';
      const preview = items.slice(0, 5).map((h, i) => `${i + 1}. ${h.title} 🔥${h.heat_score || ''}`).join('\n');
      return `来看看最近的热点 👀\n\n${preview}\n\n${msg}`;
    }
    if (plan.skill === 'analyze' && data.analysis) return data.analysis;
    return msg || '这是查询结果，有什么想深入了解的吗？';
  }

  _saveHistory(userMsg, assistantMsg) {
    this.conversationHistory.push(
      { role: 'user', content: userMsg },
      { role: 'assistant', content: assistantMsg }
    );
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  _extractTopic(input) {
    const cleaned = input
      .replace(/分析|解读|怎么看|评价|对比|预测|趋势|搜索|是什么|为什么|怎么样/g, '')
      .replace(/一下|帮我|请你|请|想知道|想了解/g, '')
      .trim();
    return cleaned || input.trim();
  }

  _extractCategory(input) {
    const cats = ['科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育'];
    for (const cat of cats) {
      if (input.includes(cat)) return cat;
    }
    return null;
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}

// 单例
const masterAgent = new MasterAgent();
export default masterAgent;
