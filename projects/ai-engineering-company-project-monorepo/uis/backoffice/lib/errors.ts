/**
 * Turning a thrown value into something a person can act on.
 *
 * Before this existed, every call site rendered `err.message` directly.
 * That reads fine when the server wrote the message, and badly when it
 * came from anywhere else — the browser's `Failed to fetch`, the JSON
 * parser's `Unexpected token 'I', "Internal S"... is not valid JSON`, or
 * a stringified response body.
 *
 * The rule here: a message the API wrote for a human passes through
 * untouched; anything technical is replaced with a sentence that says
 * what happened and what to do next.
 */

/** An error carrying a message the API intended for the end user. */
export class UserFacingError extends Error {
  readonly userFacing = true;

  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/**
 * Message shapes that mean "this text was never meant for a human".
 *
 * Matching on text is unpleasant, but these strings are produced by the
 * browser and by `JSON.parse`, which give us nothing else to key on —
 * no error code, no distinct class. The list is deliberately narrow so
 * a real server message is never mistaken for one of these.
 */
const TECHNICAL_PATTERNS: readonly RegExp[] = [
  /^Failed to fetch$/i,
  /^Load failed$/i, // Safari's wording for the same thing
  /^NetworkError/i,
  /^The user aborted a request/i,
  /^Unexpected token/i,
  /is not valid JSON/i,
  /^JSON\.parse/i,
  /^Unexpected end of (JSON|input)/i,
  /^\{[\s\S]*\}$/, // a stringified response body
  /^\[object \w+\]$/,
  /^<!DOCTYPE/i,
  /^<html/i,
];

const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

const MALFORMED_RESPONSE_MESSAGE =
  "The server sent back something we couldn't read. Please try again — " +
  "if it keeps happening, contact support.";

function isNetworkFailure(message: string): boolean {
  return (
    /^Failed to fetch$/i.test(message) ||
    /^Load failed$/i.test(message) ||
    /^NetworkError/i.test(message)
  );
}

function looksTechnical(message: string): boolean {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Convert anything thrown into a sentence worth showing a user.
 *
 * `fallback` is what to say when the cause is unknown — pass something
 * specific to the operation ("We couldn't load the supplier list."), not
 * a generic apology, so the message still tells the reader where they
 * are.
 */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) return error.message;

  if (!(error instanceof Error)) return fallback;

  const message = error.message?.trim() ?? "";
  if (!message) return fallback;

  // A TypeError from fetch() is always a transport failure — the request
  // never reached the server, so the user's connection is the thing to
  // mention.
  if (error instanceof TypeError && isNetworkFailure(message)) {
    return NETWORK_MESSAGE;
  }
  if (isNetworkFailure(message)) return NETWORK_MESSAGE;

  // A parse failure means the response body was not what we expected —
  // usually an error page or a truncated payload.
  if (error instanceof SyntaxError) return MALFORMED_RESPONSE_MESSAGE;

  if (looksTechnical(message)) return fallback;

  // Anything left is a message the API wrote deliberately.
  return message;
}

/**
 * Parse a response body as JSON without letting a parse failure reach
 * the UI as `Unexpected token`.
 *
 * A 200 with an unreadable body is a server problem, not something the
 * reader can diagnose, so it becomes a plain sentence.
 */
export async function readJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new UserFacingError(MALFORMED_RESPONSE_MESSAGE);
  }
}

export { MALFORMED_RESPONSE_MESSAGE, NETWORK_MESSAGE };
