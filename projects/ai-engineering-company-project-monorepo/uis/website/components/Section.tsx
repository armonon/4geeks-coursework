import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-6xl px-6 py-16 sm:py-20 ${className}`}
    >
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
