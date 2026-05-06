import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap } from 'lucide-react';

const QUICK = [
  { text: '最近有什么新鲜事？', icon: Sparkles },
  { text: '现在最火的话题是什么？', icon: Zap },
  { text: '科技圈今天有什么大新闻？', icon: Bot },
  { text: '给我推荐几个值得关注的热点', icon: Sparkles },
];

export default function AgentChat() {
  const [messages, setMessages] = useState([
    { role: 'agent', text: '嗨！我是脉冲星 Pulsar 🌟\n\n你的专属热点管家～ 全网大事小事，我帮你盯着呢。\n\n想知道什么？直接问我，别客气！' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/agent/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
      const data = await res.json();
      const answer = data.answer || '唔…信号不太好，能再说一遍吗？';
      setMessages(prev => [...prev, { role: 'agent', text: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', text: `网络错误: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-5">
        {QUICK.map((q, i) => {
          const Icon = q.icon;
          return (
            <button key={i} onClick={() => { setInput(q.text); }}
              className="text-xs px-3.5 py-2 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#4cc9f0] hover:border-[#4cc9f0]/30 hover:bg-[#4cc9f0]/5 transition-all duration-200 min-h-[44px] flex items-center gap-1.5">
              <Icon size={13} />
              {q.text}
            </button>
          );
        })}
      </div>

      <div className="card p-4 mb-4 h-[420px] overflow-y-auto space-y-4" role="log" aria-label="对话消息">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'agent' && (
              <div className="w-7 h-7 rounded-lg bg-[#4cc9f0]/12 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={13} className="text-[#4cc9f0]" />
              </div>
            )}
            <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#4cc9f0]/10 text-white rounded-br-md border border-[#4cc9f0]/20'
                : 'bg-[#0f0f0f] text-[#a0a0a0] rounded-bl-md border border-[#2a2a2a]'
            }`}>{msg.text}</div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-[#a0a0a0]" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-[#4cc9f0]/12 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-[#4cc9f0]" />
            </div>
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#4cc9f0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#4cc9f0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#4cc9f0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="输入消息，Enter 发送..."
          aria-label="输入消息"
          className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#8a8a8a] focus:outline-none focus:border-[#4cc9f0]/40 transition-all" />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-5 py-3 bg-[#4cc9f0] text-white rounded-xl border border-[#4cc9f0] hover:bg-[#3db8e0] disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 font-medium text-sm">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
