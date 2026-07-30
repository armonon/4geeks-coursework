import { categories, destinations } from "@/data/experiences";

interface FilterBarProps {
  category: string;
  destination: string;
  onCategoryChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
}

export default function FilterBar({ category, destination, onCategoryChange, onDestinationChange }: FilterBarProps) {
  return (
    <>
      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="destination">Destination</label>
        <select id="destination" value={destination} onChange={(event) => onDestinationChange(event.target.value)}>
          <option value="">Anywhere</option>
          {destinations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </>
  );
}
