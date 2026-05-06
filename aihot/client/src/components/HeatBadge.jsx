export default function HeatBadge({ score = 0 }) {
  const heat = Math.round(score);
  const level = heat > 70 ? 'high' : heat > 30 ? 'mid' : 'low';

  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 rounded-full overflow-hidden bg-[#2a2a2a]">
        <div
          className={`h-full rounded-full transition-all duration-700 heat-${level}`}
          style={{ width: `${Math.min(heat, 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-[#a0a0a0]">
        {heat}°
      </span>
    </div>
  );
}
