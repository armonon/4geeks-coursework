/**
 * Formatters and the duplicated domain tables (ticket FE-019).
 *
 * `CURRENCY_FOR_COUNTRY` and `ALLOWED_TRANSITIONS` are copies of rules
 * the backend also enforces. Duplication is a deliberate trade-off — the
 * UI has to know them to render correctly — but a copy that drifts is
 * worse than no copy, so these tests pin the values against CONTEXT.md.
 */

import {
  ALLOWED_TRANSITIONS,
  BRANCH_LABELS,
  STATUSES,
  formatDate,
} from "@/lib/incidents";
import {
  CURRENCY_FOR_COUNTRY,
  formatRate,
  humanCategory,
  type Supplier,
} from "@/lib/suppliers";

const supplier = (over: Partial<Supplier> = {}): Supplier =>
  ({
    id: 1,
    name: "MRW España",
    country: "Spain",
    categories: ["carrier_last_mile"],
    rate_per_shipment: 4.9,
    currency: "EUR",
    updated_at: "2026-01-15T09:00:00+00:00",
    status: "active",
    service_zone: null,
    contact_email: null,
    notes: null,
    ...over,
  }) as Supplier;

describe("formatRate", () => {
  // --- happy path ---------------------------------------------------

  it("formats a euro rate with its currency", () => {
    const formatted = formatRate(supplier());

    // Euro amounts render in the es-ES locale, so the decimal separator
    // is a comma ("4,90 €"). Asserting on the digits rather than the
    // punctuation keeps the test about the value, not the locale.
    expect(formatted).toMatch(/4[.,]9/);
    expect(formatted).toMatch(/€|EUR/);
  });

  it("formats a dollar rate with its currency", () => {
    const formatted = formatRate(
      supplier({ country: "USA", currency: "USD", rate_per_shipment: 7.45 }),
    );

    expect(formatted).toContain("7.45");
    expect(formatted).toMatch(/\$|USD/);
  });

  // --- failure mode -------------------------------------------------

  it("does not render NaN or undefined when the rate is missing", () => {
    // A partial payload should degrade, not print "NaN" at a supplier.
    const formatted = formatRate(
      supplier({ rate_per_shipment: undefined as unknown as number }),
    );

    expect(formatted).not.toContain("NaN");
    expect(formatted).not.toContain("undefined");
    expect(formatted).toBe("—");
  });

  it("handles a zero rate rather than treating it as absent", () => {
    // 0 is falsy in JavaScript — a `||` fallback would hide a real value.
    const formatted = formatRate(supplier({ rate_per_shipment: 0 }));

    expect(formatted).toContain("0");
  });
});

describe("CURRENCY_FOR_COUNTRY", () => {
  // --- happy path ---------------------------------------------------

  it("matches the CONTEXT rule: USA pays USD, Spain pays EUR", () => {
    expect(CURRENCY_FOR_COUNTRY.USA).toBe("USD");
    expect(CURRENCY_FOR_COUNTRY.Spain).toBe("EUR");
  });

  // --- failure mode -------------------------------------------------

  it("has no entry for a country TrackFlow does not operate in", () => {
    expect(
      (CURRENCY_FOR_COUNTRY as Record<string, string>).France,
    ).toBeUndefined();
  });
});

describe("humanCategory", () => {
  it("turns a stored key into readable words", () => {
    expect(humanCategory("carrier_last_mile")).toBe("carrier last mile");
  });

  it("leaves a key with no underscores alone", () => {
    expect(humanCategory("packaging")).toBe("packaging");
  });
});

describe("ALLOWED_TRANSITIONS", () => {
  // --- happy path ---------------------------------------------------

  it("matches the CONTEXT lifecycle exactly", () => {
    expect(ALLOWED_TRANSITIONS.open.sort()).toEqual(
      ["discarded", "in_progress"].sort(),
    );
    expect(ALLOWED_TRANSITIONS.in_progress.sort()).toEqual(
      ["discarded", "resolved"].sort(),
    );
  });

  it("treats resolved and discarded as final", () => {
    expect(ALLOWED_TRANSITIONS.resolved).toEqual([]);
    expect(ALLOWED_TRANSITIONS.discarded).toEqual([]);
  });

  // --- failure modes ------------------------------------------------

  it("never offers a transition back to open", () => {
    // Reopening would let a resolved incident silently re-enter the
    // queue and corrupt the summary the CEO reads.
    for (const from of STATUSES) {
      expect(ALLOWED_TRANSITIONS[from]).not.toContain("open");
    }
  });

  it("offers no transition that loops back to itself", () => {
    for (const from of STATUSES) {
      expect(ALLOWED_TRANSITIONS[from]).not.toContain(from);
    }
  });

  it("covers every status, so the UI cannot hit an undefined lookup", () => {
    for (const status of STATUSES) {
      expect(Array.isArray(ALLOWED_TRANSITIONS[status])).toBe(true);
    }
  });
});

describe("BRANCH_LABELS", () => {
  it("uses the display names CONTEXT specifies, not invented ones", () => {
    expect(BRANCH_LABELS.la_office).toBe("Los Angeles — Office");
    expect(BRANCH_LABELS.zaragoza_warehouse).toBe("Zaragoza — Warehouse");
    expect(BRANCH_LABELS.central).toBe("Central");
  });
});

describe("formatDate", () => {
  // --- happy path ---------------------------------------------------

  it("renders an ISO timestamp as something readable", () => {
    const formatted = formatDate("2026-01-15T09:00:00+00:00");

    expect(formatted).not.toBe("");
    expect(formatted).toContain("2026");
  });

  // --- failure mode -------------------------------------------------

  it("does not render 'Invalid Date' for unusable input", () => {
    for (const bad of ["", "not-a-date", "2026-13-45"]) {
      expect(formatDate(bad)).not.toContain("Invalid Date");
      expect(formatDate(bad)).toBe("—");
    }
  });
});
