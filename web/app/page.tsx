"use client";

import { useMemo, useState } from "react";

type Seat = 0 | 1;
type SeatingMatrix = Seat[][];
type SeatPosition = [number, number];
type SeatPair = [SeatPosition, SeatPosition];

const ROWS = 8;
const SEATS_PER_ROW = 10;
const TICKET_PRICE = 14;
const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function createEmptyMatrix(): SeatingMatrix {
  const matrix: SeatingMatrix = [];

  for (let row = 0; row < ROWS; row += 1) {
    const currentRow: Seat[] = [];

    for (let seat = 0; seat < SEATS_PER_ROW; seat += 1) {
      currentRow.push(0);
    }

    matrix.push(currentRow);
  }

  return matrix;
}

function createInitialSeating(): SeatingMatrix {
  const matrix = createEmptyMatrix();
  const occupiedSeats: SeatPosition[] = [
    [0, 2],
    [0, 3],
    [1, 6],
    [2, 1],
    [2, 7],
    [3, 4],
    [3, 5],
    [4, 0],
    [4, 8],
    [5, 2],
    [5, 3],
    [5, 7],
    [6, 5],
    [7, 1],
    [7, 8],
    [7, 9],
  ];

  for (let index = 0; index < occupiedSeats.length; index += 1) {
    const position = occupiedSeats[index];

    if (position !== undefined) {
      const row = matrix[position[0]];

      if (row !== undefined) {
        row[position[1]] = 1;
      }
    }
  }

  return matrix;
}

function countValue(matrix: SeatingMatrix, value: Seat): number {
  let total = 0;

  for (let row = 0; row < matrix.length; row += 1) {
    const currentRow = matrix[row];

    if (currentRow === undefined) {
      continue;
    }

    for (let seat = 0; seat < currentRow.length; seat += 1) {
      if (currentRow[seat] === value) {
        total += 1;
      }
    }
  }

  return total;
}

function findAdjacentSeats(seating: SeatingMatrix): SeatPair | null {
  for (let row = 0; row < seating.length; row += 1) {
    const currentRow = seating[row];

    if (currentRow === undefined) {
      continue;
    }

    for (let seat = 0; seat < currentRow.length - 1; seat += 1) {
      if (currentRow[seat] === 0 && currentRow[seat + 1] === 0) {
        return [
          [row, seat],
          [row, seat + 1],
        ];
      }
    }
  }

  return null;
}

function seatName(row: number, seat: number): string {
  return `${ROW_LABELS[row] ?? row + 1}${seat + 1}`;
}

