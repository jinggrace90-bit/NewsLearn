import feedparser
import httpx
import re
import json
from datetime import datetime
from dateutil import parser as dateparser

RSS_FEEDS = {
    "Bloomberg": "https://feeds.bloomberg.com/markets/news.rss",
    "Reuters Business": "https://www.rssbridge.org/bridge/?action=display&bridge=Reuters&feed=business&format=Atom",
    "CNBC": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147",
    "MarketWatch": "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "Yahoo Finance": "https://finance.yahoo.com/news/rssindex",
    "Investing.com": "https://www.investing.com/rss/news.rss",
    "WSJ Markets": "https://feeds.a]content.dowjones.io/public/rss/mw_realtimeheadlines",
    "TechCrunch": "https://techcrunch.com/feed/",
    "The Verge": "https://www.theverge.com/rss/index.xml",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
}

FALLBACK_FEEDS = {
    "Google News Business": "https://news.google.com/rss/search?q=stock+market+business&hl=en-US&gl=US&ceid=US:en",
    "Google News Tech": "https://news.google.com/rss/search?q=technology+AI+stocks&hl=en-US&gl=US&ceid=US:en",
    "Google News Finance": "https://news.google.com/rss/search?q=finance+economy+market&hl=en-US&gl=US&ceid=US:en",
    "Google News Energy": "https://news.google.com/rss/search?q=oil+energy+stocks&hl=en-US&gl=US&ceid=US:en",
    "Google News Health": "https://news.google.com/rss/search?q=pharma+biotech+healthcare+stocks&hl=en-US&gl=US&ceid=US:en",
}

CATEGORY_KEYWORDS = {
    "tech": ["apple", "google", "microsoft", "nvidia", "ai", "chip", "software", "cloud", "data", "cyber", "meta", "amazon", "tesla", "semiconductor", "quantum", "robot"],
    "finance": ["bank", "fed", "interest rate", "inflation", "gdp", "recession", "market", "stock", "trading", "investment", "jpmorgan", "goldman", "citi", "wall street", "bond"],
    "health": ["pharma", "drug", "fda", "vaccine", "biotech", "medical", "healthcare", "clinical", "trial", "therapy", "pfizer", "moderna", "merck"],
    "energy": ["oil", "gas", "renewable", "solar", "wind", "opec", "energy", "crude", "pipeline", "exxon", "chevron", "nuclear"],
}

TICKER_MAP = {
    "apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL", "alphabet": "GOOGL",
    "amazon": "AMZN", "tesla": "TSLA", "nvidia": "NVDA", "meta": "META",
    "facebook": "META", "netflix": "NFLX", "amd": "AMD", "intel": "INTC",
    "ibm": "IBM", "oracle": "ORCL", "salesforce": "CRM", "adobe": "ADBE",
    "broadcom": "AVGO", "qualcomm": "QCOM", "cisco": "CSCO", "uber": "UBER",
    "airbnb": "ABNB", "shopify": "SHOP", "palantir": "PLTR", "snowflake": "SNOW",
    "crowdstrike": "CRWD", "paypal": "PYPL", "block": "SQ", "spotify": "SPOT",
    "zoom": "ZM", "cloudflare": "NET", "palo alto": "PANW", "fortinet": "FTNT",
    "jpmorgan": "JPM", "goldman sachs": "GS", "goldman": "GS", "morgan stanley": "MS",
    "bank of america": "BAC", "wells fargo": "WFC", "citigroup": "C", "citi": "C",
    "visa": "V", "mastercard": "MA", "american express": "AXP", "blackrock": "BLK",
    "schwab": "SCHW", "pfizer": "PFE", "johnson & johnson": "JNJ", "j&j": "JNJ",
    "moderna": "MRNA", "abbott": "ABT", "merck": "MRK", "eli lilly": "LLY",
    "lilly": "LLY", "unitedhealth": "UNH", "novo nordisk": "NVO", "regeneron": "REGN",
    "exxon": "XOM", "exxon mobil": "XOM", "chevron": "CVX", "conocophillips": "COP",
    "ford": "F", "gm": "GM", "general motors": "GM", "rivian": "RIVN", "lucid": "LCID",
    "starbucks": "SBUX", "mcdonald": "MCD", "nike": "NKE", "walmart": "WMT",
    "costco": "COST", "target": "TGT", "home depot": "HD", "disney": "DIS",
    "comcast": "CMCSA", "at&t": "T", "att": "T", "verizon": "VZ", "t-mobile": "TMUS",
    "dell": "DELL", "hp": "HPQ", "samsung": "SSNLF", "sony": "SONY", "toyota": "TM",
    "baidu": "BIDU", "alibaba": "BABA", "jd.com": "JD", "pdd": "PDD", "pinduoduo": "PDD",
    "nio": "NIO", "xpeng": "XPEV", "li auto": "LI", "tencent": "TCEHY",
    "tsmc": "TSM", "asml": "ASML", "arm": "ARM", "micron": "MU",
    "coinbase": "COIN", "robinhood": "HOOD", "sofi": "SOFI", "roku": "ROKU",
    "gamestop": "GME", "amc": "AMC", "unity": "U", "roblox": "RBLX",
    "docusign": "DOCU", "confluent": "CFLT", "gitlab": "GTLB",
}


