export type Seat = 0 | 1;
export type SeatingMatrix = Seat[][];
export type SeatPosition = [number, number];
export type SeatPair = [SeatPosition, SeatPosition];
export type SeatCounts = [number, number];

export const ROWS = 8;
export const SEATS_PER_ROW = 10;

/**
 * Creates an 8 x 10 seating matrix.
 * A value of 0 means available and a value of 1 means occupied.
 */
export function initializeSeating(): SeatingMatrix {
  const seating: SeatingMatrix = [];

  for (let row = 0; row < ROWS; row += 1) {
    const currentRow: Seat[] = [];

    for (let column = 0; column < SEATS_PER_ROW; column += 1) {
      currentRow.push(0);
    }

    seating.push(currentRow);
  }

  return seating;
}

/**
 * Converts the seating matrix into a staff-friendly chart.
 * Row and seat labels are 1-based, X is occupied, and L is available.
 */
export function formatSeatingChart(seating: SeatingMatrix): string {
  let chart = "SCREEN\n\n";
  chart += "       ";

  for (let column = 1; column <= SEATS_PER_ROW; column += 1) {
    chart += `${String(column).padStart(2, " ")} `;
  }

  chart = chart.trimEnd();
  chart += "\n";

  for (let row = 0; row < seating.length; row += 1) {
    chart += `Row ${String(row + 1).padStart(2, " ")} `;
    const currentRow = seating[row];

    if (currentRow === undefined) {
      continue;
    }

    for (let column = 0; column < currentRow.length; column += 1) {
      const symbol = currentRow[column] === 1 ? "X" : "L";
      chart += `${symbol.padStart(2, " ")} `;
    }

    chart = chart.trimEnd();
    chart += "\n";
  }

  chart += "\nLegend: L = available | X = occupied";
  return chart;
}

/**
 * Prints the current state of the screening room to the console.
 */
export function displaySeating(seating: SeatingMatrix): void {
  console.log(formatSeatingChart(seating));
}

/**
 * Reserves a seat using 1-based row and seat numbers.
 * Returns a clear success or failure message without changing invalid seats.
 */
export function reserveSeat(
  seating: SeatingMatrix,
  rowNumber: number,
  seatNumber: number,
): string {
  if (
    !Number.isInteger(rowNumber) ||
    !Number.isInteger(seatNumber) ||
    rowNumber < 1 ||
    rowNumber > ROWS ||
    seatNumber < 1 ||
    seatNumber > SEATS_PER_ROW
  ) {
    return `Reservation failed: row must be 1-${ROWS} and seat must be 1-${SEATS_PER_ROW}.`;
  }

  const row = seating[rowNumber - 1];

  if (row === undefined) {
    return "Reservation failed: the selected row does not exist.";
  }

  if (row[seatNumber - 1] === 1) {
    return `Reservation failed: Row ${rowNumber}, Seat ${seatNumber} is already taken.`;
  }

  row[seatNumber - 1] = 1;
  return `Reservation confirmed: Row ${rowNumber}, Seat ${seatNumber}.`;
}

/**
 * Counts every seat in the room.
 * Returns [occupied seats, available seats].
 */
export function countSeats(seating: SeatingMatrix): SeatCounts {
  let occupied = 0;
  let available = 0;

  for (let row = 0; row < seating.length; row += 1) {
    const currentRow = seating[row];

    if (currentRow === undefined) {
      continue;
    }

    for (let column = 0; column < currentRow.length; column += 1) {
      if (currentRow[column] === 1) {
        occupied += 1;
      } else {
        available += 1;
      }
    }
  }

  return [occupied, available];
}

/**
 * Finds the first pair of horizontally adjacent available seats.
 * Returns [[row, seat], [row, seat]] or null when no pair is available.
 */
export function findAdjacentSeats(seating: SeatingMatrix): SeatPair | null {
  for (let row = 0; row < seating.length; row += 1) {
    const currentRow = seating[row];

    if (currentRow === undefined) {
      continue;
    }

    for (let column = 0; column < currentRow.length - 1; column += 1) {
      if (currentRow[column] === 0 && currentRow[column + 1] === 0) {
        return [
          [row + 1, column + 1],
          [row + 1, column + 2],
        ];
      }
    }
  }

  return null;
}

/**
 * Creates a readable message describing the adjacent-seat search result.
 */
export function describeAdjacentSeats(seating: SeatingMatrix): string {
  const pair = findAdjacentSeats(seating);

  if (pair === null) {
    return "No two adjacent seats are available.";
  }

  return `Adjacent seats found: Row ${pair[0][0]}, Seats ${pair[0][1]} and ${pair[1][1]}.`;
}
