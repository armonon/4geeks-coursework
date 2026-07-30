"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ExperienceCard from "@/components/ExperienceCard";
import FilterBar from "@/components/FilterBar";
import SearchBar from "@/components/SearchBar";
import { useFavorites } from "@/context/FavoritesContext";
import { useExperiences } from "@/hooks/useExperiences";

export default function ExplorerClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [destination, setDestination] = useState(() => searchParams.get("destination") ?? "");
  const { favoriteIds, toggleFavorite } = useFavorites();
  const filteredExperiences = useExperiences(search, category, destination);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (destination) params.set("destination", destination);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, category, destination, pathname, router]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setDestination("");
  };

  return (
    <div className="explorer shell">
      <div className="filters">
        <SearchBar value={search} onChange={setSearch} />
        <FilterBar category={category} destination={destination} onCategoryChange={setCategory} onDestinationChange={setDestination} />
      </div>
      <div className="results-row">
        <span>{filteredExperiences.length} experiences found</span>
        {(search || category || destination) && <button onClick={clearFilters}>Clear all filters</button>}
      </div>
      <div className="cards-grid">
        {filteredExperiences.length ? filteredExperiences.map((experience) => (
          <ExperienceCard key={experience.id} experience={experience} isFavorite={favoriteIds.includes(experience.id)} onToggleFavorite={toggleFavorite} />
        )) : (
          <div className="no-results">
            <h3>No results found</h3>
            <p>Try broadening your search or clearing a filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
