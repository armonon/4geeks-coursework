/**
 * lib/errors.ts — the error translator (ticket FE-019).
 *
 * This function decides what a user reads when something fails. Get it
 * wrong in one direction and people see `Unexpected token 'I'`; wrong in
 * the other and a perfectly good server message gets swallowed by a
 * generic apology. Both directions are tested.
 */

import {
  MALFORMED_RESPONSE_MESSAGE,
  NETWORK_MESSAGE,
  UserFacingError,
  readJson,
  toUserMessage,
} from "@/lib/errors";

const FALLBACK = "We couldn't load the supplier list.";

describe("toUserMessage", () => {
  // --- happy path ---------------------------------------------------

  it("passes through a message the API wrote for a human", () => {
    const fromServer = new Error("Title must be 120 characters or fewer.");

    expect(toUserMessage(fromServer, FALLBACK)).toBe(
      "Title must be 120 characters or fewer.",
    );
  });

  it("prefers an explicitly user-facing error over anything else", () => {
    const explicit = new UserFacingError("Your session has expired.");

    expect(toUserMessage(explicit, FALLBACK)).toBe("Your session has expired.");
  });

  // --- failure modes ------------------------------------------------

  it("replaces the browser's transport errors with something actionable", () => {
    // What fetch() actually throws when the host is unreachable. Chrome
    // and Safari word it differently, so both are covered.
    for (const raw of ["Failed to fetch", "Load failed", "NetworkError: ..."]) {
      const message = toUserMessage(new TypeError(raw), FALLBACK);

      expect(message).toBe(NETWORK_MESSAGE);
      expect(message).not.toContain("fetch");
    }
  });

  it("replaces a JSON parse failure — the exact string from the outage", () => {
    const parseFailure = new SyntaxError(
      `Unexpected token 'I', "Internal S"... is not valid JSON`,
    );

    const message = toUserMessage(parseFailure, FALLBACK);

    expect(message).toBe(MALFORMED_RESPONSE_MESSAGE);
    expect(message).not.toContain("Unexpected token");
  });

  it("never shows a stringified response body", () => {
    const stringified = new Error(
      '{"field":"title","message":"Title is required."}',
    );

    expect(toUserMessage(stringified, FALLBACK)).toBe(FALLBACK);
  });

  it("never shows [object Object]", () => {
    expect(toUserMessage(new Error("[object Object]"), FALLBACK)).toBe(FALLBACK);
  });

  it("never shows an HTML error page", () => {
    for (const raw of ["<!DOCTYPE html><html>...", "<html><body>502"]) {
      expect(toUserMessage(new Error(raw), FALLBACK)).toBe(FALLBACK);
    }
  });

  // --- edge cases ---------------------------------------------------

  it("falls back when the thrown value is not an Error at all", () => {
    // `throw "boom"` and `throw {code: 500}` are both legal JavaScript.
    for (const thrown of ["boom", 42, null, undefined, { code: 500 }]) {
      expect(toUserMessage(thrown, FALLBACK)).toBe(FALLBACK);
    }
  });

  it("falls back on an Error with an empty or whitespace message", () => {
    expect(toUserMessage(new Error(""), FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(new Error("   "), FALLBACK)).toBe(FALLBACK);
  });

  it("does not mistake a real message that merely mentions JSON", () => {
    // The guard matches on shape, not on the word — a genuine server
    // message about a JSON field must survive.
    const real = new Error("The JSON export finished with 3 warnings.");

    expect(toUserMessage(real, FALLBACK)).toBe(
      "The JSON export finished with 3 warnings.",
    );
  });
});

describe("readJson", () => {
  const responseWith = (body: unknown) =>
    ({ json: async () => body }) as unknown as Response;

  const responseThatFailsToParse = () =>
    ({
      json: async () => {
        throw new SyntaxError("Unexpected token 'I'");
      },
    }) as unknown as Response;

  // --- happy path ---------------------------------------------------

  it("returns the parsed body", async () => {
    await expect(readJson(responseWith({ id: 7 }))).resolves.toEqual({ id: 7 });
  });

  // --- failure mode -------------------------------------------------

  it("turns a parse failure into a readable error, not Unexpected token", async () => {
    await expect(readJson(responseThatFailsToParse())).rejects.toThrow(
      UserFacingError,
    );

    await expect(readJson(responseThatFailsToParse())).rejects.toThrow(
      MALFORMED_RESPONSE_MESSAGE,
    );
  });
});
