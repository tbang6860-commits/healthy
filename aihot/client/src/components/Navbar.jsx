import { RefreshCw, Activity } from 'lucide-react';

export default function Navbar({ page, onPageChange, hasNew, newCount, onRefresh, loading }) {
  const tabs = [
    { key: 'dashboard', label: '看板' },
    { key: 'trends', label: '趋势' },
    { key: 'agent', label: '助手' },
    { key: 'settings', label: '设置' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-lg border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#4cc9f0]/12 flex items-center justify-center">
            <Activity size={15} className="text-[#4cc9f0]" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            Pulse<span className="text-[#4cc9f0]">Sphere</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => onPageChange(t.key)}
              className={`relative px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 min-h-[44px] flex items-center ${
                page === t.key
                  ? 'bg-[#4cc9f0]/8 text-[#4cc9f0]'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              {t.label}
              {t.key === 'dashboard' && hasNew && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#4cc9f0] rounded-full text-[10px] flex items-center justify-center font-bold text-white px-1">
                  {newCount > 9 ? '9+' : newCount}
                </span>
              )}
            </button>
          ))}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            aria-label="手动刷新数据"
            className={`ml-3 p-2 rounded-lg border transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
              loading
                ? 'border-[#2a2a2a] text-[#8a8a8a] cursor-wait'
                : 'border-[#2a2a2a] text-[#a0a0a0] hover:text-[#4cc9f0] hover:border-[#4cc9f0]/30 hover:bg-[#4cc9f0]/5'
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
