import { NextResponse } from "next/server";
import feedparser from "feedparser";

const RSS_URL = "https://feeds.bbci.co.uk/news/rss.xml";

interface Article {
  title: string;
  link: string;
  content: string;
  pubDate: string;
}

export async function GET() {
  try {
    const response = await fetch(RSS_URL);
    const xml = await response.text();

    const parser = new feedparser();
    const articles: Article[] = [];

    parser.on("readable", function () {
      let item;
      while ((item = this.read())) {
        articles.push({
          title: item.title || "No title",
          link: item.link || "",
          content: item.summary || item.description || "",
          pubDate: item.pubdate
            ? new Date(item.pubdate).toISOString()
            : new Date().toISOString(),
        });
      }
    });

    await new Promise<void>((resolve, reject) => {
      parser.on("end", resolve);
      parser.on("error", reject);
      parser.write(xml);
      parser.end();
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching RSS:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}