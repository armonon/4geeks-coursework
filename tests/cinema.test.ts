import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countSeats,
  findAdjacentSeats,
  formatSeatingChart,
  initializeSeating,
  reserveSeat,
  ROWS,
  SEATS_PER_ROW,
} from "../src/cinema.js";

describe("initializeSeating", () => {
  it("creates an empty 8 x 10 matrix", () => {
    const seating = initializeSeating();

    assert.equal(seating.length, ROWS);
    assert.equal(seating[0]?.length, SEATS_PER_ROW);
    assert.deepEqual(countSeats(seating), [0, 80]);
  });
});

describe("reserveSeat", () => {
  it("reserves an available seat", () => {
    const seating = initializeSeating();

    assert.equal(
      reserveSeat(seating, 3, 7),
      "Reservation confirmed: Row 3, Seat 7.",
    );
    assert.equal(seating[2]?.[6], 1);
  });

  it("rejects a seat that is already occupied", () => {
    const seating = initializeSeating();
    reserveSeat(seating, 3, 7);

    assert.equal(
      reserveSeat(seating, 3, 7),
      "Reservation failed: Row 3, Seat 7 is already taken.",
    );
    assert.deepEqual(countSeats(seating), [1, 79]);
  });

  it("rejects row and seat numbers outside the room", () => {
    const seating = initializeSeating();

    assert.match(reserveSeat(seating, 0, 1), /Reservation failed/);
    assert.match(reserveSeat(seating, 1, 11), /Reservation failed/);
    assert.deepEqual(countSeats(seating), [0, 80]);
  });
});

describe("formatSeatingChart", () => {
  it("shows labels and the correct symbols", () => {
    const seating = initializeSeating();
    reserveSeat(seating, 1, 1);
    const chart = formatSeatingChart(seating);

    assert.match(chart, /SCREEN/);
    assert.match(chart, /Row  1  X  L/);
    assert.match(chart, /Legend: L = available \| X = occupied/);
  });
});

describe("findAdjacentSeats", () => {
  it("returns the first pair in an empty room", () => {
    const seating = initializeSeating();

    assert.deepEqual(findAdjacentSeats(seating), [
      [1, 1],
      [1, 2],
    ]);
  });

  it("returns the first pair in a partially filled room", () => {
    const seating = initializeSeating();
    reserveSeat(seating, 1, 1);
    reserveSeat(seating, 1, 2);

    assert.deepEqual(findAdjacentSeats(seating), [
      [1, 3],
      [1, 4],
    ]);
  });

  it("returns null when only scattered single seats remain", () => {
    const seating = initializeSeating();

    for (let row = 0; row < seating.length; row += 1) {
      const currentRow = seating[row];

      if (currentRow === undefined) {
        continue;
      }

      for (let seat = 0; seat < currentRow.length; seat += 1) {
        currentRow[seat] = 1;
      }

      const availableSeat = (row * 3) % SEATS_PER_ROW;
      currentRow[availableSeat] = 0;
    }

    assert.equal(findAdjacentSeats(seating), null);
    assert.deepEqual(countSeats(seating), [72, 8]);
  });

  it("returns null for a full room", () => {
    const seating = initializeSeating();

    for (let row = 1; row <= ROWS; row += 1) {
      for (let seat = 1; seat <= SEATS_PER_ROW; seat += 1) {
        reserveSeat(seating, row, seat);
      }
    }

    assert.equal(findAdjacentSeats(seating), null);
    assert.deepEqual(countSeats(seating), [80, 0]);
  });
});
