import { API_BASE_URL } from "@/lib/api";

/**
 * Token lifecycle for the backoffice.
 *
 * The token lives in localStorage (per AUTH-02) and is attached to every
 * protected call as `Authorization: Bearer <token>`. A 401 from any
 * protected call clears the session and sends the user to /login.
 *
 * Note the deliberate consequence of localStorage: the token is not
 * readable by Next.js middleware, which runs on the server. Route
 * protection is therefore a client-side guard (see AuthProvider), not
 * middleware — the brief calls this out explicitly.
 */

export const TOKEN_KEY = "trackflow.backoffice.token";

/** Routes reachable without a session. Everything else is guarded. */
export const PUBLIC_ROUTES = ["/login", "/register"] as const;

export interface Profile {
  id: number;
  user_id: number;
  name: string | null;
  phone: string | null;
  address: string | null;
}

export type Role = "admin" | "manager" | "user";

export interface CurrentUser {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  profile: Profile | null;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  // Guard for SSR: this module is imported by client components that
  // Next.js still renders once on the server.
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    // Private-browsing modes can throw on localStorage access.
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — the session simply will not persist */
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to do */
  }
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class UnauthorizedError extends Error {
  constructor(message = "Session expired") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Turn a FastAPI error body into one readable line. */
export async function readApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      // Pydantic 422: [{loc: [...], msg: "..."}]
      return detail
        .map((d: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(d.loc)
            ? d.loc.filter((p) => p !== "body").join(".")
            : "";
          return field ? `${field}: ${d.msg}` : String(d.msg ?? "");
        })
        .join(" · ");
    }
    return JSON.stringify(body);
  } catch {
    return `Request failed (${res.status}).`;
  }
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------

/** Called when any protected request comes back 401. Set by AuthProvider. */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/**
 * fetch() with the bearer token attached and centralised 401 handling.
 *
 * Every protected call in the backoffice goes through here, so the
 * "401 → clear session → redirect to /login" rule lives in exactly one
 * place rather than being re-implemented per call site.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    onUnauthorized?.();
    throw new UnauthorizedError(
      "Your session has expired. Please sign in again.",
    );
  }
  return res;
}

/** authFetch + JSON parsing + error-to-Error conversion. */
export async function authJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await authFetch(path, init);
  if (!res.ok) throw new Error(await readApiError(res));
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function login(email: string, password: string): Promise<string> {
  // Not authFetch: there is no token yet, and a 401 here means "bad
  // credentials", which the form shows inline rather than redirecting.
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readApiError(res));

  const data = (await res.json()) as TokenResponse;
  setToken(data.access_token);
  return data.access_token;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}

/**
 * Register, then immediately log in with the same credentials so the
 * user lands authenticated instead of on a second form.
 */
export async function register(input: RegisterInput): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name || null,
      phone: input.phone || null,
      address: input.address || null,
    }),
  });
  if (!res.ok) throw new Error(await readApiError(res));

  return login(input.email, input.password);
}

export function fetchCurrentUser(): Promise<CurrentUser> {
  return authJson<CurrentUser>("/auth/me");
}

export function updateMyProfile(patch: {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}): Promise<Profile> {
  return authJson<Profile>("/profiles/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}
