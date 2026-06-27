"use client";

import { useState, useEffect } from "react";
import StockChart from "./StockChart";

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previous_close: number;
  day_range: string;
  chart_data: { time: string; price: number }[];
  market_state: string;
  exchange: string;
}

interface StockPanelProps {
  ticker: string;
}

export default function StockPanel({ ticker }: StockPanelProps) {
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stock/${ticker}`)
      .then((r) => r.json())
      .then((data) => {
        setStock(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4">
        <div className="skeleton h-4 w-20 mb-3" />
        <div className="skeleton h-8 w-32 mb-2" />
        <div className="skeleton h-[140px] w-full mb-3" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!stock || stock.error) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4 text-center text-[var(--text-muted)] text-xs">
        无法获取 {ticker} 数据
      </div>
    );
  }

  const isUp = (stock.change || 0) >= 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(22,34,48,0.7)] backdrop-blur-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-bold">{stock.ticker}</div>
          <div className="text-[0.65rem] text-[var(--text-muted)]">{stock.name}</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${isUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            ${stock.price?.toFixed(2) || "--"}
          </div>
          <div className={`text-[0.7rem] font-bold ${isUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
            {isUp ? "+" : ""}{stock.change?.toFixed(2)} ({stock.change_pct?.toFixed(2)}%)
          </div>
        </div>
      </div>

      {stock.chart_data && stock.chart_data.length > 0 && (
        <div className="mb-3">
          <StockChart data={stock.chart_data} height={140} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.65rem]">
        {[
          ["开盘", `$${stock.open?.toFixed(2) || "--"}`],
          ["最高", `$${stock.high?.toFixed(2) || "--"}`],
          ["最低", `$${stock.low?.toFixed(2) || "--"}`],
          ["成交量", stock.volume ? `${(stock.volume / 1000000).toFixed(1)}M` : "--"],
          ["前收盘", `$${stock.previous_close?.toFixed(2) || "--"}`],
          ["日内", stock.day_range || "--"],
        ].map(([label, value]) => (
          <div key={label as string} className="flex justify-between">
            <span className="text-[var(--text-muted)]">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>

      {stock.market_state && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${
            stock.market_state === "REGULAR" ? "bg-[var(--green)]" : "bg-[var(--yellow)]"
          }`} />
          <span className="text-[0.6rem] text-[var(--text-muted)]">
            {stock.market_state === "REGULAR" ? "交易中" :
             stock.market_state === "PRE" ? "盘前" :
             stock.market_state === "POST" ? "盘后" : stock.market_state}
          </span>
        </div>
      )}
    </div>
  );
}
