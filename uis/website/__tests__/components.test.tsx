import { renderToStaticMarkup } from "react-dom/server";
import { FeatureCard } from "@/components/FeatureCard";
import { Section } from "@/components/Section";

describe("website presentation components", () => {
  test("feature cards render their supplied content", () => {
    const html = renderToStaticMarkup(
      <FeatureCard title="Warehouse" description="Live stock" icon={<span>W</span>} />,
    );

    expect(html).toContain("Warehouse");
    expect(html).toContain("Live stock");
    expect(html).toContain(">W<");
  });

  test("sections preserve ids and children", () => {
    const html = renderToStaticMarkup(
      <Section id="inventory" eyebrow="Operations" title="Current stock">
        <p>Six active SKUs</p>
      </Section>,
    );

    expect(html).toContain('id="inventory"');
    expect(html).toContain("Operations");
    expect(html).toContain("Six active SKUs");
  });
});
