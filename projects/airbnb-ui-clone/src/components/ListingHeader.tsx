import type { Room } from "@/types";
export const ListingHeader = ({ room }: { room: Room }) => (
  <section className="border-b border-zinc-200 py-6">
    <h1 className="text-2xl font-semibold md:text-3xl">{room.title}</h1>
    <p className="mt-2 text-sm font-medium">★ {room.rating} · <span className="underline">{room.reviews} reviews</span> · <span className="underline">{room.location}</span></p>
  </section>
);
