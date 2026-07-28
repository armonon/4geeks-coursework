# Cinema Seat Manager

A command-line TypeScript prototype for a small cinema screening room with 8
rows and 10 seats per row.

The program represents the room with a two-dimensional array only:

- `0` means the seat is available.
- `1` means the seat is occupied.
- `L` is printed for an available seat.
- `X` is printed for an occupied seat.

No objects or classes are used to represent seating data.

## Features

- Initializes an empty 8 × 10 seating matrix.
- Displays a labeled seat map with row and seat numbers.
- Reserves a seat using 1-based row and seat numbers.
- Rejects invalid positions and seats that are already occupied.
- Counts occupied and available seats.
- Finds the first two horizontally adjacent available seats.
- Clearly reports when no adjacent pair is available.
- Demonstrates empty, partially filled, scattered, and full rooms.
- Includes automated tests for the required scenarios.

## Requirements

- Node.js 20 or newer
- npm

## Install and Run

```bash
npm install
npm start
```

The demo prints all four required scenarios and messages for successful,
duplicate, and invalid reservations.

## Test

```bash
npm test
```

To compile the TypeScript and run every test:

```bash
npm run check
```

Compiled JavaScript is written to `dist/`.

## Staff-Facing Coordinates

Rows and seats are numbered starting at 1. For example:

```ts
reserveSeat(seating, 2, 4);
```

This reserves Row 2, Seat 4. The program converts those staff-friendly numbers
to the matrix's zero-based array indexes internally.

## Main Functions

The core logic is in `src/cinema.ts`:

- `initializeSeating()` creates the empty room.
- `formatSeatingChart()` creates the printable seat map.
- `displaySeating()` prints the map.
- `reserveSeat()` validates and reserves a seat.
- `countSeats()` returns `[occupied, available]`.
- `findAdjacentSeats()` returns the first adjacent pair or `null`.
- `describeAdjacentSeats()` returns a clear search-result message.

An adjacent result uses arrays only:

```text
[[row, first seat], [row, second seat]]
```

## Example Seat Map

```text
SCREEN

        1  2  3  4  5  6  7  8  9 10
Row  1  L  L  L  L  L  L  L  L  L  L
Row  2  L  L  L  X  X  L  L  L  L  L
Row  3  L  L  L  L  L  L  L  L  L  L

Legend: L = available | X = occupied
```

## Project Structure

```text
cinema-seat-manager/
├── src/
│   ├── cinema.ts       # Seat matrix and reservation functions
│   └── index.ts        # Command-line demonstrations
├── tests/
│   └── cinema.test.ts  # Automated scenario tests
├── package.json
├── tsconfig.json
└── README.md
```
