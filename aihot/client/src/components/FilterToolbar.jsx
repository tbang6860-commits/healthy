import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, TrendingUp, Globe, Heart, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

const SORTS = [
  { key: 'heat', label: '最热', icon: Flame },
  { key: 'newest', label: '最新', icon: Clock },
  { key: 'rising', label: '飙升', icon: TrendingUp },
  { key: 'cross_source', label: '跨平台', icon: Globe },
  { key: 'sentiment', label: '情感', icon: Heart },
];

const HEAT_LEVELS = [
  { key: 'high', label: '高热', range: '>70' },
  { key: 'medium', label: '中热', range: '30-70' },
  { key: 'low', label: '低热', range: '<30' },
];

const SENTIMENTS = [
  { key: 'positive', label: '正面', emoji: '😊' },
  { key: 'neutral', label: '中性', emoji: '😐' },
  { key: 'negative', label: '负面', emoji: '😟' },
];

const TRENDS = [
  { key: 'new', label: '新热点' },
  { key: 'rising', label: '上升中' },
];

const SOURCES = [
  { key: 'weibo', label: '微博' },
  { key: 'baidu', label: '百度' },
  { key: 'zhihu', label: '知乎' },
  { key: 'twitter', label: 'Twitter' },
  { key: 'bilibili', label: 'B站' },
  { key: 'v2ex', label: 'V2EX' },
  { key: 'hackernews', label: 'HN' },
  { key: 'github', label: 'GitHub' },
  { key: 'google', label: 'Google' },
  { key: 'reddit', label: 'Reddit' },
];

