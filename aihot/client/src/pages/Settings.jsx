import { useState, useEffect } from 'react';

export default function Settings() {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    fetch('/api/sources')
      .then(r => r.json())
      .then(json => setSources(json.sources || []))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-gray-200">设置</h2>

      {/* 数据源状态 */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">数据源状态</h3>
        <div className="space-y-2">
          {sources.map(s => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  s.status === 'ok' ? 'bg-green-400' :
                  s.status === 'error' ? 'bg-red-400' : 'bg-gray-500'
                }`} />
                <span className="text-sm text-gray-300">{s.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded source-${s.name}`}>
                  {s.name}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {s.itemCount > 0 ? `${s.itemCount} 条` : s.status}
                {s.lastFetch && (
                  <span className="ml-2">
                    {new Date(s.lastFetch).toLocaleTimeString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 说明 */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">关于</h3>
        <div className="text-xs text-gray-500 space-y-2">
          <p>PulseSphere - AI 热点聚合分析平台</p>
          <p>数据源：微博热搜 · 百度热搜 · 知乎热榜 · Twitter 趋势</p>
          <p>AI 分析：DeepSeek V4</p>
          <p>更新频率：每 30 分钟自动刷新</p>
          <p className="text-gray-600">v1.0 — 2026-05-05</p>
        </div>
      </div>
    </div>
  );
}
