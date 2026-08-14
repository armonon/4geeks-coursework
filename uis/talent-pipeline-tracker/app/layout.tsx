import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrackFlow · Talent Pipeline",
  description:
    "Internal People & Talent workspace for the TrackFlow hiring team.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-900 text-sm font-bold text-white">
                TF
              </span>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  TrackFlow
                </div>
                <div className="text-xs leading-tight text-slate-500">
                  Talent Pipeline · People &amp; Talent
                </div>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-slate-700 hover:text-slate-900 hover:underline"
              >
                Candidates
              </Link>
              <Link
                href="/candidates/new"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                Register candidate
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