export default function FilterToolbar({ filters, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);

  const set = (key, value) => onChange({ ...filters, [key]: value });
  const toggle = (key, value) => {
    const current = filters[key];
    set(key, current === value ? undefined : value);
  };

  // 计算活跃筛选数
  const activeCount = [
    filters.heatLevel, filters.sentiment, filters.trend,
    filters.source, filters.minSources, filters.onlyNew,
  ].filter(Boolean).length;

  const clearAll = () => onChange({ sort: 'heat' });

  const btnBase = 'text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 min-h-[44px] flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#4cc9f0] focus-visible:outline-offset-2';
  const btnInactive = 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent';
  const btnActive = 'bg-[#4cc9f0]/10 text-[#4cc9f0] border border-[#4cc9f0]/20';

  return (
    <div className="space-y-3 select-none">
      {/* ── 排序切换栏 ── */}
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="排序方式">
        {SORTS.map(s => {
          const Icon = s.icon;
          const active = (filters.sort || 'heat') === s.key;
          return (
            <button
              key={s.key}
              role="radio"
              aria-checked={active}
              aria-label={`按${s.label}排序`}
              onClick={() => set('sort', s.key)}
              className={`${btnBase} ${active ? btnActive : btnInactive}`}
            >
              <Icon size={14} className={active ? 'text-[#4cc9f0]' : 'text-[#8a8a8a]'} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── 快速筛选行 ── */}
      <div className="flex gap-4 flex-wrap items-center">
        {/* 热度档位 */}
        <div className="flex gap-1.5 items-center" role="radiogroup" aria-label="热度筛选">
          <span className="text-[11px] text-[#8a8a8a] mr-0.5 shrink-0">热度</span>
          {HEAT_LEVELS.map(h => {
            const active = filters.heatLevel === h.key;
            return (
              <button
                key={h.key}
                role="radio"
                aria-checked={active}
                aria-label={`${h.label}热度 ${h.range}`}
                onClick={() => toggle('heatLevel', h.key)}
                className={`${btnBase} text-[11px] px-2.5 ${active ? btnActive : btnInactive}`}
              >
                {h.label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-[#2a2a2a] shrink-0" />

        {/* 情感筛选 */}
        <div className="flex gap-1.5 items-center" role="radiogroup" aria-label="情感筛选">
          <span className="text-[11px] text-[#8a8a8a] mr-0.5 shrink-0">情感</span>
          {SENTIMENTS.map(s => {
            const active = filters.sentiment === s.key;
            return (
              <button
                key={s.key}
                role="radio"
                aria-checked={active}
                aria-label={`${s.label}情感`}
                onClick={() => toggle('sentiment', s.key)}
                className={`${btnBase} text-[11px] px-2.5 ${active ? btnActive : btnInactive}`}
              >
                <span className="text-xs">{s.emoji}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-5 bg-[#2a2a2a] shrink-0" />

        {/* 动态状态 */}
        <div className="flex gap-1.5 items-center" role="group" aria-label="动态状态">
          <span className="text-[11px] text-[#8a8a8a] mr-0.5 shrink-0">状态</span>
          {TRENDS.map(t => {
            const active = filters.trend === t.key;
            return (
              <button
                key={t.key}
                aria-pressed={active}
                aria-label={`只看${t.label}`}
                onClick={() => toggle('trend', t.key)}
                className={`${btnBase} text-[11px] px-2.5 ${active ? btnActive : btnInactive}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 高级筛选切换 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-label="高级筛选"
          className={`${btnBase} text-[11px] ${showAdvanced ? btnActive : btnInactive} ml-auto`}
        >
          <SlidersHorizontal size={13} />
          高级
          <ChevronDown size={12} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* 清除 */}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            aria-label="清除所有筛选"
            className={`${btnBase} text-[11px] px-2.5 text-[#ff6498] hover:bg-[#ff6498]/10 border border-transparent hover:border-[#ff6498]/20`}
          >
            <X size={13} />
            清除 ({activeCount})
          </button>
        )}
      </div>

      {/* ── 高级筛选（可折叠） ── */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex gap-4 flex-wrap items-center">
              {/* 来源多选 */}
              <div className="relative">
                <button
                  onClick={() => setSourceOpen(!sourceOpen)}
                  aria-expanded={sourceOpen}
                  aria-haspopup="listbox"
                  className={`${btnBase} ${filters.source ? btnActive : btnInactive}`}
                >
                  来源
                  {filters.source ? `: ${SOURCES.find(s => s.key === filters.source)?.label || filters.source}` : '选择'}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${sourceOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {sourceOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      role="listbox"
                      className="absolute top-full mt-1 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1.5 shadow-lg shadow-black/40 min-w-[140px]"
                    >
                      <button
                        role="option"
                        aria-selected={!filters.source}
                        onClick={() => { set('source', undefined); setSourceOpen(false); }}
                        className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors duration-150 ${!filters.source ? 'bg-[#4cc9f0]/10 text-[#4cc9f0]' : 'text-[#a0a0a0] hover:text-white'}`}
                      >
                        全部来源
                      </button>
                      {SOURCES.map(s => (
                        <button
                          key={s.key}
                          role="option"
                          aria-selected={filters.source === s.key}
                          onClick={() => { set('source', s.key); setSourceOpen(false); }}
                          className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors duration-150 ${filters.source === s.key ? 'bg-[#4cc9f0]/10 text-[#4cc9f0]' : 'text-[#a0a0a0] hover:text-white'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 跨平台开关 */}
              <button
                aria-pressed={filters.minSources === '2'}
                onClick={() => set('minSources', filters.minSources === '2' ? undefined : '2')}
                className={`${btnBase} ${filters.minSources === '2' ? btnActive : btnInactive}`}
              >
                跨平台话题
              </button>

              {/* 只看新热点 */}
              <button
                aria-pressed={filters.onlyNew === 'true'}
                onClick={() => set('onlyNew', filters.onlyNew === 'true' ? undefined : 'true')}
                className={`${btnBase} ${filters.onlyNew === 'true' ? btnActive : btnInactive}`}
              >
                只看新热点
              </button>
            </div>

            {/* 关闭高级区点击外部 */}
            {showAdvanced && (
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowAdvanced(false)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
