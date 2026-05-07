import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Search, X, Download, FileText, Table } from 'lucide-react';
import HotCard from '../components/HotCard';
import FilterToolbar from '../components/FilterToolbar';

const CATS = ['全部', '科技', '娱乐', '社会', '财经', '体育', '国际', '军事', '健康', '教育'];

export default function Dashboard({ hotspots, loading, filters, onFilterChange, onSelect }) {
  const [activeCat, setActiveCat] = useState('全部');
  const [search, setSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  // 点击外部关闭导出菜单
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [exportOpen]);

  const filtered = useMemo(() => {
    let list = hotspots;
    if (activeCat !== '全部') list = list.filter(h => h.category === activeCat);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(h =>
        h.title?.toLowerCase().includes(q) ||
        h.summary?.toLowerCase().includes(q) ||
        h.sources?.some(s => s.source?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [hotspots, activeCat, search]);

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

  const hasActiveFilters = filters.heatLevel || filters.sentiment || filters.trend || filters.source || filters.minSources || filters.onlyNew || (filters.sort && filters.sort !== 'heat');

  if (!hotspots.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BarChart3 size={32} className="text-[#8a8a8a]" />
        <div className="text-center">
          <p className="text-[#a0a0a0] text-sm">暂无热点数据</p>
          {hasActiveFilters && (
            <p className="text-[#6a6a6a] text-xs mt-1">当前筛选条件可能过于严格，试试放宽条件</p>
          )}
        </div>
        <div className="flex gap-2.5 flex-wrap justify-center">
          {hasActiveFilters && (
            <button
              onClick={() => onFilterChange({ sort: 'heat' })}
              className="text-xs px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-[#4cc9f0] bg-[#4cc9f0]/10 border border-[#4cc9f0]/20 hover:bg-[#4cc9f0]/20"
            >
              清除所有筛选
            </button>
          )}
          <button
            onClick={() => onFilterChange({ sort: 'heat' })}
            className="text-xs px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent"
          >
            重新加载数据
          </button>
        </div>
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

        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2 min-h-[44px] w-full sm:w-auto sm:min-w-[260px] focus-within:border-[#4cc9f0]/40 transition-all">
            <Search size={14} className="text-[#8a8a8a] shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索标题、摘要、来源..."
              aria-label="搜索热点"
              className="bg-transparent text-sm text-white placeholder-[#8a8a8a] outline-none flex-1 min-w-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[#8a8a8a] hover:text-white shrink-0">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Export */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(v => !v)}
              aria-expanded={exportOpen}
              aria-label="导出数据"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#4cc9f0] hover:border-[#4cc9f0]/30 transition-all"
              title="导出"
            >
              <Download size={15} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1.5 shadow-xl shadow-black/40 min-w-[160px]">
                <ExportMenuItem icon={Table} label="导出 CSV" onClick={() => { exportToCsv(filtered); setExportOpen(false); }} />
                <ExportMenuItem icon={FileText} label="导出 Markdown" onClick={() => { exportToMarkdown(filtered); setExportOpen(false); }} />
              </div>
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
          key={activeCat + search}
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
        <div className="text-center py-16 space-y-4">
          <BarChart3 size={28} className="text-[#8a8a8a] mx-auto" />
          <div>
            <p className="text-[#a0a0a0] text-sm">
              {search ? `未找到包含 "${search}" 的热点` : '该分类暂无热点数据'}
            </p>
            {!search && <p className="text-[#6a6a6a] text-xs mt-1">试试切换分类或调整筛选条件</p>}
          </div>
          <div className="flex gap-2 justify-center flex-wrap">
            {activeCat !== '全部' && (
              <button
                onClick={() => setActiveCat('全部')}
                className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200 text-[#4cc9f0] hover:bg-[#4cc9f0]/10 border border-[#4cc9f0]/20"
              >
                查看全部类别
              </button>
            )}
            <button
              onClick={() => onFilterChange({ sort: 'heat' })}
              className="text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200 text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent"
            >
              清除所有筛选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 导出菜单项 ──
function ExportMenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg text-[#a0a0a0] hover:text-white hover:bg-[#0f0f0f] transition-colors"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

// ── CSV 导出 ──
function exportToCsv(rows) {
  const headers = ['排名', '标题', '分类', '热度', '情感', '来源', '摘要'];
  const lines = rows.map((h, i) => [
    i + 1,
    `"${(h.title || '').replace(/"/g, '""')}"`,
    h.category || '',
    h.heat_score || 0,
    h.sentiment || '',
    (h.sources || []).map(s => s.source).join('、'),
    `"${(h.summary || '').replace(/"/g, '""')}"`,
  ].join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  downloadBlob(csv, `hotspots_${formatDate()}.csv`, 'text/csv;charset=utf-8;');
}

// ── Markdown 导出 ──
function exportToMarkdown(rows) {
  const dateStr = new Date().toLocaleString('zh-CN');
  let md = `# PulseSphere 热点日报\n\n> 生成时间：${dateStr}\n> 共 ${rows.length} 条热点\n\n`;
  md += '| 排名 | 标题 | 分类 | 热度 | 情感 |\n';
  md += '|------|------|------|------|------|\n';
  rows.forEach((h, i) => {
    md += `| ${i + 1} | ${h.title} | ${h.category || '-'} | ${h.heat_score || 0} | ${h.sentiment || '-'} |\n`;
  });
  md += '\n## 详细摘要\n\n';
  rows.forEach((h, i) => {
    md += `### ${i + 1}. ${h.title}\n\n`;
    md += `- **分类**：${h.category || '-'}\n`;
    md += `- **热度**：${h.heat_score || 0}\n`;
    md += `- **情感**：${h.sentiment || '-'} (${h.sentiment_score || 0})\n`;
    md += `- **来源**：${(h.sources || []).map(s => s.source).join('、') || '-'}\n`;
    if (h.summary) md += `- **摘要**：${h.summary}\n`;
    md += '\n';
  });
  downloadBlob(md, `hotspots_${formatDate()}.md`, 'text/markdown;charset=utf-8;');
}

// ── 下载辅助 ──
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}
