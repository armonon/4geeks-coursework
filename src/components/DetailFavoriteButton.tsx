"use client";

import { useEffect } from "react";
import { useFavorites } from "@/context/FavoritesContext";

export default function DetailFavoriteButton({ id, title }: { id: number; title: string }) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const active = favoriteIds.includes(id);

  useEffect(() => {
    document.title = `${title} | Wanderlust`;
  }, [title]);

  return (
    <button className={`button favorite-large ${active ? "active" : ""}`} onClick={() => toggleFavorite(id)}>
      {active ? "♥ Saved to favorites" : "♡ Save this experience"}
    </button>
  );
}
