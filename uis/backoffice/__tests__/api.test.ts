import { resolveApiBaseUrl } from "@/lib/api";

describe("resolveApiBaseUrl", () => {
  it("uses the same-origin proxy when no public override exists", () => {
    expect(resolveApiBaseUrl()).toBe("/trackflow-api");
    expect(resolveApiBaseUrl("   ")).toBe("/trackflow-api");
  });

  it("normalizes an explicit deployed API origin", () => {
    expect(resolveApiBaseUrl("https://api.trackflow.example/")).toBe(
      "https://api.trackflow.example",
    );
  });
});
