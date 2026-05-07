import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, TrendingUp, Globe, Heart, X, ChevronDown, SlidersHorizontal, Check } from 'lucide-react';

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
  const [collapseOverflow, setCollapseOverflow] = useState(false);
  const toolbarRef = useRef(null);
  const sourceRef = useRef(null);
  const sourceBtnRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const set = useCallback((key, value) => {
    onChange(prev => ({ ...prev, [key]: value }));
  }, [onChange]);

  const toggle = useCallback((key, value) => {
    onChange(prev => {
      const current = prev[key];
      return { ...prev, [key]: current === value ? undefined : value };
    });
  }, [onChange]);

  // 点击外部关闭来源下拉
  useEffect(() => {
    if (!sourceOpen) return;
    const handler = (e) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target)) {
        setSourceOpen(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [sourceOpen]);

  // 点击工具栏外部关闭高级区
  useEffect(() => {
    if (!showAdvanced) return;
    const handler = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setShowAdvanced(false);
        setSourceOpen(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [showAdvanced]);

  // 计算来源下拉菜单位置（相对于按钮）
  useEffect(() => {
    if (sourceOpen && sourceBtnRef.current) {
      const rect = sourceBtnRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [sourceOpen]);

  // 计算活跃筛选数
  const activeCount = [
    filters.heatLevel, filters.sentiment, filters.trend,
    filters.source, filters.minSources, filters.onlyNew,
  ].filter(Boolean).length;

  const clearAll = () => onChange({ sort: 'heat' });

  const btnBase = 'text-xs px-3 py-2 rounded-lg font-medium transition-all duration-200 min-h-[44px] flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#4cc9f0] focus-visible:outline-offset-2';
  const btnInactive = 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent';
  const btnActive = 'bg-[#4cc9f0]/10 text-[#4cc9f0] border border-[#4cc9f0]/20';

  const hasSource = !!filters.source;
  const hasMinSources = filters.minSources === '2';
  const hasOnlyNew = filters.onlyNew === 'true';

  return (
    <div className="space-y-3 select-none" ref={toolbarRef}>
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
          className={`${btnBase} text-[11px] ${showAdvanced || hasSource || hasMinSources || hasOnlyNew ? btnActive : btnInactive} ml-auto`}
        >
          <SlidersHorizontal size={13} />
          高级
          {(hasSource || hasMinSources || hasOnlyNew) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cc9f0]" />
          )}
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
            onAnimationStart={() => setCollapseOverflow(true)}
            onAnimationComplete={() => setCollapseOverflow(false)}
            className={collapseOverflow ? 'overflow-hidden' : ''}
          >
            <div className="pt-3 flex gap-4 flex-wrap items-center">
              {/* 来源选择 — 触发按钮（下拉菜单通过 Portal 方式渲染在外部） */}
              <button
                ref={sourceBtnRef}
                onClick={() => setSourceOpen(!sourceOpen)}
                aria-expanded={sourceOpen}
                aria-haspopup="listbox"
                className={`${btnBase} relative ${hasSource ? btnActive : btnInactive}`}
              >
                来源
                {hasSource ? `: ${SOURCES.find(s => s.key === filters.source)?.label || filters.source}` : '选择'}
                <ChevronDown size={12} className={`transition-transform duration-200 ${sourceOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 跨平台开关 — 选中时显示 ✓ 提示可取消 */}
              <button
                aria-pressed={hasMinSources}
                onClick={() => toggle('minSources', '2')}
                className={`${btnBase} ${hasMinSources ? btnActive : btnInactive}`}
                title={hasMinSources ? '点击取消跨平台筛选' : '只看多平台报道的话题'}
              >
                {hasMinSources ? <Check size={13} /> : null}
                跨平台话题
              </button>

              {/* 只看新热点 — 选中时显示 ✓ 提示可取消 */}
              <button
                aria-pressed={hasOnlyNew}
                onClick={() => toggle('onlyNew', 'true')}
                className={`${btnBase} ${hasOnlyNew ? btnActive : btnInactive}`}
                title={hasOnlyNew ? '点击取消新热点筛选' : '只看首次出现的热点'}
              >
                {hasOnlyNew ? <Check size={13} /> : null}
                只看新热点
              </button>

              {/* 返回全部 — 仅在高级筛选激活时显示 */}
              {(hasSource || hasMinSources || hasOnlyNew) && (
                <button
                  onClick={() => {
                    set('source', undefined);
                    set('minSources', undefined);
                    set('onlyNew', undefined);
                  }}
                  className={`${btnBase} text-[11px] px-2.5 text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent`}
                >
                  <X size={12} />
                  重置高级筛选项
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 来源下拉菜单（渲染在折叠区域外部，避免被 overflow-hidden 裁剪） ── */}
      <AnimatePresence>
        {sourceOpen && (
          <motion.div
            ref={sourceRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            style={dropdownStyle}
            className="z-[100] bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1.5 shadow-xl shadow-black/40 min-w-[140px]"
          >
            <button
              role="option"
              aria-selected={!hasSource}
              onClick={() => { set('source', undefined); setSourceOpen(false); }}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors duration-150 ${!hasSource ? 'bg-[#4cc9f0]/10 text-[#4cc9f0]' : 'text-[#a0a0a0] hover:text-white'}`}
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
  );
}
