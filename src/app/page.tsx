import Link from "next/link";
import { experiences } from "@/data/experiences";
import HomeFavorites from "@/components/HomeFavorites";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero__shade" />
        <div className="hero__content shell">
          <p className="eyebrow light">Curated journeys, unforgettable stories</p>
          <h1>Find a place that<br />changes your pace.</h1>
          <p className="hero__copy">
            Thoughtful experiences for curious travelers. From hidden kitchens
            to wild coastlines, your next favorite memory starts here.
          </p>
          <Link className="button button--light" href="/experiences">
            Explore all experiences <span>→</span>
          </Link>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Handpicked for you</p>
            <h2>Stories worth traveling for</h2>
          </div>
          <Link className="text-link" href="/experiences">View all 100 →</Link>
        </div>
        <HomeFavorites experiences={experiences.slice(0, 3)} />
      </section>

      <section className="manifesto">
        <div className="shell manifesto__inner">
          <p className="eyebrow light">Travel differently</p>
          <blockquote>
            “The best journeys don&apos;t just show you a new place.
            They show you a new way of seeing.”
          </blockquote>
          <Link className="button button--outline" href="/profile">
            Meet your travel profile
          </Link>
        </div>
      </section>
    </>
  );
}
