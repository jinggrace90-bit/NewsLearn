import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text") || "";
  try {
    const res = await fetch(
      `${BACKEND}/api/sentiment/analyze?text=${encodeURIComponent(text)}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
