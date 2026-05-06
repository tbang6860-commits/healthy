/**
 * Skill 抽象基类
 * 每个 Skill 必须定义 name、description、schema，并实现 run()
 */
export class Skill {
  constructor(config = {}) {
    this.name = config.name || 'unnamed_skill';
    this.description = config.description || '';
    this.schema = config.schema || { type: 'object', properties: {}, required: [] };
  }

  /**
   * 执行技能 — 子类必须实现
   * @param {object} input - 符合 schema 定义的输入参数
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async run(input = {}) {
    throw new Error(`Skill [${this.name}] must implement run()`);
  }

  /**
   * 验证输入是否符合 schema
   */
  validate(input) {
    const required = this.schema.required || [];
    for (const key of required) {
      if (!(key in input)) {
        return { valid: false, error: `Missing required field: ${key}` };
      }
    }
    return { valid: true };
  }

  /**
   * 转为 LLM 可调用的工具描述
   */
  toToolDef() {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.schema,
      },
    };
  }
}

export default Skill;
