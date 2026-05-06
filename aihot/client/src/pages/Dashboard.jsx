import HotCard from '../components/HotCard';

export default function Dashboard({ hotspots, loading, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">正在抓取全网热点...</p>
        </div>
      </div>
    );
  }

  if (!hotspots.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">暂无热点数据，请点击右上角"手动刷新"</p>
      </div>
    );
  }

  // Bento Grid: 前 3 个大卡片，其余标准大小
  const large = hotspots.slice(0, 3);
  const small = hotspots.slice(3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-200">
          实时热点
          <span className="ml-2 text-xs text-gray-500 font-normal">
            {hotspots.length} 条
          </span>
        </h2>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[140px] gap-4">
        {/* 前 3 个大卡片 */}
        {large.map((h, i) => (
          <div key={h.id} className={i === 0 ? 'lg:col-span-2 lg:row-span-2' : 'lg:row-span-2'}>
            <HotCard hotspot={h} onClick={onSelect} size={i === 0 ? 'large' : 'normal'} />
          </div>
        ))}

        {/* 其余标准卡片 */}
        {small.map(h => (
          <HotCard key={h.id} hotspot={h} onClick={onSelect} size="normal" />
        ))}
      </div>
    </div>
  );
}
