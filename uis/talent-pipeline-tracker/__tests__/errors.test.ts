import {
  MALFORMED_RESPONSE_MESSAGE,
  NETWORK_MESSAGE,
  UserFacingError,
  readJson,
  toUserMessage,
} from "@/lib/errors";

describe("talent tracker error handling", () => {
  test("replaces browser network errors with an actionable message", () => {
    expect(toUserMessage(new TypeError("Failed to fetch"), "fallback")).toBe(
      NETWORK_MESSAGE,
    );
  });

  test("preserves deliberate API messages", () => {
    expect(toUserMessage(new Error("Candidate was not found"), "fallback")).toBe(
      "Candidate was not found",
    );
  });

  test("turns malformed JSON into a user-facing error", async () => {
    const response = new Response("<html>not JSON</html>");

    await expect(readJson(response)).rejects.toEqual(
      new UserFacingError(MALFORMED_RESPONSE_MESSAGE),
    );
  });
});
