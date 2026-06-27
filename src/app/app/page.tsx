"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NewsCard from "@/components/NewsCard";
import NewsCarousel from "@/components/NewsCarousel";
import StockPanel from "@/components/StockPanel";
import SentimentPanel from "@/components/SentimentPanel";
import WatchlistBar from "@/components/WatchlistBar";
import QuizGame from "@/components/QuizGame";
import ParticleBackground from "@/components/ParticleBackground";

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

const CATEGORIES = [
  { key: "all", label: "全部" },
  { key: "tech", label: "科技" },
  { key: "finance", label: "金融" },
  { key: "health", label: "医疗" },
  { key: "energy", label: "能源" },
];

export default function Home() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [activeTicker, setActiveTicker] = useState("AAPL");
  const [category, setCategory] = useState("all");
  const [tickerInput, setTickerInput] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [newsRefreshing, setNewsRefreshing] = useState(false);

  const fetchNews = useCallback(async (cat: string) => {
    try {
      const res = await fetch(`/api/news?category=${cat}&limit=50`);
      const data = await res.json();
      setArticles(data.articles || []);
      setLastUpdate(new Date().toLocaleTimeString("zh-CN"));
    } catch {
      setArticles([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNews(category);
  }, [category, fetchNews]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        setActiveTicker(custom.detail);
      }
    };
    window.addEventListener("lookup-ticker", handler);
    return () => window.removeEventListener("lookup-ticker", handler);
  }, []);

  const selectArticle = (article: Article) => {
    setActiveArticle(article);
    if (article.tickers?.length > 0) {
      setActiveTicker(article.tickers[0]);
    }
  };

  const handleTickerSearch = () => {
    const t = tickerInput.trim().toUpperCase();
    if (t) {
      setActiveTicker(t);
      setTickerInput("");
    }
  };

  const refreshNews = async () => {
    setNewsRefreshing(true);
    try {
      await fetch("/api/news/refresh", { method: "POST" });
      await fetchNews(category);
    } catch {}
    setNewsRefreshing(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <ParticleBackground />

      {/* Header */}
      <header className="flex-shrink-0 bg-[rgba(17,29,39,0.85)] backdrop-blur-md border-b border-[var(--border)] px-5 h-14 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-base font-bold text-[var(--gold)] tracking-tight">UpdateULvl</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="text-[var(--text-secondary)] font-medium">新闻 · 股票 · 学习</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors font-medium"
          >
            ← 首页
          </button>
          <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTickerSearch()}
              placeholder="搜索股票代码..."
              className="bg-transparent border-none text-xs text-[var(--text-primary)] outline-none w-36 placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[0.65rem] text-[var(--text-muted)]">
            <div className="w-1.5 h-1.5 bg-[var(--accent-light)] rounded-full animate-pulse" />
            <span>{lastUpdate || "实时"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left: News Feed */}
        <div className="w-[340px] flex-shrink-0 border-r border-[var(--border)] flex flex-col bg-[rgba(11,18,25,0.75)] backdrop-blur-sm">
          <div className="px-3 pt-3 pb-2">
            <div className="flex gap-0.5 mb-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`flex-1 py-1 rounded text-[0.65rem] font-medium transition-colors ${
                    category === c.key
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[rgba(22,34,48,0.5)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">最新动态</span>
              <button
                onClick={refreshNews}
                disabled={newsRefreshing}
                className="text-[0.65rem] text-[var(--gold)] hover:text-[var(--gold-hover)] disabled:opacity-50 transition-colors"
              >
                {newsRefreshing ? "刷新中..." : "↻ 刷新"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-24 w-full" />
              ))
            ) : articles.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-xs">暂无新闻</p>
                <button onClick={refreshNews} className="mt-2 text-[0.65rem] text-[var(--gold)] hover:underline">
                  点击刷新
                </button>
              </div>
            ) : (
              articles.map((a) => (
                <NewsCard
                  key={a.id}
                  article={a}
                  isActive={activeArticle?.id === a.id}
                  onClick={() => selectArticle(a)}
                />
              ))
            )}
          </div>
        </div>

        {/* Center: Carousel + Article Reading + Quiz */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[rgba(11,18,25,0.6)] backdrop-blur-sm">
          {!activeArticle ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Carousel when no article selected */}
              <NewsCarousel articles={articles} onSelect={selectArticle} activeId={activeArticle?.id ?? null} />

              {/* Quick picks grid */}
              <div>
                <div className="text-[0.65rem] font-bold text-[var(--gold)] uppercase tracking-wider mb-2">🔥 热门新闻</div>
                <div className="grid grid-cols-2 gap-2">
                  {articles.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => selectArticle(a)}
                      className="rounded-lg border border-[var(--border)] bg-[rgba(22,34,48,0.5)] p-3 cursor-pointer hover:border-[var(--border-light)] hover:bg-[rgba(28,45,62,0.6)] transition-all"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[0.55rem] font-bold text-[var(--gold)]">{a.source}</span>
                        <span className={`text-[0.55rem] ${
                          a.sentiment === "bullish" ? "text-[var(--green)]" : a.sentiment === "bearish" ? "text-[var(--red)]" : "text-[var(--yellow)]"
                        }`}>
                          {a.sentiment === "bullish" ? "📈" : a.sentiment === "bearish" ? "📉" : "➡️"}
                        </span>
                      </div>
                      <p className="text-[0.75rem] font-semibold line-clamp-2 leading-snug">{a.title}</p>
                      {a.tickers?.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {a.tickers.slice(0, 2).map((t) => (
                            <span key={t} className="text-[0.5rem] px-1 py-0.5 rounded bg-[var(--gold-dim)] text-[var(--gold)] font-bold">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Article Header */}
              <div className="px-6 pt-5 pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </button>
                  <span className="text-[0.65rem] px-2 py-0.5 rounded bg-[var(--accent)] text-white font-semibold">{activeArticle.source}</span>
                  <span className="text-[0.65rem] text-[var(--text-muted)]">{new Date(activeArticle.published_at).toLocaleString("zh-CN")}</span>
                  <span className={`text-[0.65rem] px-2 py-0.5 rounded font-semibold ${
                    activeArticle.sentiment === "bullish" ? "bg-[var(--green-bg)] text-[var(--green)]" :
                    activeArticle.sentiment === "bearish" ? "bg-[var(--red-bg)] text-[var(--red)]" :
                    "bg-[var(--yellow-bg)] text-[var(--yellow)]"
                  }`}>
                    {activeArticle.sentiment === "bullish" ? "📈 看涨" : activeArticle.sentiment === "bearish" ? "📉 看跌" : "➡️ 中性"}
                  </span>
                </div>
                <h1 className="text-xl font-bold leading-snug mb-2">{activeArticle.title}</h1>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{activeArticle.summary}</p>

                {activeArticle.tickers?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {activeArticle.tickers.map((t: string) => (
                      <span
                        key={t}
                        className="text-[0.65rem] px-2 py-0.5 rounded bg-[var(--gold-dim)] text-[var(--gold)] font-semibold cursor-pointer hover:bg-[rgba(212,168,67,0.2)] transition-colors"
                        onClick={() => setActiveTicker(t)}
                      >
                        ${t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Article Body */}
              <div className="px-6 py-4">
                <div className="text-sm text-[var(--text-secondary)] leading-[1.8] space-y-3">
                  {(activeArticle.content || activeArticle.summary || "")
                    .split("\n")
                    .filter((p) => p.trim())
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
                {activeArticle.link && (
                  <a
                    href={activeArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-4 text-xs text-[var(--gold)] hover:text-[var(--gold-hover)] transition-colors"
                  >
                    阅读原文
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7v10"/>
                    </svg>
                  </a>
                )}
              </div>

              {/* Sentiment */}
              <div className="px-6 pb-4">
                <SentimentPanel
                  sentiment={activeArticle.sentiment}
                  score={activeArticle.sentiment_score}
                  detail={activeArticle.sentiment_detail}
                />
              </div>

              {/* Quiz integrated into article */}
              <div className="px-6 pb-6 border-t border-[var(--border)] pt-4">
                <div className="text-xs font-bold text-[var(--gold)] mb-3 uppercase tracking-wider">📝 学习测验</div>
                <QuizGame articleId={activeArticle.id} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Stock Sidebar */}
        <div className="w-[360px] flex-shrink-0 border-l border-[var(--border)] flex flex-col overflow-hidden bg-[rgba(11,18,25,0.75)] backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTickerSearch()}
                placeholder="输入股票代码..."
                className="flex-1 px-3 py-2 bg-[rgba(22,34,48,0.6)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] outline-none focus:border-[var(--gold)] placeholder:text-[var(--text-muted)] transition-colors"
              />
              <button
                onClick={handleTickerSearch}
                className="px-3 py-2 bg-[var(--gold)] text-[var(--bg-primary)] rounded-lg text-xs font-bold hover:bg-[var(--gold-hover)] transition-colors"
              >
                查看
              </button>
            </div>

            <WatchlistBar onSelect={setActiveTicker} activeTicker={activeTicker} />
            <StockPanel ticker={activeTicker} />
          </div>
        </div>
      </div>
    </div>
  );
}
