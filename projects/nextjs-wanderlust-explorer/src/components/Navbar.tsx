"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFavorites } from "@/context/FavoritesContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/experiences", label: "Explore" },
  { href: "/favorites", label: "Favorites" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { favoriteIds } = useFavorites();

  return (
    <header className="navbar">
      <div className="shell navbar__inner">
        <Link className="brand" href="/" onClick={() => setMenuOpen(false)}>WANDERLUST</Link>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
        <nav className={menuOpen ? "open" : ""}>
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} className={`nav-link ${active ? "active" : ""}`} href={link.href} onClick={() => setMenuOpen(false)}>
                <span className={link.href === "/favorites" ? "nav-heart" : ""}>
                  {link.label}
                  {link.href === "/favorites" && <span className="count">{favoriteIds.length}</span>}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
