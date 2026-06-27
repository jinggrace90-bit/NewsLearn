"use client";

import { useState, useEffect } from "react";

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
}

interface WatchlistBarProps {
  onSelect: (ticker: string) => void;
  activeTicker: string;
}

export default function WatchlistBar({ onSelect, activeTicker }: WatchlistBarProps) {
  const [stocks, setStocks] = useState<StockData[]>([]);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => setStocks(data.stocks || []))
      .catch(() => {});
  }, []);

  if (!stocks.length) return null;

  return (
    <div className="space-y-1">
      <div className="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">自选</div>
      <div className="space-y-1">
        {stocks.map((s) => (
          <div
            key={s.ticker}
            onClick={() => onSelect(s.ticker)}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs ${
              s.ticker === activeTicker
                ? "bg-[rgba(22,34,48,0.8)] backdrop-blur-sm border border-[var(--gold)] shadow-[0_0_0_1px_var(--gold)]"
                : "hover:bg-[rgba(22,34,48,0.5)] border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-[0.75rem]">{s.ticker}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)] truncate max-w-[100px]">{s.name}</span>
            </div>
            <div className="text-right">
              <div className="text-[0.75rem] font-medium">${s.price?.toFixed(2) || "--"}</div>
              <div
                className={`text-[0.6rem] font-bold ${
                  (s.change_pct || 0) >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
                }`}
              >
                {(s.change_pct || 0) >= 0 ? "+" : ""}
                {(s.change_pct || 0).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
