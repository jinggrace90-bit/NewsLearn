"use client";

import { useEffect, useRef } from "react";

interface ChartData {
  time: string;
  price: number;
}

interface StockChartProps {
  data: ChartData[];
  height?: number;
}

export default function StockChart({ data, height = 180 }: StockChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 10, right: 10, bottom: 25, left: 10 };

    ctx.clearRect(0, 0, w, h);

    const prices = data.map((d) => d.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const isUp = prices[prices.length - 1] >= prices[0];
    const lineColor = isUp ? "#38c97a" : "#e85454";

    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const getX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
    const getY = (p: number) =>
      padding.top + chartH - ((p - minP) / range) * chartH;

    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, isUp ? "rgba(56,201,122,0.12)" : "rgba(232,84,84,0.12)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.lineTo(getX(data.length - 1), h - padding.bottom);
    ctx.lineTo(getX(0), h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    const labelStep = Math.max(1, Math.floor(data.length / 5));
    data.forEach((d, i) => {
      if (i % labelStep === 0 || i === data.length - 1) {
        ctx.fillText(d.time, getX(i), h - 5);
      }
    });

    const lastPrice = data[data.length - 1].price;
    const lastX = getX(data.length - 1);
    const lastY = getY(lastPrice);

    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    ctx.fillStyle = lineColor;
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`$${lastPrice.toFixed(2)}`, lastX - 6, lastY - 6);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: `${height}px` }}
      className="rounded-lg bg-[var(--bg-primary)]"
    />
  );
}
