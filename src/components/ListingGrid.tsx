import type { Listing } from "@/types";
import { ListingCard } from "./ListingCard";

export const ListingGrid = ({ items }: { items: Listing[] }) => (
  <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
  </div>
);
