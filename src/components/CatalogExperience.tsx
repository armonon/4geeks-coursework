"use client";
import { useMemo, useState } from "react";
import { listings } from "@/data/listings";
import { ListingGrid } from "./ListingGrid";
import { MapPlaceholder } from "./MapPlaceholder";
import { ResultsHeader, type SortOrder } from "./ResultsHeader";
import { TopNavigation } from "./TopNavigation";

export const CatalogExperience = () => {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<SortOrder>("asc");
  const results = useMemo(() => listings
    .filter((item) => `${item.location} ${item.title}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => order === "asc" ? a.price - b.price : b.price - a.price), [order, search]);
  return (
    <>
      <TopNavigation search={search} onSearchChange={setSearch} />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 md:px-8">
        <ResultsHeader count={results.length} order={order} onChange={setOrder} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]">
          {results.length ? <ListingGrid items={results} /> : <p className="py-24 text-center text-zinc-500">No matching stays.</p>}
          <MapPlaceholder />
        </div>
      </main>
    </>
  );
};
