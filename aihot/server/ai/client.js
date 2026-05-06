import OpenAI from 'openai';
import config from '../config.js';

const client = new OpenAI({
  apiKey: config.deepseek.apiKey,
  baseURL: config.deepseek.baseURL,
  timeout: 30000,
  maxRetries: 1,
});

/**
 * 调用 DeepSeek V4 进行对话补全
 */
export async function chat(messages, options = {}) {
  const response = await client.chat.completions.create({
    model: config.deepseek.model,
    messages,
    temperature: options.temperature ?? 1.0,
    top_p: options.top_p ?? 1.0,
    max_tokens: options.max_tokens ?? 2048,
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    // 关闭推理模式，获取直接输出
    extra_body: { thinking_mode: 'non-thinking' },
  });

  const msg = response.choices[0].message;
  // DeepSeek 在思考模式下 content 可能为空，回退到 reasoning_content
  return msg.content || msg.reasoning_content || '';
}

export default { chat };
