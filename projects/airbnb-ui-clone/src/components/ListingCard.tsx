import Link from "next/link";
import type { Listing } from "@/types";

export const ListingCard = ({ listing }: { listing: Listing }) => (
  <article className="group min-w-0">
    <Link href={`/rooms/${listing.id}`} className="block" aria-label={`View ${listing.title}`}>
      <div className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${listing.color}`}>
        <span className="absolute inset-0 grid place-items-center text-7xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
          {listing.emoji}
        </span>
        <span aria-hidden="true" className="absolute right-3 top-3 text-2xl text-white drop-shadow-md">♡</span>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">Guest favorite</span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-x-2 text-sm">
        <h2 className="truncate font-semibold">{listing.location}</h2>
        <p>★ {listing.rating}</p>
        <p className="truncate text-zinc-500">{listing.title} · {listing.distance}</p>
        <span />
        <p className="mt-1"><span className="font-semibold">${listing.price}</span> night</p>
      </div>
    </Link>
  </article>
);
