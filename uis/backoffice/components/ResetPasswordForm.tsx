"use client";

import { toUserMessage } from "@/lib/errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { resetPassword } from "@/lib/auth";
import { AuthShell, Field, inputCls } from "@/components/LoginForm";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The token arrives in the link the user clicked in their email.
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Must be at least 8 characters.";
    }
    if (confirm !== password) errs.confirm = "Passwords do not match.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      router.replace("/login?reset=1");
    } catch (err) {
      setApiError(
        toUserMessage(err, "This reset link is invalid or has expired."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const backToForgot = (
    <Link
      href="/forgot-password"
      className="font-medium text-slate-900 underline"
    >
      Request a new link
    </Link>
  );

  // No token in the URL at all — nothing to submit.
  if (!token) {
    return (
      <AuthShell
        title="Reset your password"
        subtitle="TrackFlow Backoffice — People & Operations"
        footer={backToForgot}
      >
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-medium">This link is missing its token</p>
          <p className="mt-1">
            Open the link from your email exactly as it was sent, or
            request a new one.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="TrackFlow Backoffice — People & Operations"
      footer={backToForgot}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {apiError && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          >
            <p>{apiError}</p>
            <p className="mt-2">
              <Link href="/forgot-password" className="font-medium underline">
                Request a new link
              </Link>
            </p>
          </div>
        )}

        <Field label="New password" error={fieldErrors.password}>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls(!!fieldErrors.password)}
            placeholder="At least 8 characters"
          />
        </Field>

        <Field label="Confirm new password" error={fieldErrors.confirm}>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls(!!fieldErrors.confirm)}
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Set new password"}
        </button>
      </form>
    </AuthShell>
  );
}
