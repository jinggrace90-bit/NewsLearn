"use client";

interface Article {
  id: number;
  source: string;
  title: string;
  summary: string;
  content: string;
  link: string;
  published_at: string;
  category: string;
  tickers: string[];
  sentiment: string;
  sentiment_score: number;
  sentiment_detail: string;
  image_url: string;
}

interface NewsCardProps {
  article: Article;
  isActive: boolean;
  onClick: () => void;
}

export default function NewsCard({ article, isActive, onClick }: NewsCardProps) {
  const sentimentConfig: Record<string, { label: string; class: string }> = {
    bullish: { label: "看涨", class: "bg-[var(--green-bg)] text-[var(--green)]" },
    bearish: { label: "看跌", class: "bg-[var(--red-bg)] text-[var(--red)]" },
    neutral: { label: "中性", class: "bg-[var(--yellow-bg)] text-[var(--yellow)]" },
  };
  const s = sentimentConfig[article.sentiment] || sentimentConfig.neutral;

  const timeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "刚刚";
      if (mins < 60) return `${mins}分钟前`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}小时前`;
      const days = Math.floor(hours / 24);
      return `${days}天前`;
    } catch {
      return "";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-all duration-150 ${
        isActive
          ? "border-[var(--gold)] bg-[rgba(22,34,48,0.8)] backdrop-blur-sm shadow-[0_0_0_1px_var(--gold)]"
          : "border-[var(--border)] bg-[rgba(22,34,48,0.5)] hover:border-[var(--border-light)] hover:bg-[rgba(28,45,62,0.6)]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[0.6rem] font-bold text-[var(--gold)]">{article.source}</span>
        <span className="text-[0.6rem] text-[var(--text-muted)]">{timeAgo(article.published_at)}</span>
        <span className={`ml-auto text-[0.55rem] px-1.5 py-0.5 rounded font-semibold ${s.class}`}>
          {s.label}
        </span>
      </div>
      <h3 className="text-[0.8rem] font-semibold leading-snug line-clamp-2 mb-1">{article.title}</h3>
      <p className="text-[0.7rem] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
        {article.summary}
      </p>
      {article.tickers?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {article.tickers.slice(0, 3).map((t: string) => (
            <span
              key={t}
              className="text-[0.55rem] px-1.5 py-0.5 rounded bg-[var(--gold-dim)] text-[var(--gold)] font-bold cursor-pointer hover:bg-[rgba(212,168,67,0.2)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("lookup-ticker", { detail: t }));
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
