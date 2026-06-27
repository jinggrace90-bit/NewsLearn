"use client";

import { useState, useEffect } from "react";

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

interface NewsCarouselProps {
  articles: Article[];
  onSelect: (article: Article) => void;
  activeId: number | null;
}

export default function NewsCarousel({ articles, onSelect, activeId }: NewsCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fade, setFade] = useState(true);

  const featured = articles.slice(0, 6);

  useEffect(() => {
    if (isPaused || featured.length <= 1) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((p) => (p + 1) % featured.length);
        setFade(true);
      }, 200);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, featured.length]);

  if (!featured.length) return null;

  const article = featured[current];
  const sentimentColor =
    article.sentiment === "bullish" ? "text-[var(--green)]" :
    article.sentiment === "bearish" ? "text-[var(--red)]" :
    "text-[var(--yellow)]";
  const sentimentIcon =
    article.sentiment === "bullish" ? "📈" :
    article.sentiment === "bearish" ? "📉" : "➡️";

  const go = (dir: number) => {
    setFade(false);
    setTimeout(() => {
      setCurrent((p) => (p + dir + featured.length) % featured.length);
      setFade(true);
    }, 200);
  };

  return (
    <div
      className="relative rounded-2xl border border-[var(--border)] bg-[rgba(22,34,48,0.6)] backdrop-blur-sm overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={() => onSelect(article)}
    >
      {/* Main slide */}
      <div className={`px-8 py-10 min-h-[380px] flex flex-col justify-between transition-opacity duration-200 ${fade ? "opacity-100" : "opacity-0"}`}>
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <span className="text-[0.75rem] px-3 py-1 rounded-md bg-[var(--gold)] text-[var(--bg-primary)] font-bold">{article.source}</span>
            <span className={`text-[0.75rem] font-semibold ${sentimentColor}`}>
              {sentimentIcon} {article.sentiment === "bullish" ? "看涨" : article.sentiment === "bearish" ? "看跌" : "中性"}
            </span>
            <span className="text-[0.7rem] text-[var(--text-muted)] ml-auto uppercase tracking-wider">{article.category}</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight mb-4 group-hover:text-[var(--gold)] transition-colors">
            {article.title}
          </h2>
          <p className="text-base text-[var(--text-secondary)] line-clamp-3 leading-relaxed max-w-3xl">
            {article.summary}
          </p>
        </div>

        {article.tickers?.length > 0 && (
          <div className="flex gap-2.5 mt-5">
            {article.tickers.slice(0, 5).map((t: string) => (
              <span key={t} className="text-[0.7rem] px-3 py-1.5 rounded-md bg-[var(--gold-dim)] text-[var(--gold)] font-bold hover:bg-[rgba(212,168,67,0.2)] transition-colors">
                ${t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Nav arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[rgba(0,0,0,0.5)] backdrop-blur-sm text-white text-base flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgba(0,0,0,0.7)]"
      >
        ‹
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); go(1); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[rgba(0,0,0,0.5)] backdrop-blur-sm text-white text-base flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[rgba(0,0,0,0.7)]"
      >
        ›
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[rgba(255,255,255,0.05)]">
        {!isPaused && (
          <div
            className="h-full bg-[var(--gold)] transition-all duration-[6000ms] linear"
            style={{ width: fade ? "100%" : "0%", transition: fade ? "width 6s linear" : "none" }}
          />
        )}
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setFade(false);
              setTimeout(() => {
                setCurrent(i);
                setFade(true);
              }, 200);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-[var(--gold)] w-6" : "bg-white/20 w-1.5 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-3 right-4 text-[0.6rem] text-[var(--text-muted)] font-mono">
        {current + 1} / {featured.length}
      </div>
    </div>
  );
}
