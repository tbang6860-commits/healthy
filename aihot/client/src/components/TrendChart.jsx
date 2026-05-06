import { useState } from 'react';

export default function TrendChart({ data = [] }) {
  const [tip, setTip] = useState(null);

  if (!data.length) {
    return <p className="text-[#8a8a8a] text-center py-12 text-xs">暂无数据</p>;
  }

  const maxH = Math.max(...data.map(d => d.heat_score), 1);
  const minH = Math.min(...data.map(d => d.heat_score), 0);
  const range = maxH - minH || 1;
  const w = 100, h = 120, pad = 12;
  const step = data.length > 1 ? w / (data.length - 1) : w;

  const pts = data.map((d, i) => ({
    x: i * step,
    y: h - pad - ((d.heat_score - minH) / range) * (h - pad * 2),
    ...d,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x} ${h - pad} L 0 ${h - pad} Z`;

  return (
    <div className="w-full relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" onMouseLeave={() => setTip(null)}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4cc9f0" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4cc9f0" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(r => (
          <line key={r} x1={0} y1={h - pad - r * (h - pad * 2)} x2={w} y2={h - pad - r * (h - pad * 2)}
            stroke="#2a2a2a" strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill="url(#areaG)" />
        <path d={line} fill="none" stroke="#4cc9f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#1a1a1a" stroke="#4cc9f0" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <circle cx={p.x} cy={p.y} r="8" fill="transparent" className="cursor-pointer"
              onMouseEnter={e => {
                const r = e.currentTarget.closest('svg').getBoundingClientRect();
                setTip({ x: (p.x / w) * r.width, y: (p.y / h) * r.height, s: p.heat_score, t: p.recorded_at ? new Date(p.recorded_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : `#${i + 1}` });
              }} />
          </g>
        ))}
      </svg>
      {tip && (
        <div className="absolute z-20 pointer-events-none bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-xs shadow-lg" style={{ left: tip.x - 30, top: tip.y - 38 }}>
          <span className="text-[#a0a0a0]">{tip.t}</span>
          <span className="ml-2 text-white font-semibold font-mono">{Math.round(tip.s)}°</span>
        </div>
      )}
    </div>
  );
}
