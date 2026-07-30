import { useMemo } from "react";
import { experiences } from "@/data/experiences";

export function useExperiences(search: string, category: string, destination: string) {
  return useMemo(() => {
    // Escaping user input keeps the required case-insensitive regex safe for characters such as "[".
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titlePattern = new RegExp(safeSearch, "i");

    return experiences.filter((experience) => {
      const matchesSearch = !search || titlePattern.test(experience.title);
      const matchesCategory = !category || experience.category === category;
      const matchesDestination = !destination || experience.destination === destination;
      return matchesSearch && matchesCategory && matchesDestination;
    });
  }, [search, category, destination]);
}
