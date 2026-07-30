export type Category = "All" | "Beach" | "Cabins" | "Mansions" | "Trending";

export interface Listing {
  id: string;
  title: string;
  location: string;
  category: Exclude<Category, "All">;
  price: number;
  rating: number;
  distance: string;
  color: string;
  emoji: string;
}

export interface Room extends Listing {
  reviews: number;
  host: string;
  yearsHosting: number;
  maxGuests: number;
  amenities: string[];
  photos: { color: string; label: string }[];
}
