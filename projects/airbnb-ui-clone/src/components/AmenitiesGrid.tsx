export const AmenitiesGrid = ({ amenities }: { amenities: string[] }) => (
  <section className="border-b border-zinc-200 py-6">
    <h2 className="mb-5 text-xl font-semibold">What this place offers</h2>
    <div className="grid grid-cols-2 gap-4">{amenities.map((amenity, index) => (
      <p key={amenity} className="flex items-center gap-3 text-sm"><span className="text-xl">{["⌁", "♨", "P", "◉", "◫", "▱"][index]}</span>{amenity}</p>
    ))}</div>
  </section>
);
