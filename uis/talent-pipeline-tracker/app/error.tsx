"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary.
 *
 * Without this file, a render-time exception anywhere in the tracker
 * unmounted the whole tree and Next.js showed its own fallback:
 *
 *   "Application error: a client-side exception has occurred
 *    (see the browser console for more information)."
 *
 * Reproduced by serving a 200 whose body was missing a nested object the
 * view reads: the page went blank, the navigation disappeared, and the
 * only instruction was to open a developer console.
 *
 * Nothing here is a substitute for handling errors where they happen —
 * this is the net under the trapeze, for the cases nobody predicted.
 *
 * This app runs Next 16, which renamed the recovery callback from
 * `reset` to `unstable_retry`. uis/backoffice is still on Next 15 and its
 * copy uses `reset` — the two are not interchangeable.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // The detail belongs in the console and the error reporter, not on
    // screen — it is a stack trace, not a sentence.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-sm text-red-900"
      >
        <h1 className="text-base font-semibold">This page didn&apos;t load</h1>
        <p className="mt-2">
          Something went wrong while displaying it. Your work has not been
          lost, and you are still signed in.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={unstable_retry}
            className="rounded-md border border-red-400 bg-white px-3 py-1.5 font-medium hover:bg-red-100"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-md border border-red-300 bg-white px-3 py-1.5 font-medium hover:bg-red-100"
          >
            Back to the pipeline
          </Link>
        </div>
        <p className="mt-4 text-xs text-red-800">
          If it keeps happening, contact the platform team
          {error.digest ? ` and quote reference ${error.digest}` : ""}.
        </p>
      </div>
    </div>
  );
}
