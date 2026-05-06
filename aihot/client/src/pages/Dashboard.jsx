import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import HotCard from '../components/HotCard';
import FilterToolbar from '../components/FilterToolbar';

const CATS = ['全部', '科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育'];

export default function Dashboard({ hotspots, loading, filters, onFilterChange, onSelect }) {
  const [activeCat, setActiveCat] = useState('全部');

  const filtered = useMemo(() => {
    let list = hotspots;
    if (activeCat !== '全部') list = list.filter(h => h.category === activeCat);
    return list;
  }, [hotspots, activeCat]);

  const stats = useMemo(() => ({
    total: hotspots.length,
    newCount: hotspots.filter(h => h.is_new).length,
    hotCount: hotspots.filter(h => h.heat_score > 70).length,
  }), [hotspots]);

  const layout = useMemo(() => {
    return filtered.map((h, i) => {
      let span = '';
      if (i === 0) span = 'lg:col-span-2 lg:row-span-2';
      else if (i < 4) span = 'lg:row-span-2';
      return { ...h, span };
    });
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-28 skeleton rounded" />
        </div>
        {/* Skeleton toolbar */}
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 w-16 skeleton rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATS.slice(0, 6).map(c => (
            <div key={c} className="h-8 w-14 skeleton rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[150px] gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`card p-2 ${i === 0 ? 'lg:col-span-2 lg:row-span-2' : i < 4 ? 'lg:row-span-2' : ''}`}>
              <div className="h-3 w-20 skeleton rounded mb-3" />
              <div className="h-5 w-full skeleton rounded mb-2" />
              <div className="h-5 w-3/4 skeleton rounded mb-4" />
              <div className="h-2 w-full skeleton rounded mt-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hotspots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BarChart3 size={32} className="text-[var(--text-muted)]" />
        <p className="text-[var(--text-secondary)] text-sm">暂无热点数据，点击右上角刷新按钮获取最新热点</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white">实时热点</h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#a0a0a0]">
              <span className="font-semibold text-white">{stats.total}</span>
              条
            </span>
            {stats.newCount > 0 && (
              <span className="flex items-center gap-1 text-[#4cc9f0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cc9f0]" />
                {stats.newCount} 新增
              </span>
            )}
            {stats.hotCount > 0 && (
              <span className="flex items-center gap-1 text-[#4cc9f0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cc9f0]" />
                {stats.hotCount} 高热
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 筛选排序工具栏 */}
      <FilterToolbar filters={filters} onChange={onFilterChange} />

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all duration-200 min-h-[44px] ${
              activeCat === cat
                ? 'bg-[#4cc9f0]/10 text-[#4cc9f0] border border-[#4cc9f0]/20'
                : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bento Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCat}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[150px] gap-5">
            {layout.map((h, i) => (
              <div key={h.id} className={`${h.span || ''}`}>
                <HotCard hotspot={h} onClick={onSelect} span={h.span} index={i} />
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BarChart3 size={28} className="text-[#8a8a8a] mx-auto mb-3" />
          <p className="text-[#a0a0a0] text-sm">该分类暂无热点数据</p>
        </div>
      )}
    </div>
  );
}
