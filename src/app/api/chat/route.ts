import { NextRequest, NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  session_id: string;       // e.g. "talent-001"
  from: "talent" | "staff";
  sender_name: string;
  text: string;
  translated?: string;
  lang: "EN" | "JP";
  timestamp: string;        // ISO
}

// ── In-memory store (demo) ───────────────────────────────────
// In production: replace with Prisma DB calls
const messages: ChatMessage[] = [];

// ── POST — save a message ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      session_id: body.session_id ?? "talent-001",
      from: body.from ?? "talent",
      sender_name: body.sender_name ?? "Unknown",
      text: body.text,
      translated: body.translated,
      lang: body.lang ?? "EN",
      timestamp: new Date().toISOString(),
    };

    if (!msg.text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    messages.push(msg);

    // Keep last 200 messages (rolling window)
    if (messages.length > 200) messages.splice(0, messages.length - 200);

    return NextResponse.json(msg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// ── GET — fetch messages (for dashboard monitor) ─────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  const since = searchParams.get("since"); // ISO timestamp for polling

  let result = [...messages];

  if (session_id) {
    result = result.filter((m) => m.session_id === session_id);
  }
  if (since) {
    const sinceTime = new Date(since).getTime();
    result = result.filter((m) => new Date(m.timestamp).getTime() > sinceTime);
  }

  return NextResponse.json({
    count: result.length,
    messages: result.slice(-50), // last 50
  });
}
