"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Room } from "@/types";
import { AmenitiesGrid } from "./AmenitiesGrid";
import { BookingCard } from "./BookingCard";
import { HostInfo } from "./HostInfo";
import { ListingHeader } from "./ListingHeader";
import { LoadingState } from "./LoadingState";
import { PhotoGallery } from "./PhotoGallery";

export const RoomDetails = ({ room }: { room: Room }) => {
  const [loadedRoom, setLoadedRoom] = useState<Room | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoadedRoom(room), 700);
    return () => window.clearTimeout(timer);
  }, [room]);
  if (!loadedRoom) return <LoadingState label="Opening your stay…" />;
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8">
      <Link href="/catalog" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold underline">← Back to catalog</Link>
      <PhotoGallery photos={loadedRoom.photos} title={loadedRoom.title} />
      <div className="grid gap-8 md:grid-cols-[1fr_340px]">
        <div><ListingHeader room={loadedRoom} /><HostInfo room={loadedRoom} /><AmenitiesGrid amenities={loadedRoom.amenities} /></div>
        <div className="py-6"><BookingCard price={loadedRoom.price} maxGuests={loadedRoom.maxGuests} /></div>
      </div>
    </main>
  );
};
