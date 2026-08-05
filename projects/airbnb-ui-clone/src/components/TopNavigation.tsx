"use client";

import Link from "next/link";

interface Props {
  search?: string;
  onSearchChange?: (value: string) => void;
}

export const TopNavigation = ({ search = "", onSearchChange }: Props) => (
  <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:h-20 md:px-8">
      <Link href="/" className="shrink-0 text-xl font-black tracking-tight text-rose-500" aria-label="Staybnb home">
        <span className="text-2xl">⌂</span> staybnb
      </Link>
      <label className="mx-auto flex h-12 min-w-0 max-w-xl flex-1 items-center rounded-full border border-zinc-200 bg-white px-4 shadow-sm transition-shadow focus-within:shadow-md">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Search destinations</span>
        <input
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search destinations"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium outline-none"
        />
        <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white">→</span>
      </label>
      <Link href="/catalog" className="hidden rounded-full px-3 py-2 text-sm font-semibold hover:bg-zinc-100 md:block">
        Browse stays
      </Link>
      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-200" aria-label="Open user menu">
        ☰
      </button>
    </div>
  </header>
);
