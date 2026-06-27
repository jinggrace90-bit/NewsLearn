from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
from datetime import datetime

from database import init_db, get_db, insert_article, get_articles, get_article_by_id
from database import get_stock_cache, set_stock_cache, get_watchlist, add_to_watchlist, remove_from_watchlist
from database import get_quiz_for_article, insert_quiz_questions
from news_fetcher import fetch_all_news, analyze_sentiment, extract_tickers, classify_category
from stock_api import get_stock_quote, search_ticker, get_multiple_quotes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    asyncio.create_task(periodic_news_fetch())
    yield


app = FastAPI(title="UpdateULvl API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def periodic_news_fetch():
    while True:
        try:
            print("[Scheduler] Fetching news...")
            articles = await fetch_all_news()
            for article in articles:
                await insert_article(article)
            print(f"[Scheduler] Fetched {len(articles)} articles")
        except Exception as e:
            print(f"[Scheduler] Error: {e}")
        await asyncio.sleep(300)


@app.get("/api/news")
async def api_get_news(
    category: str = Query("all", pattern="^(all|tech|finance|health|energy|general)$"),
    limit: int = Query(50, ge=1, le=100),
):
    articles = await get_articles(category=category, limit=limit)
    for a in articles:
        if isinstance(a.get("tickers"), str):
            try:
                a["tickers"] = json.loads(a["tickers"])
            except Exception:
                a["tickers"] = []
    return {"articles": articles, "count": len(articles)}


@app.get("/api/news/{article_id}")
async def api_get_article(article_id: int):
    article = await get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if isinstance(article.get("tickers"), str):
        try:
            article["tickers"] = json.loads(article["tickers"])
        except Exception:
            article["tickers"] = []
    return article


@app.post("/api/news/refresh")
async def api_refresh_news():
    articles = await fetch_all_news()
    for article in articles:
        await insert_article(article)
    return {"fetched": len(articles), "message": "News refreshed successfully"}


@app.get("/api/stock/{ticker}")
async def api_get_stock(ticker: str):
    cached = await get_stock_cache(ticker.upper())
    if cached:
        return cached
    quote = await get_stock_quote(ticker.upper())
    if "error" not in quote:
        await set_stock_cache(ticker.upper(), quote)
    return quote


@app.get("/api/stock/search/{query}")
async def api_search_stock(query: str):
    results = await search_ticker(query)
    return {"results": results}


@app.get("/api/stock/multi")
async def api_multi_stock(tickers: str = Query(...)):
    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    results = await get_multiple_quotes(ticker_list)
    return {"stocks": results}


@app.get("/api/sentiment/analyze")
async def api_analyze_sentiment(text: str = Query(...)):
    result = analyze_sentiment(text)
    tickers = extract_tickers(text)
    return {**result, "tickers": tickers}


@app.get("/api/tickers/extract")
async def api_extract_tickers(text: str = Query(...)):
    tickers = extract_tickers(text)
    return {"tickers": tickers}


@app.get("/api/watchlist")
async def api_get_watchlist():
    tickers = await get_watchlist()
    if not tickers:
        tickers = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMZN"]
    stocks = await get_multiple_quotes(tickers)
    return {"tickers": tickers, "stocks": stocks}


@app.post("/api/watchlist/{ticker}")
async def api_add_watchlist(ticker: str):
    await add_to_watchlist(ticker.upper())
    return {"message": f"{ticker.upper()} added to watchlist"}


@app.delete("/api/watchlist/{ticker}")
async def api_remove_watchlist(ticker: str):
    await remove_from_watchlist(ticker.upper())
    return {"message": f"{ticker.upper()} removed from watchlist"}


@app.get("/api/quiz/{article_id}")
async def api_get_quiz(article_id: int):
    questions = await get_quiz_for_article(article_id)
    if questions:
        for q in questions:
            if isinstance(q.get("options"), str):
                try:
                    q["options"] = json.loads(q["options"])
                except Exception:
                    q["options"] = []
        return {"questions": questions}
    article = await get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    questions = generate_quiz_from_article(article)
    for q in questions:
        q["article_id"] = article_id
    await insert_quiz_questions(questions)
    for q in questions:
        if isinstance(q.get("options"), str):
            try:
                q["options"] = json.loads(q["options"])
            except Exception:
                q["options"] = []
    return {"questions": questions}


def generate_quiz_from_article(article: dict) -> list:
    title = article.get("title", "")
    summary = article.get("summary", "")
    content = article.get("content", "")
    tickers = article.get("tickers", [])
    if isinstance(tickers, str):
        try:
            tickers = json.loads(tickers)
        except Exception:
            tickers = []
    sentiment = article.get("sentiment", "neutral")

    questions = []

    questions.append({
        "question": f"Based on the news headline, what is the main topic?",
        "question_type": "mc",
        "options": [
            f"The article is primarily about {title[:50]}",
            "The article discusses unrelated market events",
            "The article is about personal finance tips",
            "The article covers sports news",
        ],
        "correct_answer": 0,
        "explanation": f"The headline clearly states: {title}",
    })

    if tickers:
        main_ticker = tickers[0]
        questions.append({
            "question": f"Which company is most directly affected by this news?",
            "question_type": "mc",
            "options": [
                f"{main_ticker}",
                "A company not mentioned in the article",
                "The Federal Reserve",
                "A foreign government",
            ],
            "correct_answer": 0,
            "explanation": f"The article mentions {main_ticker} as a key company.",
        })

    questions.append({
        "question": f"What is the overall sentiment of this news?",
        "question_type": "mc",
        "options": [
            "Bullish (positive for stocks)",
            "Bearish (negative for stocks)",
            "Neutral (no clear impact)",
            "Cannot be determined",
        ],
        "correct_answer": {"bullish": 0, "bearish": 1, "neutral": 2}.get(sentiment, 2),
        "explanation": f"Sentiment analysis detected: {sentiment}",
    })

    questions.append({
        "question": "Analyze the potential impact of this news on the market. Consider which sectors might be affected and why. (Open-ended)",
        "question_type": "open",
        "options": [],
        "correct_answer": None,
        "explanation": "Think about direct and indirect effects on the market.",
    })

    questions.append({
        "question": "If you were an investment analyst, what recommendation would you give based on this news? Justify your reasoning. (Open-ended)",
        "question_type": "open",
        "options": [],
        "correct_answer": None,
        "explanation": "Consider the risk-reward ratio and market context.",
    })

    return questions


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
