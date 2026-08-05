"use client";
import { useState } from "react";

export const BookingCard = ({ price, maxGuests }: { price: number; maxGuests: number }) => {
  const [guests, setGuests] = useState(1);
  return (
    <aside className="rounded-2xl border border-zinc-200 p-5 shadow-lg md:sticky md:top-24">
      <p className="mb-5"><span className="text-xl font-semibold">${price}</span> night</p>
      <div className="rounded-xl border border-zinc-300 p-3">
        <p className="text-[10px] font-bold uppercase">Guests</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm">{guests} guest{guests > 1 ? "s" : ""}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setGuests((value) => Math.max(1, value - 1))} disabled={guests === 1} className="h-8 w-8 rounded-full border disabled:opacity-30" aria-label="Remove guest">−</button>
            <button onClick={() => setGuests((value) => Math.min(maxGuests, value + 1))} disabled={guests === maxGuests} className="h-8 w-8 rounded-full border disabled:opacity-30" aria-label="Add guest">+</button>
          </div>
        </div>
      </div>
      <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-rose-600 to-pink-500 py-3 font-semibold text-white">Reserve</button>
      <p className="mt-3 text-center text-xs text-zinc-500">You won&apos;t be charged yet</p>
      <div className="mt-5 flex justify-between border-t pt-4 text-sm"><span>Estimated total</span><strong>${price * 3}</strong></div>
    </aside>
  );
};
