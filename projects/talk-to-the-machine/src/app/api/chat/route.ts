import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages?: unknown;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 20_000;

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= MAX_CONTENT_LENGTH
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "The AI service is not configured. Add GROQ_API_KEY to .env.local." } },
      { status: 503 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: { message: "The request body must be valid JSON." } },
      { status: 400 },
    );
  }

  if (
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    body.messages.length > MAX_MESSAGES ||
    !body.messages.every(isChatMessage)
  ) {
    return NextResponse.json(
      { error: { message: "Send between 1 and 100 valid chat messages." } },
      { status: 400 },
    );
  }

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages: body.messages }),
      cache: "no-store",
    });

    const data = (await groqResponse.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;

    if (!groqResponse.ok) {
      return NextResponse.json(
        { error: { message: data?.error?.message || "Groq could not complete the request." } },
        { status: groqResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: { message: "The AI service is temporarily unreachable. Please try again." } },
      { status: 502 },
    );
  }
}
