import HeatBadge from './HeatBadge';
import SourceTag from './SourceTag';

export default function HotCard({ hotspot, onClick, size = 'normal' }) {
  const { title, heat_score, sources, is_new, summary, category, sentiment } = hotspot;
  const isLarge = size === 'large';

  return (
    <div
      onClick={() => onClick?.(hotspot.id)}
      className={`glass-card cursor-pointer p-4 flex flex-col gap-2 ${
        is_new ? 'pulse-new' : ''
      } ${isLarge ? 'col-span-1 row-span-2' : ''}`}
    >
      {/* 头部标签行 */}
      <div className="flex items-center gap-2 flex-wrap">
        {category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
            {category}
          </span>
        )}
        {sentiment && (
          <span className={`text-[10px] ${
            sentiment === 'positive' ? 'text-green-400' :
            sentiment === 'negative' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {sentiment === 'positive' ? '↑' : sentiment === 'negative' ? '↓' : '—'}
          </span>
        )}
        {is_new ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 animate-pulse">
            新
          </span>
        ) : null}
      </div>

      {/* 标题 */}
      <h3 className={`font-semibold leading-tight text-gray-100 line-clamp-2 ${
        isLarge ? 'text-base' : 'text-sm'
      }`}>
        {title}
      </h3>

      {/* 摘要（仅大卡片） */}
      {isLarge && summary && (
        <p className="text-xs text-gray-400 line-clamp-2">{summary}</p>
      )}

      {/* 底部：热度 + 来源 */}
      <div className="mt-auto flex items-center justify-between">
        <HeatBadge score={heat_score} />
        <div className="flex gap-1">
          {(sources || []).slice(0, 3).map((s, i) => (
            <SourceTag key={i} source={s.source} />
          ))}
        </div>
      </div>
    </div>
  );
}
