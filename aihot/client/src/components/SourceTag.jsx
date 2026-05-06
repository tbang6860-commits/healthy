const LABELS = {
  weibo: '微博',
  baidu: '百度',
  zhihu: '知乎',
  twitter: 'X',
  bilibili: 'B站',
  v2ex: 'V2EX',
  hackernews: 'HN',
  github: 'GitHub',
};

export default function SourceTag({ source }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-md source-${source} font-medium`}>
      {LABELS[source] || source}
    </span>
  );
}
