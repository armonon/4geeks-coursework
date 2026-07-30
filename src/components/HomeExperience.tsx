"use client";
import { useEffect, useMemo, useState } from "react";
import { listings } from "@/data/listings";
import type { Category, Listing } from "@/types";
import { CategoryFilter } from "./CategoryFilter";
import { ListingGrid } from "./ListingGrid";
import { LoadingState } from "./LoadingState";
import { TopNavigation } from "./TopNavigation";

export const HomeExperience = () => {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Category>("All");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => { setItems(listings); setLoading(false); }, 850);
    return () => window.clearTimeout(timer);
  }, []);
  const visible = useMemo(() => items.filter((item) => {
    const categoryMatches = active === "All" || item.category === active;
    return categoryMatches && `${item.location} ${item.title}`.toLowerCase().includes(search.toLowerCase());
  }), [active, items, search]);
  return (
    <>
      <TopNavigation search={search} onSearchChange={setSearch} />
      <CategoryFilter active={active} onSelect={setActive} />
      <main className="mx-auto w-full max-w-7xl px-4 py-7 md:px-8">
        <div className="mb-6"><p className="text-sm font-semibold text-rose-500">Curated escapes</p><h1 className="text-2xl font-semibold md:text-3xl">Find your next favorite place</h1></div>
        {loading ? <LoadingState /> : visible.length ? <ListingGrid items={visible} /> : <p className="py-24 text-center text-zinc-500">No stays match those filters.</p>}
      </main>
    </>
  );
};
