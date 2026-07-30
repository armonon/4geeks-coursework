interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="field">
      <label htmlFor="search">Search by title</label>
      <input id="search" type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Try “sailing” or “forest”" />
    </div>
  );
}
