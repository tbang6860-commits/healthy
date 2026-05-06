export default function Navbar({ page, onPageChange, hasNew, newCount, onRefresh, loading }) {
  const tabs = [
    { key: 'dashboard', label: '热点看板' },
    { key: 'trends', label: '趋势' },
    { key: 'agent', label: 'AI 助手' },
    { key: 'settings', label: '设置' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-card border-t-0 rounded-t-none mx-auto max-w-7xl">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            PulseSphere
          </h1>
          <span className="text-xs text-gray-500">AI 热点聚合</span>
        </div>

        <div className="flex items-center gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => onPageChange(t.key)}
              className={`relative px-4 py-1.5 rounded-full text-sm transition ${
                page === t.key
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
              {t.key === 'dashboard' && hasNew && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                  {newCount}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={onRefresh}
            disabled={loading}
            className={`ml-3 px-3 py-1.5 rounded-full text-xs border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 transition ${
              loading ? 'opacity-50 animate-pulse' : ''
            }`}
          >
            {loading ? '刷新中...' : '手动刷新'}
          </button>
        </div>
      </div>
    </nav>
  );
}
