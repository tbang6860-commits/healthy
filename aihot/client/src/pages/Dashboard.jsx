import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Zap, Radio } from 'lucide-react';
import HotCard from '../components/HotCard';

const CATEGORIES = ['全部', '科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育'];

export default function Dashboard({ hotspots, loading, onSelect }) {
  const [activeCat, setActiveCat] = useState('全部');

  const filtered = useMemo(() => {
    if (activeCat === '全部') return hotspots;
    return hotspots.filter(h => h.category === activeCat);
  }, [hotspots, activeCat]);

  // Stats
  const stats = useMemo(() => ({
    total: hotspots.length,
    newCount: hotspots.filter(h => h.is_new).length,
    hotCount: hotspots.filter(h => h.heat_score > 70).length,
  }), [hotspots]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-32 h-6 bg-white/[0.03] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[140px] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`glass-card p-4 animate-pulse ${
                i === 0 ? 'lg:col-span-2 lg:row-span-2' : i < 3 ? 'lg:row-span-2' : ''
              }`}
            >
              <div className="w-16 h-4 bg-white/[0.04] rounded mb-3" />
              <div className="w-full h-5 bg-white/[0.03] rounded mb-2" />
              <div className="w-3/4 h-5 bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hotspots.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Radio size={32} className="text-[var(--text-muted)]" />
        <p className="text-[var(--text-secondary)] text-sm">暂无热点数据，请点击右上角刷新按钮</p>
      </div>
    );
  }

  // Bento grid: first card spans 2 cols + 2 rows, next 2 span 2 rows
  const large = filtered.slice(0, 3);
  const small = filtered.slice(3);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Zap size={15} className="text-[var(--accent)]" />
          <span className="font-semibold text-white">{stats.total}</span>
          <span>条热点</span>
        </div>
        {stats.newCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-new)]" />
            <span className="text-[var(--accent-new)]">{stats.newCount} 条新增</span>
          </div>
        )}
        {stats.hotCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-hot)]" />
            <span className="text-[var(--accent-hot)]">{stats.hotCount} 条高热</span>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 ${
              activeCat === cat
                ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.03] border border-transparent'
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
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[140px] gap-4"
        >
          {large.map((h, i) => (
            <motion.div
              key={h.id}
              variants={item}
              className={i === 0 ? 'lg:col-span-2 lg:row-span-2' : 'lg:row-span-2'}
            >
              <HotCard
                hotspot={h}
                onClick={onSelect}
                size={i === 0 ? 'large' : 'normal'}
                index={i}
              />
            </motion.div>
          ))}

          {small.map((h, i) => (
            <motion.div key={h.id} variants={item}>
              <HotCard
                hotspot={h}
                onClick={onSelect}
                size="normal"
                index={i + 3}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 size={28} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">该分类暂无热点</p>
        </div>
      )}
    </div>
  );
}
