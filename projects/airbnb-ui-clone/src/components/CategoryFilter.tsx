import type { Category } from "@/types";

const categories: { value: Category; icon: string }[] = [
  { value: "All", icon: "✦" },
  { value: "Beach", icon: "⛱" },
  { value: "Cabins", icon: "⌂" },
  { value: "Mansions", icon: "♜" },
  { value: "Trending", icon: "↗" },
];

interface Props {
  active: Category;
  onSelect: (category: Category) => void;
}

export const CategoryFilter = ({ active, onSelect }: Props) => (
  <div className="no-scrollbar flex gap-7 overflow-x-auto border-b border-zinc-200 px-4 py-4 md:justify-center">
    {categories.map(({ value, icon }) => (
      <button
        key={value}
        onClick={() => onSelect(value)}
        className={`flex min-w-16 flex-col items-center gap-1 border-b-2 pb-2 text-xs font-semibold transition ${
          active === value ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-900"
        }`}
      >
        <span className="text-xl">{icon}</span>{value}
      </button>
    ))}
  </div>
);