export default function Home() {
  const [seating, setSeating] = useState<SeatingMatrix>(() =>
    createInitialSeating(),
  );
  const [selected, setSelected] = useState<SeatingMatrix>(() =>
    createEmptyMatrix(),
  );
  const [message, setMessage] = useState(
    "Choose any available seat to begin.",
  );

  const selectedNames = useMemo(() => {
    const names: string[] = [];

    for (let row = 0; row < selected.length; row += 1) {
      const currentRow = selected[row];

      if (currentRow === undefined) {
        continue;
      }

      for (let seat = 0; seat < currentRow.length; seat += 1) {
        if (currentRow[seat] === 1) {
          names.push(seatName(row, seat));
        }
      }
    }

    return names;
  }, [selected]);

  const occupiedCount = countValue(seating, 1);
  const availableCount = ROWS * SEATS_PER_ROW - occupiedCount;
  const selectedCount = selectedNames.length;
  const totalPrice = selectedCount * TICKET_PRICE;

  function toggleSeat(rowNumber: number, seatNumber: number): void {
    if (seating[rowNumber]?.[seatNumber] === 1) {
      setMessage(`${seatName(rowNumber, seatNumber)} is already reserved.`);
      return;
    }

    setSelected((current) =>
      current.map((row, rowIndex) =>
        row.map((seat, seatIndex) =>
          rowIndex === rowNumber && seatIndex === seatNumber
            ? seat === 0
              ? 1
              : 0
            : seat,
        ),
      ),
    );

    const isSelected = selected[rowNumber]?.[seatNumber] === 1;
    setMessage(
      isSelected
        ? `${seatName(rowNumber, seatNumber)} removed from your selection.`
        : `${seatName(rowNumber, seatNumber)} added to your selection.`,
    );
  }

  function suggestPair(): void {
    const pair = findAdjacentSeats(seating);

    if (pair === null) {
      setMessage("No two adjacent seats are currently available.");
      return;
    }

    const nextSelected = createEmptyMatrix();
    const firstRow = nextSelected[pair[0][0]];
    const secondRow = nextSelected[pair[1][0]];

    if (firstRow !== undefined && secondRow !== undefined) {
      firstRow[pair[0][1]] = 1;
      secondRow[pair[1][1]] = 1;
    }

    setSelected(nextSelected);
    setMessage(
      `Best available pair: ${seatName(pair[0][0], pair[0][1])} and ${seatName(pair[1][0], pair[1][1])}.`,
    );
  }

  function reserveSelectedSeats(): void {
    if (selectedCount === 0) {
      setMessage("Select at least one available seat before reserving.");
      return;
    }

    setSeating((current) =>
      current.map((row, rowIndex) =>
        row.map((seat, seatIndex) =>
          selected[rowIndex]?.[seatIndex] === 1 ? 1 : seat,
        ),
      ),
    );
    setSelected(createEmptyMatrix());
    setMessage(
      `${selectedCount} ${selectedCount === 1 ? "seat" : "seats"} reserved successfully: ${selectedNames.join(", ")}.`,
    );
  }

  function resetRoom(): void {
    setSeating(createInitialSeating());
    setSelected(createEmptyMatrix());
    setMessage("The screening room has been reset.");
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#seat-map" aria-label="Cinema Seat Manager">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <span>
            <strong>Cinema Seat Manager</strong>
            <small>Independent picture house</small>
          </span>
        </a>
        <button className="reset-button" type="button" onClick={resetRoom}>
          Reset room
        </button>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Screening room 01 · Tonight, 7:30 PM</p>
          <h1>Select your seats</h1>
          <p className="hero-copy">
            Pick a place, find a pair, and reserve in seconds.
          </p>
        </div>
        <div className="film-card" aria-label="Tonight's film">
          <span>Now showing</span>
          <strong>Starlight Avenue</strong>
          <small>1h 58m · General admission</small>
        </div>
      </section>

      <section className="workspace" id="seat-map">
        <div className="theater-panel">
          <div className="stats" aria-label="Current seating totals">
            <div>
              <span className="stat-dot available-dot" aria-hidden="true" />
              <p>Available</p>
              <strong>{availableCount}</strong>
            </div>
            <div>
              <span className="stat-dot selected-dot" aria-hidden="true" />
              <p>Selected</p>
              <strong>{selectedCount}</strong>
            </div>
            <div>
              <span className="stat-dot occupied-dot" aria-hidden="true" />
              <p>Reserved</p>
              <strong>{occupiedCount}</strong>
            </div>
          </div>

          <div className="screen-wrap" aria-hidden="true">
            <div className="screen" />
            <span>Screen</span>
          </div>

          <div className="seat-map-scroll">
            <div className="seat-map" role="group" aria-label="Cinema seat map">
              {seating.map((row, rowIndex) => (
                <div className="seat-row" key={`row-${rowIndex}`}>
                  <span className="row-label">{ROW_LABELS[rowIndex]}</span>
                  {row.map((seat, seatIndex) => {
                    const isOccupied = seat === 1;
                    const isSelected = selected[rowIndex]?.[seatIndex] === 1;
                    const state = isOccupied
                      ? "occupied"
                      : isSelected
                        ? "selected"
                        : "available";

                    return (
                      <button
                        aria-label={`Seat ${seatName(rowIndex, seatIndex)}, ${state}`}
                        aria-pressed={isSelected}
                        className={`seat ${state}`}
                        disabled={isOccupied}
                        key={`seat-${rowIndex}-${seatIndex}`}
                        onClick={() => toggleSeat(rowIndex, seatIndex)}
                        type="button"
                      >
                        <span>{seatIndex + 1}</span>
                      </button>
                    );
                  })}
                  <span className="row-label">{ROW_LABELS[rowIndex]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="legend" aria-label="Seat map legend">
            <span>
              <i className="legend-seat available" /> Available
            </span>
            <span>
              <i className="legend-seat selected" /> Selected
            </span>
            <span>
              <i className="legend-seat occupied" /> Reserved
            </span>
          </div>
        </div>

        <aside className="summary-panel">
          <p className="summary-kicker">Your reservation</p>
          <h2>Seat summary</h2>

          <div className="selection-box">
            <span>Selected seats</span>
            {selectedNames.length > 0 ? (
              <div className="seat-tags">
                {selectedNames.map((name) => (
                  <strong key={name}>{name}</strong>
                ))}
              </div>
            ) : (
              <p>No seats selected yet</p>
            )}
          </div>

          <button className="pair-button" type="button" onClick={suggestPair}>
            <span aria-hidden="true">↔</span>
            Find two seats together
          </button>

          <div className="price-row">
            <span>
              Tickets
              <small>
                {selectedCount} × ${TICKET_PRICE.toFixed(2)}
              </small>
            </span>
            <strong>${totalPrice.toFixed(2)}</strong>
          </div>

          <button
            className="reserve-button"
            disabled={selectedCount === 0}
            onClick={reserveSelectedSeats}
            type="button"
          >
            Reserve {selectedCount > 0 ? `${selectedCount} ` : ""}seat
            {selectedCount === 1 ? "" : "s"}
          </button>

          <p className="status-message" role="status" aria-live="polite">
            {message}
          </p>
        </aside>
      </section>

      <footer>
        <span>80 seats · 8 rows · 10 seats per row</span>
        <span>Built with TypeScript arrays and functions</span>
      </footer>
    </main>
  );
}
