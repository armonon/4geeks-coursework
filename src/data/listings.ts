import type { Listing, Room } from "@/types";

export const listings: Listing[] = [
  { id: "ocean-cove", title: "Seaside hideaway", location: "Malibu, California", category: "Beach", price: 289, rating: 4.96, distance: "42 miles away", color: "from-cyan-200 via-sky-300 to-blue-600", emoji: "🌊" },
  { id: "pine-retreat", title: "A-frame in the pines", location: "Big Bear, California", category: "Cabins", price: 174, rating: 4.91, distance: "87 miles away", color: "from-emerald-200 via-green-400 to-emerald-900", emoji: "🌲" },
  { id: "desert-modern", title: "Modern desert oasis", location: "Joshua Tree, California", category: "Trending", price: 221, rating: 4.88, distance: "116 miles away", color: "from-amber-100 via-orange-300 to-rose-500", emoji: "🌵" },
  { id: "cliff-villa", title: "Villa above the Pacific", location: "Big Sur, California", category: "Mansions", price: 645, rating: 4.99, distance: "302 miles away", color: "from-indigo-200 via-violet-300 to-fuchsia-600", emoji: "🏡" },
  { id: "laguna-bungalow", title: "Coastal design bungalow", location: "Laguna Beach, California", category: "Beach", price: 315, rating: 4.94, distance: "51 miles away", color: "from-teal-100 via-cyan-300 to-blue-500", emoji: "⛱️" },
  { id: "redwood-cabin", title: "Quiet redwood cabin", location: "Guerneville, California", category: "Cabins", price: 198, rating: 4.89, distance: "418 miles away", color: "from-lime-200 via-emerald-500 to-slate-800", emoji: "🪵" },
];

export const getRoom = (id: string): Room => {
  const listing = listings.find((item) => item.id === id) ?? listings[0];
  return {
    ...listing,
    reviews: 127,
    host: "Maya",
    yearsHosting: 7,
    maxGuests: 6,
    amenities: ["Fast wifi", "Kitchen", "Free parking", "Ocean view", "Washer", "Dedicated workspace"],
    photos: [
      { color: listing.color, label: "Living space" },
      { color: "from-rose-100 via-orange-200 to-amber-500", label: "Sunlit bedroom" },
      { color: "from-slate-100 via-teal-200 to-cyan-600", label: "Private terrace" },
    ],
  };
};
