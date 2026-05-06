import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, Cpu } from 'lucide-react';

export default function Settings() {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    fetch('/api/sources').then(r => r.json()).then(j => setSources(j.sources || [])).catch(() => {});
  }, []);

  const okCount = sources.filter(s => s.status === 'ok').length;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-white font-mono">{sources.length}</div>
          <div className="text-[11px] text-[#a0a0a0] mt-1">数据源</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-[#4cc9f0] font-mono">{okCount}</div>
          <div className="text-[11px] text-[#a0a0a0] mt-1">正常连接</div>
        </div>
        <div className="card p-5 text-center">
          <div className="text-2xl font-bold text-[#4cc9f0] font-mono">30</div>
          <div className="text-[11px] text-[#a0a0a0] mt-1">分钟刷新</div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Database size={14} className="text-[#4cc9f0]" />
          数据源状态
        </h3>
        <div className="space-y-1">
          {sources.map(s => (
            <div key={s.name} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[#0f0f0f] transition-colors">
              <div className="flex items-center gap-3">
                {s.status === 'ok' ? <Wifi size={13} className="text-[#4cc9f0]" /> : <WifiOff size={13} className="text-[#8a8a8a]" />}
                <span className="text-sm text-white font-medium">{s.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded source-${s.name}`}>{s.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {s.itemCount > 0 ? (
                  <span className="text-[#a0a0a0] font-mono">{s.itemCount} 条</span>
                ) : (
                  <span className={s.status === 'ok' ? 'text-[#4cc9f0]' : 'text-[#f87171]'}>
                    {s.status === 'ok' ? '正常' : '异常'}
                  </span>
                )}
                {s.lastFetch && (
                  <span className="text-[#8a8a8a]">
                    {new Date(s.lastFetch).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Cpu size={14} className="text-[#4cc9f0]" />
          关于 PulseSphere
        </h3>
        <div className="text-xs text-[#a0a0a0] space-y-2.5">
          <div className="flex justify-between"><span>数据源</span><span className="text-white">微博 · 百度 · 知乎 · X · B站 · V2EX · HN · GitHub</span></div>
          <div className="flex justify-between"><span>AI 引擎</span><span className="text-white">DeepSeek V4</span></div>
          <div className="flex justify-between"><span>刷新周期</span><span className="text-white">每 30 分钟</span></div>
          <div className="flex justify-between"><span>版本</span><span className="text-white font-mono">v1.0</span></div>
        </div>
      </div>
    </div>
  );
}
