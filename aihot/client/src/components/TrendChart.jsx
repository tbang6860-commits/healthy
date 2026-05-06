export default function TrendChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-gray-500 text-center py-8">暂无趋势数据</p>;
  }

  const maxHeat = Math.max(...data.map(d => d.heat_score), 1);
  const height = 120;
  const width = 100 / (data.length - 1 || 1);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
        {/* 渐变填充 */}
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(77,124,255,0.4)" />
            <stop offset="100%" stopColor="rgba(77,124,255,0.02)" />
          </linearGradient>
        </defs>

        {/* 区域填充 */}
        <path
          d={`
            M 0 ${height}
            ${data.map((d, i) => `L ${i * width} ${height - (d.heat_score / maxHeat) * height}`).join(' ')}
            L ${(data.length - 1) * width} ${height}
            Z
          `}
          fill="url(#trendFill)"
        />

        {/* 折线 */}
        <path
          d={data
            .map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * width} ${height - (d.heat_score / maxHeat) * height}`)
            .join(' ')}
          fill="none"
          stroke="rgba(77,124,255,0.8)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* 数据点 */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={i * width}
            cy={height - (d.heat_score / maxHeat) * height}
            r="1.5"
            fill={d.heat_score > 70 ? '#ff4088' : '#4d7cff'}
          />
        ))}
      </svg>
    </div>
  );
}
