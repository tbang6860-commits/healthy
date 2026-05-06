import { useState } from 'react';

export default function TrendChart({ data = [] }) {
  const [tooltip, setTooltip] = useState(null);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[var(--text-muted)] text-xs">暂无趋势数据</p>
      </div>
    );
  }

  const maxHeat = Math.max(...data.map(d => d.heat_score), 1);
  const minHeat = Math.min(...data.map(d => d.heat_score), 0);
  const range = maxHeat - minHeat || 1;
  const h = 120;
  const w = 100;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pad = 10; // bottom padding for labels

  const points = data.map((d, i) => ({
    x: i * step,
    y: h - pad - ((d.heat_score - minHeat) / range) * (h - pad * 2),
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - pad} L 0 ${h - pad} Z`;

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(ratio => (
          <line
            key={ratio}
            x1={0} y1={h - pad - ratio * (h - pad * 2)}
            x2={w} y2={h - pad - ratio * (h - pad * 2)}
            stroke="var(--border-subtle)"
            strokeWidth="0.3"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points + hit areas */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y} r="3"
              fill="var(--bg-root)"
              stroke="var(--accent)"
              strokeWidth="1.2"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={p.x} cy={p.y} r="8"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.closest('svg').getBoundingClientRect();
                setTooltip({
                  x: (p.x / w) * rect.width,
                  y: (p.y / h) * rect.height,
                  score: p.heat_score,
                  time: p.recorded_at ? new Date(p.recorded_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : `#${i + 1}`,
                });
              }}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-20 bg-[var(--bg-card)] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs shadow-xl"
          style={{ left: tooltip.x - 30, top: tooltip.y - 36 }}
        >
          <span className="text-[var(--text-secondary)]">{tooltip.time}</span>
          <span className="ml-2 text-white font-semibold font-mono">{Math.round(tooltip.score)}°</span>
        </div>
      )}
    </div>
  );
}
