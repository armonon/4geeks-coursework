"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

type Metrics = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  model: string;
  responseTime: number;
  tokensPerSecond: number;
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    total_time?: number;
    completion_time?: number;
  };
  error?: { message?: string };
};

const MESSAGES_KEY = "talk-to-the-machine:messages";
const METRICS_KEY = "talk-to-the-machine:metrics";
const MODEL = "llama-3.1-8b-instant";

const EMPTY_METRICS: Metrics = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requestCount: 0,
  model: MODEL,
  responseTime: 0,
  tokensPerSecond: 0,
};

const STARTERS = [
  "Explain quantum computing simply",
  "Give me three creative project ideas",
  "Write a friendly meeting follow-up",
];

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(safeLoad<Message[]>(MESSAGES_KEY, []));
    setMetrics(safeLoad<Metrics>(METRICS_KEY, EMPTY_METRICS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  }, [metrics, hydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const conversation = [...messages, userMessage];

    setMessages(conversation);
    setInput("");
    setError("");
    setLoading(true);
    const requestStarted = performance.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
      });

      const data = (await response.json()) as GroqResponse;
      if (!response.ok) {
        throw new Error(data.error?.message || `Chat request failed (${response.status}).`);
      }

      const assistantContent = data.choices?.[0]?.message?.content;
      if (!assistantContent) throw new Error("Groq returned an empty response. Please try again.");

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantContent,
          createdAt: new Date().toISOString(),
        },
      ]);

      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? promptTokens + completionTokens;
      const responseTime =
        data.usage?.total_time ?? (performance.now() - requestStarted) / 1000;
      const completionTime = data.usage?.completion_time ?? responseTime;

      setMetrics((current) => ({
        promptTokens: current.promptTokens + promptTokens,
        completionTokens: current.completionTokens + completionTokens,
        totalTokens: current.totalTokens + totalTokens,
        requestCount: current.requestCount + 1,
        model: data.model ?? MODEL,
        responseTime,
        tokensPerSecond: completionTime > 0 ? completionTokens / completionTime : 0,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  function clearConversation() {
    setMessages([]);
    setMetrics(EMPTY_METRICS);
    setInput("");
    setError("");
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(METRICS_KEY);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Talk to the Machine home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>Talk to the Machine</strong>
            <small>Powered by Groq + Llama</small>
          </span>
        </a>
        <div className="status">
          <span className="status-dot" />
          System online
        </div>
      </header>

      <div className="workspace">
        <section className="chat-panel" aria-label="AI conversation">
          <div className="chat-heading">
            <div>
              <p className="eyebrow">AI workspace</p>
              <h1>Your thinking partner</h1>
            </div>
            <button
              className="clear-button"
              onClick={clearConversation}
              disabled={!messages.length && !metrics.totalTokens}
              type="button"
            >
              <span aria-hidden="true">↻</span> Clear conversation
            </button>
          </div>

          <div className="message-list" aria-live="polite">
            {!messages.length ? (
              <div className="empty-state">
                <div className="orb" aria-hidden="true">
                  <span>✦</span>
                </div>
                <p className="eyebrow">Fast, open intelligence</p>
                <h2>What can I help you explore?</h2>
                <p className="empty-copy">
                  Start a conversation and watch your session metrics update in real time.
                </p>
                <div className="starters">
                  {STARTERS.map((starter) => (
                    <button key={starter} onClick={() => void sendMessage(starter)} type="button">
                      {starter} <span>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="avatar" aria-hidden="true">
                    {message.role === "user" ? "You" : "✦"}
                  </div>
                  <div className="message-body">
                    <div className="message-meta">
                      <strong>{message.role === "user" ? "You" : "Llama"}</strong>
                      <time>{formatTime(message.createdAt)}</time>
                    </div>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))
            )}
            {loading && (
              <article className="message assistant">
                <div className="avatar">✦</div>
                <div className="message-body thinking">
                  <span />
                  <span />
                  <span />
                  <em>Llama is thinking</em>
                </div>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="composer-wrap">
            {error && (
              <div className="error" role="alert">
                <span>!</span>
                <p>{error}</p>
                <button onClick={() => setError("")} aria-label="Dismiss error" type="button">
                  ×
                </button>
              </div>
            )}
            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                aria-label="Message Llama"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                disabled={loading}
              />
              <button
                className="send-button"
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
              >
                ↑
              </button>
            </form>
            <p className="composer-note">Press Enter to send · Shift + Enter for a new line</p>
          </div>
        </section>

        <aside className="metrics-panel" aria-label="Session metrics">
          <div className="metrics-heading">
            <p className="eyebrow">Live telemetry</p>
            <h2>Session metrics</h2>
            <p>Usage across this conversation</p>
          </div>

          <section className="total-card">
            <span>Total tokens</span>
            <strong>{metrics.totalTokens.toLocaleString()}</strong>
            <small>{metrics.requestCount} completed {metrics.requestCount === 1 ? "request" : "requests"}</small>
            <div className="token-bar">
              <span
                style={{
                  width: metrics.totalTokens
                    ? `${(metrics.promptTokens / metrics.totalTokens) * 100}%`
                    : "50%",
                }}
              />
            </div>
            <div className="legend">
              <span><i className="prompt-dot" /> Prompt</span>
              <span><i className="completion-dot" /> Completion</span>
            </div>
          </section>

          <div className="metric-grid">
            <section>
              <span>Prompt tokens</span>
              <strong>{metrics.promptTokens.toLocaleString()}</strong>
              <small>Input to model</small>
            </section>
            <section>
              <span>Completion</span>
              <strong>{metrics.completionTokens.toLocaleString()}</strong>
              <small>Model output</small>
            </section>
            <section>
              <span>Response time</span>
              <strong>{metrics.responseTime ? `${metrics.responseTime.toFixed(2)}s` : "—"}</strong>
              <small>Latest request</small>
            </section>
            <section>
              <span>Token speed</span>
              <strong>{metrics.tokensPerSecond ? `${Math.round(metrics.tokensPerSecond)}` : "—"}</strong>
              <small>Tokens / second</small>
            </section>
          </div>

          <section className="model-card">
            <div className="model-icon">M</div>
            <div>
              <span>Active model</span>
              <strong>{metrics.model}</strong>
              <small><i /> Connected via Groq</small>
            </div>
          </section>

          <p className="persistence-note">
            <span>⌁</span>
            Conversation and metrics are saved in this browser.
          </p>
        </aside>
      </div>
    </main>
  );
}
