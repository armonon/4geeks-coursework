"use client";

import Link from "next/link";
import { useFavorites } from "@/context/FavoritesContext";

export default function ProfilePage() {
  const { favoriteIds } = useFavorites();
  return (
    <div className="profile-page shell">
      <p className="eyebrow">Traveler profile</p>
      <h1 className="page-title">Your corner of the world</h1>
      <article className="profile-card">
        <div className="profile-photo" role="img" aria-label="Portrait of Maya Bennett" />
        <div className="profile-info">
          <p className="eyebrow">Curious wanderer</p>
          <h2>Maya Bennett</h2>
          <p>Based in San Francisco. Always looking for the long way home, a perfect bowl of noodles, and somewhere quiet enough to hear the weather change.</p>
          <div className="profile-stats">
            <div><strong>{favoriteIds.length}</strong><span>Saved favorites</span></div>
            <div><strong>12</strong><span>Countries visited</span></div>
          </div>
          <Link className="text-link" href="/favorites">View saved experiences →</Link>
        </div>
      </article>
    </div>
  );
}
