import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/watchlist`, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: `Cannot reach backend: ${msg}` }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const { ticker } = await request.json();
  try {
    const res = await fetch(`${BACKEND}/api/watchlist/${ticker}`, {
      method: "POST",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { ticker } = await request.json();
  try {
    const res = await fetch(`${BACKEND}/api/watchlist/${ticker}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
