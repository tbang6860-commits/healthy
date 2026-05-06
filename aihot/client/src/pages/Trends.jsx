import { useState, useEffect } from 'react';
import TrendChart from '../components/TrendChart';

export default function Trends({ hotspots }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hotspots/trends')
      .then(r => r.json())
      .then(json => {
        // 按热点分组
        const grouped = {};
        for (const s of json.data || []) {
          if (!grouped[s.hotspot_id]) grouped[s.hotspot_id] = [];
          grouped[s.hotspot_id].push(s);
        }
        setTrends(Object.entries(grouped).slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-200">热度趋势</h2>

      {trends.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-500">暂无趋势数据，等待更多抓取周期...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trends.map(([hotspotId, snapshots]) => (
            <div key={hotspotId} className="glass-card p-4">
              <p className="text-sm text-gray-400 mb-3 truncate">
                {snapshots[0]?.title || `热点 #${hotspotId}`}
              </p>
              <TrendChart data={snapshots} />
            </div>
          ))}
        </div>
      )}

      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">当前 TOP 10 热度分布</h3>
        <div className="space-y-2">
          {hotspots.slice(0, 10).map((h, i) => (
            <div key={h.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-5">{i + 1}</span>
              <span className="text-sm text-gray-300 truncate flex-1">{h.title}</span>
              <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${h.heat_score}%`,
                    background: h.heat_score > 70
                      ? 'linear-gradient(90deg, #ff4088, #ff9100)'
                      : h.heat_score > 30
                      ? 'linear-gradient(90deg, #4d7cff, #00e5ff)'
                      : '#4d7cff',
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-10 text-right">
                {Math.round(h.heat_score)}°
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
