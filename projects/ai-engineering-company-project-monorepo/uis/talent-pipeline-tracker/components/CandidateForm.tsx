"use client";

import { FormEvent, useState } from "react";
import type { Candidate, CandidateInput } from "@/types";

interface Props {
  initial?: Candidate;
  submitLabel: string;
  onSubmit: (data: CandidateInput) => Promise<void>;
  onCancel?: () => void;
}

type FieldErrors = Partial<Record<keyof CandidateInput, string>>;

export function CandidateForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [full_name, setFullName] = useState(initial?.full_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [linkedin_url, setLinkedIn] = useState(initial?.linkedin_url ?? "");
  const [cv_url, setCvUrl] = useState(initial?.cv_url ?? "");
  const [experience_years, setExperience] = useState(
    initial ? String(initial.experience_years) : ""
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!full_name.trim()) e.full_name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Invalid email format";
    if (!phone.trim()) e.phone = "Phone is required";
    if (!position.trim()) e.position = "Position is required";
    const years = Number(experience_years);
    if (experience_years === "" || Number.isNaN(years) || years < 0)
      e.experience_years = "Years of experience must be a non-negative number";
    return e;
  }

  async function handleSubmit(evt: FormEvent) {
    evt.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        full_name: full_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        linkedin_url: linkedin_url.trim() || null,
        cv_url: cv_url.trim() || null,
        experience_years: Number(experience_years),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name *" error={errors.full_name}>
          <input
            className={inputCls(!!errors.full_name)}
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field label="Email *" error={errors.email}>
          <input
            type="email"
            className={inputCls(!!errors.email)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Phone *" error={errors.phone}>
          <input
            className={inputCls(!!errors.phone)}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Position applied for *" error={errors.position}>
          <input
            className={inputCls(!!errors.position)}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </Field>
        <Field label="Years of experience *" error={errors.experience_years}>
          <input
            type="number"
            min={0}
            step="0.5"
            className={inputCls(!!errors.experience_years)}
            value={experience_years}
            onChange={(e) => setExperience(e.target.value)}
          />
        </Field>
        <Field label="LinkedIn URL">
          <input
            className={inputCls(false)}
            value={linkedin_url ?? ""}
            onChange={(e) => setLinkedIn(e.target.value)}
          />
        </Field>
        <Field label="CV URL">
          <input
            className={inputCls(false)}
            value={cv_url ?? ""}
            onChange={(e) => setCvUrl(e.target.value)}
          />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-slate-300 focus:ring-slate-400"
  }`;
}
