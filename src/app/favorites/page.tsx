"use client";

import Link from "next/link";
import ExperienceCard from "@/components/ExperienceCard";
import { useFavorites } from "@/context/FavoritesContext";
import { experiences } from "@/data/experiences";

export default function FavoritesPage() {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const favorites = experiences.filter((experience) => favoriteIds.includes(experience.id));

  return (
    <div className="favorites-page shell">
      <p className="eyebrow">Your collection</p>
      <h1 className="page-title">Saved favorites</h1>
      {favorites.length ? (
        <div className="cards-grid" style={{ marginTop: 38 }}>
          {favorites.map((experience) => <ExperienceCard key={experience.id} experience={experience} isFavorite onToggleFavorite={toggleFavorite} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your list is ready for a story.</h2>
          <p>Tap the heart on any experience and it will wait for you here.</p>
          <Link className="button" href="/experiences">Start exploring →</Link>
        </div>
      )}
    </div>
  );
}
