import httpx
import json
import re
from datetime import datetime, timedelta

YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
YAHOO_SEARCH_URL = "https://query2.finance.yahoo.com/v1/finance/search"
YAHOO_SPARK_URL = "https://query1.finance.yahoo.com/v8/finance/spark"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


async def get_stock_quote(ticker: str) -> dict:
    ticker = ticker.upper().strip()
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(
                YAHOO_QUOTE_URL.format(ticker=ticker),
                headers=HEADERS,
                params={
                    "interval": "1d",
                    "range": "5d",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        result = data["chart"]["result"][0]
        meta = result["meta"]
        indicators = result.get("indicators", {})
        quotes = indicators.get("quote", [{}])[0]

        current_price = meta.get("regularMarketPrice", 0)
        previous_close = meta.get("previousClose", meta.get("chartPreviousClose", 0))
        change = current_price - previous_close if previous_close else 0
        change_pct = (change / previous_close * 100) if previous_close else 0

        timestamps = result.get("timestamp", [])
        closes = quotes.get("close", [])
        volumes = quotes.get("volume", [])

        valid_closes = [c for c in closes if c is not None]
        valid_volumes = [v for v in volumes if v is not None]

        high_prices = quotes.get("high", [])
        low_prices = quotes.get("low", [])
        open_prices = quotes.get("open", [])

        valid_highs = [h for h in high_prices if h is not None]
        valid_lows = [l for l in low_prices if l is not None]
        valid_opens = [o for o in open_prices if o is not None]

        chart_data = []
        for i, ts in enumerate(timestamps):
            if i < len(closes) and closes[i] is not None:
                chart_data.append({
                    "time": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
                    "price": round(closes[i], 2),
                })

        return {
            "ticker": ticker,
            "name": meta.get("shortName", meta.get("symbol", ticker)),
            "currency": meta.get("currency", "USD"),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "open": round(valid_opens[-1], 2) if valid_opens else round(current_price, 2),
            "high": round(max(valid_highs), 2) if valid_highs else round(current_price, 2),
            "low": round(min(valid_lows), 2) if valid_lows else round(current_price, 2),
            "volume": sum(valid_volumes) if valid_volumes else 0,
            "previous_close": round(previous_close, 2) if previous_close else 0,
            "day_range": f"{round(min(valid_lows), 2) if valid_lows else 0} - {round(max(valid_highs), 2) if valid_highs else 0}",
            "chart_data": chart_data,
            "market_state": meta.get("marketState", "UNKNOWN"),
            "exchange": meta.get("exchangeName", ""),
        }
    except Exception as e:
        return {
            "ticker": ticker,
            "name": ticker,
            "error": str(e),
            "price": 0,
            "change": 0,
            "change_pct": 0,
        }


async def get_stock_spark(ticker: str, range_: str = "1d", interval: str = "5m") -> dict:
    ticker = ticker.upper().strip()
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(
                YAHOO_SPARK_URL,
                headers=HEADERS,
                params={
                    "symbols": ticker,
                    "range": range_,
                    "interval": interval,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        spark = data.get("spark", {}).get("result", [{}])[0]
        indicators = spark.get("indicators", {}).get("quote", [{}])[0]
        timestamps = spark.get("timestamp", [])
        closes = indicators.get("close", [])

        chart_data = []
        for i, ts in enumerate(timestamps):
            if i < len(closes) and closes[i] is not None:
                chart_data.append({
                    "time": datetime.fromtimestamp(ts).strftime("%H:%M"),
                    "price": round(closes[i], 2),
                })

        return {"ticker": ticker, "chart_data": chart_data}
    except Exception:
        return {"ticker": ticker, "chart_data": []}


async def search_ticker(query: str) -> list:
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(
                YAHOO_SEARCH_URL,
                headers=HEADERS,
                params={"q": query, "quotes_count": 5, "news_count": 0},
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for quote in data.get("quotes", [])[:5]:
            results.append({
                "symbol": quote.get("symbol", ""),
                "name": quote.get("shortname", quote.get("longname", "")),
                "exchange": quote.get("exchange", ""),
                "type": quote.get("quoteType", ""),
            })
        return results
    except Exception:
        return []


async def get_multiple_quotes(tickers: list) -> list:
    results = []
    for ticker in tickers[:10]:
        quote = await get_stock_quote(ticker)
        results.append(quote)
    return results
