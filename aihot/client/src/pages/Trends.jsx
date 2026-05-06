import { useState, useEffect } from 'react';
import TrendChart from '../components/TrendChart';
import { Activity } from 'lucide-react';

export default function Trends({ hotspots }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hotspots/trends')
      .then(r => r.json())
      .then(json => {
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
      <div className="space-y-6">
        <div className="h-5 w-28 skeleton rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-48 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Activity size={17} className="text-[#4cc9f0]" />
        <h2 className="text-lg font-bold text-white">热度趋势</h2>
      </div>

      {trends.length === 0 ? (
        <div className="card p-12 text-center">
          <Activity size={28} className="text-[#8a8a8a] mx-auto mb-2" />
          <p className="text-[#a0a0a0] text-xs">暂无趋势数据，等待更多抓取周期...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {trends.map(([hotspotId, snapshots]) => (
            <div key={hotspotId} className="card p-5">
              <p className="text-sm text-white mb-4 truncate font-medium">
                {snapshots[0]?.title || `热点 #${hotspotId}`}
              </p>
              <TrendChart data={snapshots} />
            </div>
          ))}
        </div>
      )}

      {/* Distribution */}
      <div className="card p-6">
        <h3 className="text-xs font-semibold text-[#a0a0a0] mb-5 uppercase tracking-wider">当前热度分布 TOP 10</h3>
        <div className="space-y-3">
          {hotspots.slice(0, 10).map((h, i) => (
            <div key={h.id} className="flex items-center gap-3">
              <span className="text-[11px] text-[#8a8a8a] w-5 font-mono">{i + 1}</span>
              <span className="text-sm text-white truncate flex-1">{h.title}</span>
              <div className="w-32 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${h.heat_score > 70 ? 'heat-high' : h.heat_score > 30 ? 'heat-mid' : 'heat-low'}`}
                  style={{ width: `${Math.min(h.heat_score, 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-[#a0a0a0] w-9 text-right font-mono">{Math.round(h.heat_score)}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
