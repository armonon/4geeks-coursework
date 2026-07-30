import type { Room } from "@/types";
export const HostInfo = ({ room }: { room: Room }) => (
  <section className="flex items-center gap-4 border-b border-zinc-200 py-6">
    <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-2xl">☺</div>
    <div><h2 className="font-semibold">Hosted by {room.host}</h2><p className="text-sm text-zinc-500">{room.yearsHosting} years hosting · Superhost</p></div>
  </section>
);
