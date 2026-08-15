import {
  NETWORK_MESSAGE,
  UserFacingError,
  toUserMessage,
} from "@/lib/errors";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://playground.4geeks.com/tracker/api/v1";

/**
 * Shown when the response carries nothing a person can act on. The
 * status code is deliberately absent — "Request failed (500)" gives the
 * reader no way forward.
 */
const GENERIC_REQUEST_FAILURE =
  "That request didn't go through. Please try again — if it keeps " +
  "happening, contact support.";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    // fetch() rejects only when the request never reached the server.
    // Left alone this surfaced as the browser's raw "Failed to fetch".
    throw new UserFacingError(toUserMessage(err, NETWORK_MESSAGE));
  }

  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (body && typeof body === "object" && "detail" in body
        ? formatDetail((body as { detail: unknown }).detail)
        : null) ?? GENERIC_REQUEST_FAILURE;
    throw new ApiError(res.status, msg, body);
  }

  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (d && typeof d === "object" && "msg" in d) {
          const loc = "loc" in d && Array.isArray(d.loc) ? d.loc.join(".") : "";
          return loc ? `${loc}: ${d.msg}` : String(d.msg);
        }
        return JSON.stringify(d);
      })
      .join("; ");
  }
  return null;
}
