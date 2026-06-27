import aiosqlite
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "newslearn.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    link TEXT,
    published_at TEXT,
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    category TEXT DEFAULT 'general',
    tickers TEXT DEFAULT '[]',
    sentiment TEXT DEFAULT 'neutral',
    sentiment_score REAL DEFAULT 0.5,
    sentiment_detail TEXT,
    image_url TEXT,
    UNIQUE(link)
);

CREATE TABLE IF NOT EXISTS stock_cache (
    ticker TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL UNIQUE,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    question TEXT NOT NULL,
    question_type TEXT NOT NULL,
    options TEXT,
    correct_answer INTEGER,
    explanation TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES news_articles(id)
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_tickers ON news_articles(tickers);
"""


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    db = await aiosqlite.connect(DB_PATH)
    await db.executescript(SCHEMA)
    await db.commit()
    await db.close()


async def insert_article(article: dict):
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR IGNORE INTO news_articles
            (source, title, summary, content, link, published_at, category, tickers, sentiment, sentiment_score, sentiment_detail, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                article.get("source", ""),
                article.get("title", ""),
                article.get("summary", ""),
                article.get("content", ""),
                article.get("link", ""),
                article.get("published_at", ""),
                article.get("category", "general"),
                json.dumps(article.get("tickers", [])),
                article.get("sentiment", "neutral"),
                article.get("sentiment_score", 0.5),
                article.get("sentiment_detail", ""),
                article.get("image_url", ""),
            ),
        )
        await db.commit()
    finally:
        await db.close()


async def get_articles(category: str = None, limit: int = 50):
    db = await get_db()
    try:
        if category and category != "all":
            cursor = await db.execute(
                "SELECT * FROM news_articles WHERE category = ? ORDER BY published_at DESC LIMIT ?",
                (category, limit),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM news_articles ORDER BY published_at DESC LIMIT ?",
                (limit,),
            )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def get_article_by_id(article_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM news_articles WHERE id = ?", (article_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_stock_cache(ticker: str):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM stock_cache WHERE ticker = ?", (ticker.upper(),)
        )
        row = await cursor.fetchone()
        if row:
            updated = datetime.fromisoformat(row["updated_at"])
            if (datetime.now() - updated).seconds < 300:
                return json.loads(row["data"])
        return None
    finally:
        await db.close()


async def set_stock_cache(ticker: str, data: dict):
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR REPLACE INTO stock_cache (ticker, data, updated_at)
            VALUES (?, ?, ?)""",
            (ticker.upper(), json.dumps(data), datetime.now().isoformat()),
        )
        await db.commit()
    finally:
        await db.close()


async def get_watchlist():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT ticker FROM watchlist ORDER BY added_at DESC")
        rows = await cursor.fetchall()
        return [r["ticker"] for r in rows]
    finally:
        await db.close()


async def add_to_watchlist(ticker: str):
    db = await get_db()
    try:
        await db.execute(
            "INSERT OR IGNORE INTO watchlist (ticker) VALUES (?)",
            (ticker.upper(),),
        )
        await db.commit()
    finally:
        await db.close()


async def remove_from_watchlist(ticker: str):
    db = await get_db()
    try:
        await db.execute("DELETE FROM watchlist WHERE ticker = ?", (ticker.upper(),))
        await db.commit()
    finally:
        await db.close()


async def get_quiz_for_article(article_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM quiz_questions WHERE article_id = ? ORDER BY id",
            (article_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def insert_quiz_questions(questions: list):
    db = await get_db()
    try:
        for q in questions:
            await db.execute(
                """INSERT INTO quiz_questions
                (article_id, question, question_type, options, correct_answer, explanation)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    q.get("article_id"),
                    q["question"],
                    q["question_type"],
                    json.dumps(q.get("options", [])),
                    q.get("correct_answer"),
                    q.get("explanation", ""),
                ),
            )
        await db.commit()
    finally:
        await db.close()
