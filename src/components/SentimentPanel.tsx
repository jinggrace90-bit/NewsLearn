"use client";

interface SentimentPanelProps {
  sentiment: string;
  score: number;
  detail: string;
}

export default function SentimentPanel({ sentiment, score, detail }: SentimentPanelProps) {
  const config: Record<string, { label: string; class: string; icon: string }> = {
    bullish: { label: "看涨", class: "bg-[var(--green-bg)] text-[var(--green)]", icon: "📈" },
    bearish: { label: "看跌", class: "bg-[var(--red-bg)] text-[var(--red)]", icon: "📉" },
    neutral: { label: "中性", class: "bg-[var(--yellow-bg)] text-[var(--yellow)]", icon: "➡️" },
  };
  const c = config[sentiment] || config.neutral;
  const bullPct = Math.round(score * 100);
  const bearPct = 100 - bullPct;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">市场情绪</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold ${c.class}`}>
          {c.icon} {c.label}
        </span>
      </div>

      <div className="w-full h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden flex mb-1">
        <div
          className="h-full bg-[var(--green)] transition-all duration-500"
          style={{ width: `${bullPct}%` }}
        />
        <div
          className="h-full bg-[var(--red)] transition-all duration-500"
          style={{ width: `${bearPct}%` }}
        />
      </div>

      <div className="flex justify-between text-[0.6rem] text-[var(--text-muted)] mb-2">
        <span>🟢 看涨 {bullPct}%</span>
        <span>🔴 看跌 {bearPct}%</span>
      </div>

      {detail && (
        <p className="text-[0.7rem] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-2">
          {detail}
        </p>
      )}
    </div>
  );
}
