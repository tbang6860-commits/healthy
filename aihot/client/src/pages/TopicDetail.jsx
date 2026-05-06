import { useState, useEffect } from 'react';
import SourceTag from '../components/SourceTag';
import HeatBadge from '../components/HeatBadge';
import TrendChart from '../components/TrendChart';

export default function TopicDetail({ id, onBack }) {
  const [hotspot, setHotspot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/hotspots/${id}`)
      .then(r => r.json())
      .then(data => {
        setHotspot(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hotspot || hotspot.error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-gray-400">热点未找到</p>
        <button onClick={onBack} className="mt-3 text-blue-400 text-sm hover:underline">返回</button>
      </div>
    );
  }

  const { title, summary, category, sentiment, sentiment_score, heat_score, sources, snapshots } = hotspot;

  const sentimentEmoji = sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😟' : '😐';
  const sentimentLabel = sentiment === 'positive' ? '正面' : sentiment === 'negative' ? '负面' : '中性';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 返回 */}
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-gray-200 text-sm transition"
      >
        ← 返回看板
      </button>

      {/* 主体卡片 */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
              {category}
            </span>
          )}
          <span className="text-xs text-gray-500">{sentimentEmoji} {sentimentLabel}</span>
        </div>

        <h2 className="text-xl font-bold text-gray-100">{title}</h2>

        {summary && (
          <div className="bg-white/[0.03] border border-white/5 rounded-lg p-4">
            <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <HeatBadge score={heat_score} />
          <div className="flex gap-2">
            {(sources || []).map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs px-2 py-1 rounded source-${s.source} hover:opacity-80 transition`}
              >
                查看来源 →
              </a>
            ))}
          </div>
        </div>

        {/* 情感强度条 */}
        {sentiment_score !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>情感强度</span>
              <span>{Math.round(sentiment_score * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  sentiment === 'positive' ? 'bg-green-400' :
                  sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-400'
                }`}
                style={{ width: `${sentiment_score * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 趋势图 */}
      {snapshots && snapshots.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">24h 热度趋势</h3>
          <TrendChart data={snapshots} />
        </div>
      )}
    </div>
  );
}
