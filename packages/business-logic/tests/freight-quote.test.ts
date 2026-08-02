import { test } from "node:test";
import assert from "node:assert/strict";

import {
  quoteShipment,
  currencyForCountry,
  isPriorityEligible,
} from "../src/index.js";

test("currency by country matches CONTEXT.md", () => {
  assert.equal(currencyForCountry("MX"), "MXN");
  assert.equal(currencyForCountry("ES"), "EUR");
});

test("priority eligibility only for MX metro→metro", () => {
  assert.equal(
    isPriorityEligible({ country: "MX", originZone: "metro", destinationZone: "metro" }),
    true,
  );
  assert.equal(
    isPriorityEligible({ country: "MX", originZone: "metro", destinationZone: "regional" }),
    false,
  );
  assert.equal(
    isPriorityEligible({ country: "ES", originZone: "metro", destinationZone: "metro" }),
    false,
  );
});

test("priority tier outside eligibility throws", () => {
  assert.throws(
    () =>
      quoteShipment({
        country: "ES",
        originZone: "metro",
        destinationZone: "metro",
        serviceTier: "priority",
        distanceKm: 10,
        weightKg: 2,
      }),
    /priority/,
  );
});

test("weight and distance must be > 0", () => {
  assert.throws(() =>
    quoteShipment({
      country: "MX",
      originZone: "metro",
      destinationZone: "metro",
      serviceTier: "standard",
      distanceKm: 10,
      weightKg: 0,
    }),
  );
  assert.throws(() =>
    quoteShipment({
      country: "MX",
      originZone: "metro",
      destinationZone: "metro",
      serviceTier: "standard",
      distanceKm: 0,
      weightKg: 2,
    }),
  );
});

test("quote is deterministic and rounded to 2 decimals", () => {
  const input = {
    country: "ES" as const,
    originZone: "regional" as const,
    destinationZone: "metro" as const,
    serviceTier: "express" as const,
    distanceKm: 42,
    weightKg: 3.5,
  };
  const a = quoteShipment(input);
  const b = quoteShipment(input);

  assert.deepEqual(a, b);
  assert.equal(a.currency, "EUR");
  assert.equal(a.serviceTier, "express");
  // rounding: no more than 2 decimals in totalPrice
  assert.equal(a.totalPrice, Number(a.totalPrice.toFixed(2)));
  assert.ok(a.totalPrice > 0);
});
