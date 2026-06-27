import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  try {
    const res = await fetch(`${BACKEND}/api/stock/${ticker}`, {
      cache: "no-store",
    });
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
