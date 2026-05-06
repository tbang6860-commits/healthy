import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';

const QUICK_PROMPTS = [
  { text: '有什么新热点？', icon: '🔥' },
  { text: '订阅科技类热点', icon: '📡' },
  { text: '热度上升最快的话题', icon: '📈' },
  { text: '今天热点总结', icon: '📋' },
];

export default function AgentChat() {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: '你好！我是热点分析助手。\n\n试试对我发送：\n• "有什么新热点？"\n• "分析一下XX话题"\n• "订阅科技类热点"',
    },
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
      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-5">
        {QUICK_PROMPTS.map(q => (
          <button
            key={q.text}
            onClick={() => { setInput(q.text); }}
            className="text-xs px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent)]/30 hover:bg-white/[0.04] transition-all duration-200"
          >
            <span className="mr-1.5">{q.icon}</span>
            {q.text}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="glass-card p-4 mb-4 h-[420px] overflow-y-auto space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'agent' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[var(--accent)]/10 text-[var(--text-primary)] rounded-br-md border border-[var(--accent)]/20'
                : 'bg-white/[0.03] text-[var(--text-secondary)] rounded-bl-md border border-white/[0.06]'
            }`}>
              {msg.text}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-[var(--text-muted)]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEnd} />
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 pr-10 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]/40 focus:bg-white/[0.05] transition-all"
          />
          {input.trim() && (
            <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent)]" />
          )}
        </div>
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-[var(--accent)]/10 text-[var(--accent)] rounded-xl border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
