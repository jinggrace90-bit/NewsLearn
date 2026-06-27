"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ParticleBackground from "@/components/ParticleBackground";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-xl font-bold text-[var(--gold)] tracking-tight">UpdateULvl</span>
        </div>
        <button
          onClick={() => router.push("/app")}
          className="px-5 py-2 bg-[var(--gold)] text-[var(--bg-primary)] rounded-lg text-sm font-bold hover:bg-[var(--gold-hover)] transition-all hover:shadow-lg hover:shadow-[var(--gold)]/20"
        >
          进入平台 →
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-8 pt-16 pb-24 text-center">
        <div className={`transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--gold-dim)] border border-[rgba(212,168,67,0.2)] text-[var(--gold)] text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse" />
            实时更新 · AI 驱动
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-5">
            <span className="text-[var(--text-primary)]">新闻 × 股票</span>
            <br />
            <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-light)] to-[var(--gold)] bg-clip-text text-transparent">
              交互式学习平台
            </span>
          </h1>

          <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed mb-10">
            实时追踪全球财经新闻 · 自动识别关联股票 · AI 市场情绪分析 ·
            <br />
            每篇新闻配套互动测验，边读边学，锻炼独立思考能力
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => router.push("/app")}
              className="px-8 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--accent-hover)] transition-all hover:shadow-lg hover:shadow-[var(--accent)]/30 hover:-translate-y-0.5"
            >
              开始阅读
            </button>
            <button
              onClick={() => router.push("/app")}
              className="px-8 py-3 border border-[var(--border-light)] text-[var(--text-secondary)] rounded-xl text-sm font-medium hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-all hover:-translate-y-0.5"
            >
              查看行情
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 max-w-4xl w-full transition-all duration-1000 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {[
            {
              icon: "📰",
              title: "实时新闻聚合",
              desc: "从 Bloomberg、Reuters、CNBC 等顶级财经媒体自动抓取，分类筛选，永不错过重要动态",
            },
            {
              icon: "📈",
              title: "股票联动分析",
              desc: "AI 自动从新闻中识别关联股票，实时展示行情走势、市场情绪，看涨看跌一目了然",
            },
            {
              icon: "📝",
              title: "互动学习测验",
              desc: "每篇新闻配套选择题 + 开放式问题，锻炼批判性思维，让阅读真正转化为知识",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-[var(--border)] bg-[rgba(22,34,48,0.5)] backdrop-blur-sm p-6 text-left hover:border-[var(--border-light)] hover:bg-[rgba(28,45,62,0.5)] transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => router.push("/app")}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-bold mb-1.5">{f.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className={`flex items-center justify-center gap-12 mt-16 transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {[
            { value: "100+", label: "新闻源" },
            { value: "50+", label: "覆盖股票" },
            { value: "AI", label: "情绪分析" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-[var(--gold)]">{s.value}</div>
              <div className="text-[0.65rem] text-[var(--text-muted)] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-muted)]">
        UpdateULvl — News × Stock × Learning Platform
      </footer>
    </div>
  );
}
