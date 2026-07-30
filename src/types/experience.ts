export interface Experience {
  id: number;
  title: string;
  description: string;
  category: "Adventure" | "Culture" | "Food" | "Wellness" | "Nature";
  destination: string;
  price: number;
  rating: number;
  imageUrl: string;
  duration: string;
}
