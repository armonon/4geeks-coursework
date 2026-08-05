"use client";

import ExperienceCard from "@/components/ExperienceCard";
import { useFavorites } from "@/context/FavoritesContext";
import { Experience } from "@/types/experience";

export default function HomeFavorites({ experiences }: { experiences: Experience[] }) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  return (
    <div className="cards-grid">
      {experiences.map((experience) => (
        <ExperienceCard key={experience.id} experience={experience} isFavorite={favoriteIds.includes(experience.id)} onToggleFavorite={toggleFavorite} />
      ))}
    </div>
  );
}
