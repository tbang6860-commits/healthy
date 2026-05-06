import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, TrendingUp, Activity } from 'lucide-react';
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
      <div className="max-w-3xl mx-auto">
        <div className="glass-card p-8 animate-pulse space-y-4">
          <div className="w-20 h-5 bg-white/[0.04] rounded" />
          <div className="w-3/4 h-7 bg-white/[0.03] rounded" />
          <div className="w-full h-24 bg-white/[0.02] rounded" />
          <div className="w-1/2 h-5 bg-white/[0.03] rounded" />
        </div>
      </div>
    );
  }

  if (!hotspot || hotspot.error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <Activity size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-secondary)]">热点未找到或已被移除</p>
        <button onClick={onBack} className="mt-4 text-[var(--accent)] text-sm hover:underline">
          返回看板
        </button>
      </div>
    );
  }

  const { title, summary, category, sentiment, sentiment_score, heat_score, sources, snapshots } = hotspot;

  const sentimentCfg = {
    positive: { label: '正面', color: 'var(--accent-new)', emoji: '↑' },
    negative: { label: '负面', color: 'var(--accent-hot)', emoji: '↓' },
    neutral: { label: '中性', color: 'var(--text-muted)', emoji: '—' },
  }[sentiment] || { label: '未知', color: 'var(--text-muted)', emoji: '?' };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        返回看板
      </button>

      {/* Main card */}
      <div className="glass-card spotlight-card p-6 space-y-5">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {category && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.06] font-medium">
              {category}
            </span>
          )}
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]"
            style={{ color: sentimentCfg.color }}
          >
            {sentimentCfg.emoji} {sentimentCfg.label}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-white leading-snug">{title}</h1>

        {/* AI Summary */}
        {summary && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center">
                <TrendingUp size={11} className="text-white" />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)]">AI 分析摘要</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]/90 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <HeatBadge score={heat_score} />
            {sentiment_score !== undefined && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sentiment_score * 100}%`,
                      background: sentimentCfg.color,
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  {Math.round(sentiment_score * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(sources || []).map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.06] hover:border-white/[0.15] hover:text-white transition-all"
              >
                <SourceTag source={s.source} />
                <ExternalLink size={10} className="text-[var(--text-muted)]" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Trend chart */}
      {snapshots && snapshots.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Activity size={15} className="text-[var(--accent)]" />
            24h 热度趋势
          </h3>
          <TrendChart data={snapshots} />
        </div>
      )}

      {/* Cross-source comparison placeholder */}
      {sources && sources.length > 1 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">跨平台讨论来源</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sources.map((s, i) => (
              <div
                key={i}
                className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors"
              >
                <SourceTag source={s.source} />
                <div className="mt-2 text-lg font-semibold text-white font-mono">
                  {Math.round(s.heat || s.heat_score || 0)}°
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">热度指数</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
