import { Suspense } from "react";
import ExplorerClient from "@/components/ExplorerClient";

export default function ExperiencesPage() {
  return (
    <>
      <header className="page-header">
        <div className="shell">
          <p className="eyebrow">100 ways to wander</p>
          <h1 className="page-title">Explore experiences</h1>
          <p>Search by the story you want to tell, then narrow the world by destination or the feeling you&apos;re after.</p>
        </div>
      </header>
      <Suspense fallback={<div className="shell explorer">Loading experiences…</div>}>
        <ExplorerClient />
      </Suspense>
    </>
  );
}
