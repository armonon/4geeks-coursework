import { stockStatus } from "@/lib/inventory";

describe("stockStatus", () => {
  it("marks empty and negative computed stock as out", () => {
    expect(stockStatus(0)).toBe("out");
    expect(stockStatus(-1)).toBe("out");
  });

  it("marks one through ten units as low", () => {
    expect(stockStatus(1)).toBe("low");
    expect(stockStatus(10)).toBe("low");
  });

  it("marks stock over ten as available", () => {
    expect(stockStatus(11)).toBe("available");
  });
});
