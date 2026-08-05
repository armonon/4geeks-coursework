"use client";
import { useState } from "react";
import type { Room } from "@/types";

export const PhotoGallery = ({ photos, title }: Pick<Room, "photos" | "title">) => {
  const [index, setIndex] = useState(0);
  const changePhoto = (step: number) => setIndex((current) => (current + step + photos.length) % photos.length);
  return (
    <section className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br md:aspect-[16/7] ${photos[index].color}`}>
      <div className="absolute inset-0 grid place-items-center text-center text-white">
        <span className="text-8xl drop-shadow-lg">🏡</span>
        <p className="mt-2 rounded-full bg-black/35 px-4 py-2 text-sm font-medium">{photos[index].label}</p>
      </div>
      <button onClick={() => changePhoto(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow" aria-label="Previous photo">←</button>
      <button onClick={() => changePhoto(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow" aria-label="Next photo">→</button>
      <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{index + 1} / {photos.length}</span>
      <span className="sr-only">{title}</span>
    </section>
  );
};
