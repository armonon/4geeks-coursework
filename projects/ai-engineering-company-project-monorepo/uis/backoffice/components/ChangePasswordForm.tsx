"use client";

import { toUserMessage } from "@/lib/errors";
import { useState } from "react";
import { changePassword } from "@/lib/auth";

/**
 * /account/change-password — for a user who is already signed in.
 *
 * Protected by AuthProvider like every other /account route, and the
 * API additionally requires the bearer token plus the current password.
 */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!current) errs.current = "Enter your current password.";
    if (!next) {
      errs.next = "Enter a new password.";
    } else if (next.length < 8) {
      errs.next = "Must be at least 8 characters.";
    }
    // Checked before the API call, as the brief requires.
    if (confirm !== next) errs.confirm = "Passwords do not match.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setSuccess(null);

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const message = await changePassword(current, next);
      setSuccess(message);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setApiError(
        toUserMessage(err, "Could not change your password."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Change password
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          You&apos;ll need your current password to set a new one.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        {apiError && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          >
            {apiError}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {success}
          </div>
        )}

        <Row label="Current password" error={fieldErrors.current}>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={cls(!!fieldErrors.current)}
          />
        </Row>

        <Row label="New password" error={fieldErrors.next}>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={cls(!!fieldErrors.next)}
            placeholder="At least 8 characters"
          />
        </Row>

        <Row label="Confirm new password" error={fieldErrors.confirm}>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={cls(!!fieldErrors.confirm)}
          />
        </Row>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}

function Row({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function cls(hasError: boolean): string {
  return `w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-slate-300 focus:ring-slate-400"
  }`;
}
