export type SortOrder = "asc" | "desc";

interface Props {
  count: number;
  order: SortOrder;
  onChange: (order: SortOrder) => void;
}

export const ResultsHeader = ({ count, order, onChange }: Props) => (
  <div className="mb-6 flex items-end justify-between gap-4">
    <div>
      <p className="text-sm text-zinc-500">California stays</p>
      <h1 className="text-2xl font-semibold">{count} places to stay</h1>
    </div>
    <label className="text-xs font-semibold text-zinc-600">
      Sort by
      <select value={order} onChange={(event) => onChange(event.target.value as SortOrder)} className="ml-2 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900">
        <option value="asc">Price: low to high</option>
        <option value="desc">Price: high to low</option>
      </select>
    </label>
  </div>
);
