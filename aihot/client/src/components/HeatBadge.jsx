export default function HeatBadge({ score = 0 }) {
  const heat = Math.round(score);
  const level = heat > 70 ? 'high' : heat > 30 ? 'mid' : 'low';

  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 w-12 rounded-full overflow-hidden bg-white/[0.06]`}>
        <div
          className={`h-full rounded-full transition-all duration-500 heat-${level}`}
          style={{ width: `${Math.min(heat, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-medium ${
        level === 'high' ? 'text-[var(--accent-hot)]' :
        level === 'mid' ? 'text-[var(--accent)]' :
        'text-[var(--text-muted)]'
      }`}>
        {heat}°
      </span>
    </div>
  );
}
