import { Experience } from "@/types/experience";

const seeds: Omit<Experience, "id">[] = [
  { title: "Sail the Quiet Adriatic", description: "Follow the afternoon wind between limestone islands, stopping in hidden coves for a swim and a long seaside lunch.", category: "Adventure", destination: "Split, Croatia", price: 185, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=80", duration: "8 hours" },
  { title: "Bangkok After Dark", description: "Taste your way through neon-lit lanes with a local chef, from wok-fired noodles to the city's best mango sticky rice.", category: "Food", destination: "Bangkok, Thailand", price: 72, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80", duration: "4 hours" },
  { title: "Forest Bathing Ritual", description: "Slow down beneath ancient cedars with a guide trained in Japanese forest therapy and a warming tea ceremony.", category: "Wellness", destination: "Kyoto, Japan", price: 95, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80", duration: "3 hours" },
  { title: "Atlas Mountain Sunrise", description: "Climb in the cool predawn air, share mint tea in a Berber village, and watch the High Atlas turn gold.", category: "Nature", destination: "Marrakech, Morocco", price: 120, rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?auto=format&fit=crop&w=1200&q=80", duration: "10 hours" },
  { title: "The Artisans of Oaxaca", description: "Meet textile artists and ceramicists preserving generations of color, craft, and Zapotec tradition.", category: "Culture", destination: "Oaxaca, Mexico", price: 84, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1200&q=80", duration: "5 hours" },
  { title: "Volcanic Highlands Trek", description: "Cross moss-green ridges, steaming valleys, and black-sand terrain on a small-group highland trek.", category: "Adventure", destination: "Reykjavík, Iceland", price: 210, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80", duration: "9 hours" },
  { title: "Pasta in a Roman Home", description: "Roll silken pasta dough at a family table, learn a treasured sauce, and linger over a generous Roman meal.", category: "Food", destination: "Rome, Italy", price: 110, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80", duration: "4 hours" },
  { title: "Temples & Tea Houses", description: "Walk through hushed temple gardens and historic lanes before a private tea tasting with a local historian.", category: "Culture", destination: "Seoul, South Korea", price: 76, rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1538485399081-7c8972cc3839?auto=format&fit=crop&w=1200&q=80", duration: "5 hours" },
  { title: "Patagonian Blue Ice", description: "Hike beside luminous glaciers and wind-cut peaks with a naturalist who knows every condor and crevasse.", category: "Nature", destination: "El Calafate, Argentina", price: 240, rating: 5.0, imageUrl: "https://images.unsplash.com/photo-1531761535209-180857e963b9?auto=format&fit=crop&w=1200&q=80", duration: "11 hours" },
  { title: "Clifftop Yoga Escape", description: "Begin with ocean-facing vinyasa, then settle into breathwork and a bright, seasonal brunch above the sea.", category: "Wellness", destination: "Uluwatu, Indonesia", price: 68, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80", duration: "3 hours" },
  { title: "Misty Valley Horseback Ride", description: "Ride gentle mountain trails through cloud forest and coffee country with an expert local horseman.", category: "Adventure", destination: "Salento, Colombia", price: 102, rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=1200&q=80", duration: "5 hours" },
  { title: "Lisbon's Secret Kitchens", description: "Follow a food writer to tiny tascas, family bakeries, and a tucked-away cellar for petiscos and vinho verde.", category: "Food", destination: "Lisbon, Portugal", price: 89, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80", duration: "4 hours" },
  { title: "Desert Stargazing Camp", description: "Watch the dunes cool from amber to violet, dine by firelight, and map the Sahara sky with an astronomer.", category: "Nature", destination: "Merzouga, Morocco", price: 175, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=80", duration: "Overnight" },
  { title: "Havana Through Music", description: "Trace son, rumba, and jazz through storied rehearsal rooms before joining musicians for an intimate set.", category: "Culture", destination: "Havana, Cuba", price: 78, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1500759285222-a95626b934cb?auto=format&fit=crop&w=1200&q=80", duration: "4 hours" },
  { title: "Alpine Lake Reset", description: "Combine a clear-air hike, cold-water immersion, and restorative sauna beside a pristine mountain lake.", category: "Wellness", destination: "Interlaken, Switzerland", price: 145, rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80", duration: "6 hours" },
  { title: "Kayak the Emerald Caves", description: "Paddle glassy water beneath soaring cliffs and into sea caves reachable only by a quiet kayak.", category: "Adventure", destination: "Kotor, Montenegro", price: 92, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1544550285-f813152fb2fd?auto=format&fit=crop&w=1200&q=80", duration: "4 hours" },
  { title: "A Night in the Souk", description: "Discover spice merchants, storytellers, and rooftop kitchens as the old medina comes alive after sunset.", category: "Culture", destination: "Fez, Morocco", price: 65, rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=1200&q=80", duration: "3 hours" },
  { title: "Wild Coast Foraging", description: "Gather salt-tossed herbs and shellfish with a coastal ecologist, then cook your harvest over an open fire.", category: "Food", destination: "Galway, Ireland", price: 132, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", duration: "6 hours" },
  { title: "Redwood Silence Retreat", description: "Leave your phone behind for guided meditation, mindful walking, and a plant-based picnic among the redwoods.", category: "Wellness", destination: "California, USA", price: 88, rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80", duration: "5 hours" },
  { title: "Fjords by Electric Boat", description: "Glide almost silently between waterfalls and sheer green walls while a naturalist reads the changing landscape.", category: "Nature", destination: "Flåm, Norway", price: 198, rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1520769669658-f07657f5a307?auto=format&fit=crop&w=1200&q=80", duration: "7 hours" },
];

const adjectives = ["Hidden", "Golden", "Wild", "Slow", "Secret"];

export const experiences: Experience[] = Array.from({ length: 100 }, (_, index) => {
  const seed = seeds[index % seeds.length];
  const cycle = Math.floor(index / seeds.length);
  return {
    ...seed,
    id: index + 1,
    title: cycle === 0 ? seed.title : `${adjectives[cycle - 1]} ${seed.title}`,
    price: seed.price + cycle * 7,
    rating: Number(Math.max(4.5, seed.rating - cycle * 0.1).toFixed(1)),
  };
});

export const categories = ["Adventure", "Culture", "Food", "Wellness", "Nature"] as const;
export const destinations = [...new Set(experiences.map((experience) => experience.destination))].sort();
