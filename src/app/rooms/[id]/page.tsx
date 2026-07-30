import { RoomDetails } from "@/components/RoomDetails";
import { TopNavigation } from "@/components/TopNavigation";
import { getRoom } from "@/data/listings";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><TopNavigation /><RoomDetails room={getRoom(id)} /></>;
}
