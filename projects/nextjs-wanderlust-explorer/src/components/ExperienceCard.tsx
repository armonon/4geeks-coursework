import Link from "next/link";
import { Experience } from "@/types/experience";

interface ExperienceCardProps {
  experience: Experience;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}

export default function ExperienceCard({ experience, isFavorite, onToggleFavorite }: ExperienceCardProps) {
  return (
    <article className="experience-card">
      <div className="card-image">
        <button
          className={`heart ${isFavorite ? "active" : ""}`}
          onClick={() => onToggleFavorite(experience.id)}
          aria-label={`${isFavorite ? "Remove" : "Add"} ${experience.title} ${isFavorite ? "from" : "to"} favorites`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
        <Link href={`/experiences/${experience.id}`}>
          {/* Dataset images come from curated Unsplash URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={experience.imageUrl} alt={experience.title} />
        </Link>
      </div>
      <div className="card-body">
        <div className="card-meta"><span>{experience.category}</span><span>{experience.duration}</span></div>
        <Link href={`/experiences/${experience.id}`}><h3>{experience.title}</h3></Link>
        <p className="card-place">{experience.destination}</p>
        <div className="card-bottom">
          <span className="card-price">From <strong>${experience.price}</strong></span>
          <span className="rating">★ {experience.rating.toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}
