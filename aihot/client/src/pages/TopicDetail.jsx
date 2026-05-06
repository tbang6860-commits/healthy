import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Activity } from 'lucide-react';
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
      .then(data => { setHotspot(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="h-4 w-20 skeleton rounded" />
        <div className="card p-6 space-y-4">
          <div className="h-4 w-16 skeleton rounded" />
          <div className="h-7 w-3/4 skeleton rounded" />
          <div className="h-24 w-full skeleton rounded" />
          <div className="h-4 w-40 skeleton rounded" />
        </div>
      </div>
    );
  }

  if (!hotspot || hotspot.error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Activity size={32} className="text-[#8a8a8a] mx-auto mb-3" />
        <p className="text-[#a0a0a0]">热点未找到</p>
        <button onClick={onBack} className="mt-4 text-[#4cc9f0] text-sm hover:underline">返回看板</button>
      </div>
    );
  }

  const { title, summary, category, sentiment, sentiment_score, heat_score, sources, snapshots } = hotspot;
  const sc = {
    positive: { label: '正面', c: '#4cc9f0' },
    negative: { label: '负面', c: '#f87171' },
    neutral: { label: '中性', c: '#a0a0a0' },
  }[sentiment] || { label: '未知', c: '#8a8a8a' };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#a0a0a0] hover:text-white transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        返回看板
      </button>

      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#4cc9f0]/10 text-[#4cc9f0] border border-[#4cc9f0]/20 font-medium">
              {category}
            </span>
          )}
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]" style={{ color: sc.c }}>
            {sc.label}
          </span>
        </div>

        <h1 className="text-xl font-bold text-white leading-snug">{title}</h1>

        {summary && (
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-5">
            <p className="text-sm text-[#a0a0a0] leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <HeatBadge score={heat_score} />
            {sentiment_score !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sentiment_score * 100}%`, background: sc.c }} />
                </div>
                <span className="text-[11px] text-[#a0a0a0] font-mono">{Math.round(sentiment_score * 100)}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(sources || []).map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-[#0f0f0f] text-[#a0a0a0] border border-[#2a2a2a] hover:border-[#4cc9f0]/30 hover:text-white transition-all">
                <SourceTag source={s.source} />
                <ExternalLink size={9} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {snapshots && snapshots.length > 1 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">24h 热度趋势</h3>
          <TrendChart data={snapshots} />
        </div>
      )}
    </div>
  );
}
