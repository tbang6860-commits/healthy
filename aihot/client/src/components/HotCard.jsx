import HeatBadge from './HeatBadge';
import SourceTag from './SourceTag';

export default function HotCard({ hotspot, onClick, span = '', index = 0 }) {
  const { title, heat_score, sources, is_new, summary } = hotspot;
  const hasSummary = span.includes('col-span-2') || span.includes('row-span-2');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(hotspot.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`查看 ${title} 详情`}
      onClick={() => onClick?.(hotspot.id)}
      onKeyDown={handleKeyDown}
      className="animate-in card group cursor-pointer h-full p-2 flex flex-col gap-3"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Top row: source tags + indicators */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {(sources || []).slice(0, 3).map((s, i) => (
            <SourceTag key={i} source={s.source} />
          ))}
          {(sources || []).length > 3 && (
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              +{sources.length - 3}
            </span>
          )}
        </div>
        {is_new && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4cc9f0]/12 text-[#4cc9f0] border border-[#4cc9f0]/20 font-medium">
            NEW
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className={`font-semibold leading-snug text-white line-clamp-2 group-hover:text-[#4cc9f0] transition-colors ${
        hasSummary ? 'text-base md:text-lg' : 'text-sm'
      }`}>
        {title}
      </h3>

      {/* Summary (large cards) */}
      {hasSummary && summary && (
        <p className="text-xs text-[#a0a0a0] line-clamp-2 leading-relaxed">
          {summary}
        </p>
      )}

      <div className="flex-1" />

      {/* Heat bar */}
      <HeatBadge score={heat_score} />
    </div>
  );
}
