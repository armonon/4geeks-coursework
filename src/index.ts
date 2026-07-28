import {
  countSeats,
  describeAdjacentSeats,
  displaySeating,
  initializeSeating,
  reserveSeat,
  ROWS,
  SEATS_PER_ROW,
  type SeatingMatrix,
} from "./cinema.js";

/**
 * Prints occupied and available totals for a seating matrix.
 */
function displaySeatCounts(seating: SeatingMatrix): void {
  const [occupied, available] = countSeats(seating);
  console.log(`Occupied seats: ${occupied}`);
  console.log(`Available seats: ${available}`);
}

/**
 * Fills every seat so the full-room behavior can be demonstrated.
 */
function fillEverySeat(seating: SeatingMatrix): void {
  for (let row = 1; row <= ROWS; row += 1) {
    for (let seat = 1; seat <= SEATS_PER_ROW; seat += 1) {
      reserveSeat(seating, row, seat);
    }
  }
}

/**
 * Fills alternating seats, leaving only scattered single seats available.
 */
function createScatteredAvailability(seating: SeatingMatrix): void {
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
}

console.log("=== CINEMA SEAT MANAGER ===\n");

console.log("--- Empty room ---");
const emptyRoom = initializeSeating();
displaySeating(emptyRoom);
displaySeatCounts(emptyRoom);
console.log(describeAdjacentSeats(emptyRoom));

console.log("\n--- Partially filled room ---");
const partialRoom = initializeSeating();
console.log(reserveSeat(partialRoom, 2, 4));
console.log(reserveSeat(partialRoom, 2, 5));
console.log(reserveSeat(partialRoom, 5, 8));
console.log(reserveSeat(partialRoom, 2, 4));
console.log(reserveSeat(partialRoom, 9, 1));
displaySeating(partialRoom);
displaySeatCounts(partialRoom);
console.log(describeAdjacentSeats(partialRoom));

console.log("\n--- Nearly full room with scattered single seats ---");
const scatteredRoom = initializeSeating();
createScatteredAvailability(scatteredRoom);
displaySeating(scatteredRoom);
displaySeatCounts(scatteredRoom);
console.log(describeAdjacentSeats(scatteredRoom));

console.log("\n--- Full room ---");
const fullRoom = initializeSeating();
fillEverySeat(fullRoom);
displaySeating(fullRoom);
displaySeatCounts(fullRoom);
console.log(describeAdjacentSeats(fullRoom));
