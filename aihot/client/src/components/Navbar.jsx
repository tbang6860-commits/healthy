import { RefreshCw, Zap } from 'lucide-react';

export default function Navbar({ page, onPageChange, hasNew, newCount, onRefresh, loading }) {
  const tabs = [
    { key: 'dashboard', label: '看板' },
    { key: 'trends', label: '趋势' },
    { key: 'agent', label: '助手' },
    { key: 'settings', label: '设置' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050510]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">
              Pulse<span className="text-sky-400">Sphere</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => onPageChange(t.key)}
              className={`relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                page === t.key
                  ? 'bg-white/[0.08] text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {t.label}
              {t.key === 'dashboard' && hasNew && (
                <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-orange-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/30">
                  {newCount > 9 ? '9+' : newCount}
                </span>
              )}
            </button>
          ))}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`ml-3 p-2 rounded-lg border transition-all duration-200 ${
              loading
                ? 'border-white/5 text-slate-500 cursor-wait'
                : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04]'
            }`}
            title="手动刷新"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </nav>
  );
}
