import Link from "next/link";
import { notFound } from "next/navigation";
import DetailFavoriteButton from "@/components/DetailFavoriteButton";
import { experiences } from "@/data/experiences";

export function generateStaticParams() {
  return experiences.map((experience) => ({ id: String(experience.id) }));
}

export default async function ExperienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const experience = experiences.find((item) => item.id === Number(id));
  if (!experience) notFound();

  return (
    <div className="detail shell">
      <Link className="back-link" href="/experiences">← Back to all experiences</Link>
      <div className="detail__grid">
        <div className="detail__image" style={{ backgroundImage: `url("${experience.imageUrl}")` }} role="img" aria-label={experience.title} />
        <section className="detail__info">
          <p className="eyebrow">{experience.category}</p>
          <h1>{experience.title}</h1>
          <p className="detail__destination">{experience.destination}</p>
          <p className="detail__description">{experience.description}</p>
          <div className="detail__facts">
            <div className="fact"><span>Duration</span><strong>{experience.duration}</strong></div>
            <div className="fact"><span>From</span><strong>${experience.price}</strong></div>
            <div className="fact"><span>Guest rating</span><strong>★ {experience.rating.toFixed(1)}</strong></div>
          </div>
          <DetailFavoriteButton id={experience.id} title={experience.title} />
        </section>
      </div>
    </div>
  );
}