def classify_category(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        scores[cat] = sum(1 for kw in keywords if kw in text_lower)
    if max(scores.values()) == 0:
        return "general"
    return max(scores, key=scores.get)


def extract_tickers(text: str) -> list:
    tickers = set()
    text_lower = text.lower()
    for name, ticker in TICKER_MAP.items():
        if name in text_lower:
            tickers.add(ticker)
    direct_ticker_pattern = r'\b([A-Z]{1,5})\b'
    known_tickers = set(TICKER_MAP.values())
    for match in re.finditer(direct_ticker_pattern, text):
        t = match.group(1)
        if t in known_tickers:
            tickers.add(t)
    return list(tickers)[:5]


def analyze_sentiment(text: str) -> dict:
    text_lower = text.lower()
    bullish_words = [
        "surge", "soar", "rally", "jump", "gain", "rise", "up", "bull", "growth",
        "profit", "beat", "exceed", "outperform", "upgrade", "buy", "strong",
        "record", "breakthrough", "approval", "partnership", "expand", "boost",
        "innovative", "leading", "optimistic", "confidence", "recovery", "boom",
        "demand", "revenue increase", "higher", "positive", "favorable"
    ]
    bearish_words = [
        "crash", "plunge", "drop", "fall", "decline", "loss", "down", "bear",
        "recession", "miss", "disappoint", "underperform", "downgrade", "sell",
        "weak", "concern", "risk", "warning", "cut", "layoff", "default",
        "bankruptcy", "lawsuit", "investigation", "fraud", "slump", "tumble",
        "negative", "unfavorable", "slowdown", "inflation", "debt", "crisis"
    ]
    bull_count = sum(1 for w in bullish_words if w in text_lower)
    bear_count = sum(1 for w in bearish_words if w in text_lower)
    total = bull_count + bear_count
    if total == 0:
        return {"sentiment": "neutral", "score": 0.5, "detail": "No strong sentiment indicators detected."}
    bull_ratio = bull_count / total
    if bull_ratio > 0.6:
        return {
            "sentiment": "bullish",
            "score": 0.5 + bull_ratio * 0.4,
            "detail": f"Detected {bull_count} positive indicators vs {bear_count} negative indicators. Overall market sentiment is bullish."
        }
    elif bull_ratio < 0.4:
        return {
            "sentiment": "bearish",
            "score": 0.5 - (1 - bull_ratio) * 0.4,
            "detail": f"Detected {bull_count} positive indicators vs {bear_count} negative indicators. Overall market sentiment is bearish."
        }
    else:
        return {
            "sentiment": "neutral",
            "score": 0.5,
            "detail": f"Detected {bull_count} positive and {bear_count} negative indicators. Mixed signals."
        }


def parse_date(date_str: str) -> str:
    try:
        dt = dateparser.parse(date_str)
        return dt.isoformat()
    except Exception:
        return datetime.now().isoformat()


def clean_html(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:2000]


async def fetch_single_feed(source: str, url: str) -> list:
    articles = []
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch {source}: {e}")
        return []

    feed = feedparser.parse(resp.text)
    for entry in feed.entries[:15]:
        title = entry.get("title", "").strip()
        if not title:
            continue
        summary = clean_html(entry.get("summary", entry.get("description", "")))
        content = clean_html(entry.get("content", [{}])[0].get("value", "") if entry.get("content") else summary)
        link = entry.get("link", "")
        published = entry.get("published", entry.get("updated", ""))
        image_url = ""
        if entry.get("media_content"):
            image_url = entry["media_content"][0].get("url", "")
        elif entry.get("media_thumbnail"):
            image_url = entry["media_thumbnail"][0].get("url", "")

        full_text = f"{title} {summary} {content}"
        tickers = extract_tickers(full_text)
        category = classify_category(full_text)
        sentiment_result = analyze_sentiment(full_text)

        articles.append({
            "source": source,
            "title": title,
            "summary": summary[:500],
            "content": content[:2000],
            "link": link,
            "published_at": parse_date(published),
            "category": category,
            "tickers": tickers,
            "sentiment": sentiment_result["sentiment"],
            "sentiment_score": sentiment_result["score"],
            "sentiment_detail": sentiment_result["detail"],
            "image_url": image_url,
        })
    return articles


async def fetch_all_news() -> list:
    all_articles = []
    feeds = {**RSS_FEEDS, **FALLBACK_FEEDS}
    for source, url in feeds.items():
        articles = await fetch_single_feed(source, url)
        all_articles.extend(articles)
    all_articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    return all_articles[:100]
