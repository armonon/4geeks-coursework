import { activeNavigationHref } from "@/lib/navigation";

const hrefs = ["/", "/inventory", "/inventory/orders", "/suppliers"];

describe("activeNavigationHref", () => {
  it("selects only the most specific matching destination", () => {
    expect(activeNavigationHref("/inventory/orders", hrefs)).toBe(
      "/inventory/orders",
    );
  });

  it("keeps the inventory parent active for its form routes", () => {
    expect(activeNavigationHref("/inventory/inbound", hrefs)).toBe(
      "/inventory",
    );
  });

  it("does not treat the root destination as a prefix", () => {
    expect(activeNavigationHref("/suppliers", hrefs)).toBe("/suppliers");
    expect(activeNavigationHref("/", hrefs)).toBe("/");
  });
});
