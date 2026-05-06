import { useState, useRef, useEffect } from 'react';

export default function AgentChat() {
  const [messages, setMessages] = useState([
    { role: 'agent', text: '你好！我是热点分析助手，可以帮你：\n\n- 查看最新热点和飙升话题\n- 深度分析某个话题\n- 订阅感兴趣的分类\n- 搜索特定话题\n\n试试对我说"有什么新热点"、"订阅科技类热点"？' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      let answer = data.answer || '抱歉，出了点问题...';

      // 如果 Agent 给出了步骤信息，附加在回答末尾
      if (data.plan) {
        const skillNames = { monitor: '热点监控', analyze: '热点分析', push: '订阅推送' };
        const skillLabel = skillNames[data.plan.skill] || data.plan.skill;
        answer += `\n\n— 由「${skillLabel}」处理 · ${data.iterations} 轮 —`;
      }

      setMessages(prev => [...prev, { role: 'agent', text: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: `网络错误: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-gray-200 mb-4">AI 热点助手</h2>

      {/* 快捷提问 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['有什么新热点？', '订阅科技类热点', '热度上升最快的话题', '今天热点总结'].map(q => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-gray-200 hover:border-blue-500/30 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 消息列表 */}
      <div className="glass-card p-4 mb-4 h-96 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-500/20 text-blue-100 rounded-br-md border border-blue-500/30'
                : 'bg-white/5 text-gray-200 rounded-bl-md border border-white/10'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-bl-md border border-white/10">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEnd} />
      </div>

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入问题，按 Enter 发送..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/40 transition"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-blue-500/15 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition text-sm font-medium"
        >
          发送
        </button>
      </div>
    </div>
  );
}
