export const MapPlaceholder = () => (
  <aside className="relative min-h-80 overflow-hidden rounded-3xl bg-emerald-50 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
    <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(35deg,transparent_48%,#a7c7b2_49%,#a7c7b2_51%,transparent_52%),linear-gradient(125deg,transparent_48%,#bdd8c5_49%,#bdd8c5_51%,transparent_52%)] [background-size:70px_70px]" />
    <div className="absolute left-[18%] top-[28%] rounded-full bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">$174</div>
    <div className="absolute right-[15%] top-[42%] rounded-full bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">$289</div>
    <div className="absolute bottom-[22%] left-[42%] rounded-full bg-rose-500 px-3 py-2 text-sm font-semibold text-white">$221</div>
    <span className="absolute bottom-4 right-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow">Map</span>
  </aside>
);
