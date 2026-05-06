import { Skill } from '../skillBase.js';
import db from '../../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUBSCRIBE_FILE = path.join(__dirname, '..', '..', 'data', 'subscriptions.json');

/**
 * 热点推送 Skill — 类别订阅管理、定向推送
 * R24: 用户可订阅特定类别，定向推送
 */
export class PushSkill extends Skill {
  constructor() {
    super({
      name: 'hotspot_push',
      description: '管理热点订阅和推送：订阅感兴趣的分类、查看订阅列表、取消订阅、获取推送内容。可以"订阅科技类热点"、"查看我的订阅"、"获取最新推送"。',
      schema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['subscribe', 'unsubscribe', 'list', 'push'],
            description: '推送动作：subscribe=订阅分类, unsubscribe=取消订阅, list=查看订阅, push=获取最新推送内容',
          },
          category: {
            type: 'string',
            description: '分类名称（subscribe/unsubscribe 时需要）：科技/娱乐/社会/财经/体育/国际/军事/健康/教育/其他',
          },
          user_id: {
            type: 'string',
            description: '用户标识，默认 "default"',
          },
        },
        required: ['action'],
      },
    });
  }

  async run(input = {}) {
    const { action, category, user_id = 'default' } = input;

    try {
      switch (action) {
        case 'subscribe':
          return this._subscribe(user_id, category);
        case 'unsubscribe':
          return this._unsubscribe(user_id, category);
        case 'list':
          return this._listSubscriptions(user_id);
        case 'push':
          return this._getPush(user_id);
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (e) {
      return { success: false, error: `推送操作失败: ${e.message}` };
    }
  }

  /**
   * 读取订阅数据
   */
  _readSubs() {
    try {
      if (fs.existsSync(SUBSCRIBE_FILE)) {
        return JSON.parse(fs.readFileSync(SUBSCRIBE_FILE, 'utf-8'));
      }
    } catch { /* ignore */ }
    return {};
  }

  /**
   * 写入订阅数据
   */
  _writeSubs(data) {
    const dir = path.dirname(SUBSCRIBE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SUBSCRIBE_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * 订阅分类
   */
  _subscribe(userId, category) {
    if (!category) {
      return { success: false, error: '请指定要订阅的分类，如：科技、娱乐、社会等' };
    }

    const VALID_CATEGORIES = ['科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育', '其他'];
    if (!VALID_CATEGORIES.includes(category)) {
      return { success: false, error: `无效分类"${category}"，可选：${VALID_CATEGORIES.join('、')}` };
    }

    const subs = this._readSubs();
    if (!subs[userId]) subs[userId] = [];
    if (!subs[userId].includes(category)) {
      subs[userId].push(category);
    }
    this._writeSubs(subs);

    return {
      success: true,
      data: {
        action: 'subscribe',
        user_id: userId,
        category,
        subscriptions: subs[userId],
        message: `已订阅"${category}"类热点，当前订阅: ${subs[userId].join('、')}`,
      },
    };
  }

  /**
   * 取消订阅
   */
  _unsubscribe(userId, category) {
    if (!category) {
      return { success: false, error: '请指定要取消的分类' };
    }

    const subs = this._readSubs();
    if (!subs[userId]) subs[userId] = [];

    subs[userId] = subs[userId].filter(c => c !== category);
    this._writeSubs(subs);

    return {
      success: true,
      data: {
        action: 'unsubscribe',
        user_id: userId,
        category,
        subscriptions: subs[userId],
        message: subs[userId].length > 0
          ? `已取消"${category}"，当前订阅: ${subs[userId].join('、')}`
          : `已取消"${category}"，当前无订阅`,
      },
    };
  }

  /**
   * 查看订阅列表
   */
  _listSubscriptions(userId) {
    const subs = this._readSubs();
    const userSubs = subs[userId] || [];

    return {
      success: true,
      data: {
        action: 'list',
        user_id: userId,
        subscriptions: userSubs,
        message: userSubs.length > 0
          ? `当前订阅: ${userSubs.join('、')}`
          : '尚未订阅任何分类。可用分类：科技、娱乐、社会、财经、体育、国际、军事、健康、教育、其他',
      },
    };
  }

  /**
   * 获取推送内容 — 根据订阅的分类筛选最新热点
   */
  _getPush(userId) {
    const subs = this._readSubs();
    const userSubs = subs[userId] || [];

    if (userSubs.length === 0) {
      return {
        success: true,
        data: {
          action: 'push',
          user_id: userId,
          message: '尚未订阅任何分类，请先订阅。可用分类：科技、娱乐、社会、财经、体育、国际、军事、健康、教育、其他',
          items: [],
        },
      };
    }

    const all = db.getAllHotspots().rows;
    const filtered = all
      .filter(h => userSubs.includes(h.category))
      .slice(0, 15);

    const notifContent = filtered.map(h =>
      `[${h.category}] ${h.title} (热度:${h.heat_score})`
    );

    return {
      success: true,
      data: {
        action: 'push',
        user_id: userId,
        subscriptions: userSubs,
        count: filtered.length,
        items: filtered.map(h => ({
          id: h.id,
          title: h.title,
          category: h.category,
          heat_score: h.heat_score,
          summary: h.summary,
          is_new: h.is_new,
          sources: h.sources.map(s => s.source),
        })),
        message: filtered.length > 0
          ? `为你推送 ${filtered.length} 条${userSubs.join('、')}类热点`
          : `暂无${userSubs.join('、')}类新热点`,
        notification: notifContent.slice(0, 5),
      },
    };
  }
}

export default PushSkill;
