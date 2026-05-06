export default function HeatBadge({ score = 0 }) {
  // 色温：冷蓝(<30) → 暖橙(30-70) → 炽红(>70)
  const color = score > 70 ? '#ff4088' : score > 30 ? '#ff9100' : '#4d7cff';
  const glow = score > 70 ? '0 0 12px rgba(255,64,136,0.5)' : 'none';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: glow }}
      />
      <span className="text-xs font-mono" style={{ color }}>
        {Math.round(score)}°
      </span>
    </div>
  );
}
