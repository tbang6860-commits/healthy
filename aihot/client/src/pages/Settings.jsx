import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Database, Cpu, Globe } from 'lucide-react';

const SOURCE_ICONS = {
  weibo: Globe,
  baidu: Globe,
  zhihu: Globe,
  twitter: Globe,
  bilibili: Globe,
  v2ex: Globe,
  hackernews: Globe,
  github: Globe,
};

export default function Settings() {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    fetch('/api/sources')
      .then(r => r.json())
      .then(json => setSources(json.sources || []))
      .catch(() => {});
  }, []);

  const okCount = sources.filter(s => s.status === 'ok').length;
  const totalCount = sources.length;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white font-mono">{totalCount}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">数据源</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--accent-new)] font-mono">{okCount}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">正常连接</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-[var(--accent)] font-mono">30</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">分钟刷新</div>
        </div>
      </div>

      {/* Source status */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Database size={14} className="text-[var(--accent)]" />
          数据源状态
        </h3>
        <div className="space-y-1">
          {sources.map(s => {
            const Icon = SOURCE_ICONS[s.name] || Globe;
            return (
              <div
                key={s.name}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {s.status === 'ok' ? (
                    <Wifi size={13} className="text-[var(--accent-new)]" />
                  ) : (
                    <WifiOff size={13} className="text-[var(--text-muted)]" />
                  )}
                  <span className="text-sm text-[var(--text-primary)]">{s.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded source-${s.name}`}>
                    {s.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {s.itemCount > 0 ? (
                    <span className="text-[var(--text-secondary)] font-mono">{s.itemCount} 条</span>
                  ) : (
                    <span className={s.status === 'ok' ? 'text-[var(--accent-new)]' : 'text-[var(--accent-hot)]'}>
                      {s.status === 'ok' ? '正常' : '异常'}
                    </span>
                  )}
                  {s.lastFetch && (
                    <span className="text-[var(--text-muted)]">
                      {new Date(s.lastFetch).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Cpu size={14} className="text-[var(--accent)]" />
          关于 PulseSphere
        </h3>
        <div className="text-xs text-[var(--text-muted)] space-y-2 leading-relaxed">
          <div className="flex justify-between">
            <span>数据源</span>
            <span className="text-[var(--text-secondary)]">微博 · 百度 · 知乎 · X · B站 · V2EX · HN · GitHub</span>
          </div>
          <div className="flex justify-between">
            <span>AI 引擎</span>
            <span className="text-[var(--text-secondary)]">DeepSeek V4</span>
          </div>
          <div className="flex justify-between">
            <span>刷新周期</span>
            <span className="text-[var(--text-secondary)]">每 30 分钟</span>
          </div>
          <div className="flex justify-between">
            <span>版本</span>
            <span className="text-[var(--text-secondary)] font-mono">v1.0 — 2026-05-06</span>
          </div>
        </div>
      </div>
    </div>
  );
}
