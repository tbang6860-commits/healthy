import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Activity, Share2 } from 'lucide-react';
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

  const handleShare = () => {
    if (!hotspot) return;
    generateShareCard(hotspot);
  };

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
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-[#0f0f0f] text-[#a0a0a0] border border-[#2a2a2a] hover:border-[#4cc9f0]/30 hover:text-white transition-all"
              title="生成分享卡片"
            >
              <Share2 size={11} />
              分享
            </button>
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

// ── Canvas 分享卡片生成 ──
function generateShareCard(h) {
  const W = 800;
  const H = 450;
  const canvas = document.createElement('canvas');
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2);

  // 背景
  ctx.fillStyle = '#0f0f0f';
  ctx.fillRect(0, 0, W, H);

  // 顶部装饰线
  ctx.fillStyle = '#4cc9f0';
  ctx.fillRect(0, 0, W, 4);

  // 辅助：文字换行
  function wrapText(text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = text.split('');
    let line = '';
    let count = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      const metrics = ctx.measureText(test);
      if (metrics.width > maxWidth && line.length > 0) {
        if (count >= maxLines - 1) {
          ctx.fillText(line.slice(0, -1) + '…', x, y + count * lineHeight);
          return;
        }
        ctx.fillText(line, x, y + count * lineHeight);
        line = chars[i];
        count++;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y + count * lineHeight);
  }

  const pad = 40;
  let y = 50;

  // 分类标签背景
  if (h.category) {
    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    const text = h.category;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(76, 201, 240, 0.12)';
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.25)';
    ctx.lineWidth = 1;
    const tagH = 26;
    const tagR = 13;
    const tagX = pad;
    const tagY = y;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tw + 20, tagH, tagR);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4cc9f0';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, tagX + 10, tagY + tagH / 2 + 1);
    y += 44;
  }

  // 标题
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", sans-serif';
  wrapText(h.title || '', pad, y, W - pad * 2, 36, 2);
  y += 88;

  // 热度
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '16px "JetBrains Mono", monospace';
  ctx.fillText(`热度指数 ${Math.round(h.heat_score || 0)}°`, pad, y);

  // 热度条背景
  const barY = y + 10;
  const barW = 200;
  const barH = 6;
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.roundRect(pad, barY, barW, barH, 3);
  ctx.fill();

  // 热度条前景
  const heatPct = Math.min((h.heat_score || 0) / 100, 1);
  const grad = ctx.createLinearGradient(pad, 0, pad + barW, 0);
  grad.addColorStop(0, '#4cc9f0');
  grad.addColorStop(1, '#4361ee');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(pad, barY, barW * heatPct, barH, 3);
  ctx.fill();

  y += 44;

  // 摘要
  if (h.summary) {
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '16px "PingFang SC", "Microsoft YaHei", sans-serif';
    wrapText(h.summary, pad, y, W - pad * 2, 26, 3);
    y += 100;
  }

  // 底部品牌
  y = Math.max(y, H - 60);
  ctx.fillStyle = '#4cc9f0';
  ctx.font = 'bold 18px "Inter", sans-serif';
  ctx.fillText('Pulse', pad, y);
  const pw = ctx.measureText('Pulse').width;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Sphere', pad + pw, y);

  ctx.fillStyle = '#6a6a6a';
  ctx.font = '12px "JetBrains Mono", monospace';
  const timeStr = new Date().toLocaleString('zh-CN');
  ctx.fillText(timeStr, W - pad - ctx.measureText(timeStr).width, y);

  // 下载
  const link = document.createElement('a');
  link.download = `pulse-${(h.title || 'hotspot').slice(0, 20).replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
