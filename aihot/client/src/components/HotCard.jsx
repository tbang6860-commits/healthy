import { useRef } from 'react';
import { TrendingUp, MessageCircle, ExternalLink } from 'lucide-react';
import HeatBadge from './HeatBadge';
import SourceTag from './SourceTag';

export default function HotCard({ hotspot, onClick, size = 'normal', index = 0 }) {
  const cardRef = useRef(null);
  const { title, heat_score, sources, is_new, summary, category } = hotspot;
  const isLarge = size === 'large';

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={() => onClick?.(hotspot.id)}
      className={`group relative cursor-pointer ${is_new ? 'moving-border' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`animate-in glass-card spotlight-card h-full p-4 flex flex-col gap-3 ${
        isLarge ? 'md:p-5' : ''
      }`}>
        {/* Header: category + indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.06] font-medium tracking-wide">
              {category}
            </span>
          )}
          {is_new && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-new)]/10 text-[var(--accent-new)] border border-[var(--accent-new)]/20 font-medium">
              NEW
            </span>
          )}
          {heat_score > 70 && (
            <TrendingUp size={12} className="text-[var(--accent-hot)]" />
          )}
        </div>

        {/* Title */}
        <h3 className={`font-semibold leading-snug text-[var(--text-primary)] line-clamp-2 group-hover:text-white transition-colors ${
          isLarge ? 'text-base md:text-lg' : 'text-sm'
        }`}>
          {title}
        </h3>

        {/* Summary (large cards only) */}
        {isLarge && summary && (
          <p className="text-xs text-[var(--text-secondary)]/80 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer: heat + sources */}
        <div className="flex items-center justify-between gap-2">
          <HeatBadge score={heat_score} />
          <div className="flex items-center gap-1.5">
            {(sources || []).slice(0, 3).map((s, i) => (
              <SourceTag key={i} source={s.source} />
            ))}
            {(sources || []).length > 3 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                +{sources.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Hover indicator */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={12} className="text-[var(--text-muted)]" />
        </div>
      </div>
    </div>
  );
}
