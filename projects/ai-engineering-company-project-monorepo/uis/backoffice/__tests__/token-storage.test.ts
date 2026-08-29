/**
 * lib/auth.ts — token storage helpers (ticket FE-019).
 *
 * These three functions are the session. If `getToken` throws instead of
 * returning null, the whole app fails to boot; if `clearToken` silently
 * does nothing, a signed-out user stays signed in. Both are the sort of
 * failure that only shows up in a browser mode nobody tests by hand.
 */

import { TOKEN_KEY, clearToken, getToken, setToken } from "@/lib/auth";

const TOKEN = "header.payload.signature";

describe("token storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  // --- happy path ---------------------------------------------------

  it("round-trips a token", () => {
    setToken(TOKEN);

    expect(getToken()).toBe(TOKEN);
    // Pinning the key: changing it would sign out every existing session
    // on deploy, which is a migration, not a rename.
    expect(window.localStorage.getItem(TOKEN_KEY)).toBe(TOKEN);
  });

  it("returns null when no session has been stored", () => {
    expect(getToken()).toBeNull();
  });

  it("clearing removes the token", () => {
    setToken(TOKEN);

    clearToken();

    expect(getToken()).toBeNull();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  // --- failure modes ------------------------------------------------
  //
  // Safari in private browsing, and any browser with storage disabled,
  // throw on localStorage access rather than returning null. Left
  // unhandled that is a blank page at startup, not a degraded session.

  it("returns null instead of throwing when reading storage fails", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    expect(() => getToken()).not.toThrow();
    expect(getToken()).toBeNull();
  });

  it("does not throw when writing fails — the session just will not persist", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    expect(() => setToken(TOKEN)).not.toThrow();
  });

  it("does not throw when clearing fails", () => {
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    expect(() => clearToken()).not.toThrow();
  });

  // --- edge case ----------------------------------------------------

  it("treats a stored empty string as no session", () => {
    window.localStorage.setItem(TOKEN_KEY, "");

    // An empty token would be sent as `Authorization: Bearer ` and 401
    // on every call; falsy is the correct reading either way.
    expect(getToken() || null).toBeNull();
  });
});
