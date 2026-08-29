"use client";

import { useState } from "react";
import {
  BRANCHES,
  BRANCH_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  IncidentFieldError,
  ORIGINS,
  ORIGIN_LABELS,
  createIncident,
  type Incident,
  type IncidentBranch,
  type IncidentCategory,
  type IncidentOrigin,
} from "@/lib/incidents";

/**
 * Incident registration form.
 *
 * Sized for warehouse terminals: large touch targets, dropdowns over
 * free text wherever CONTEXT defines a closed value set.
 */
export function IncidentForm({
  onCreated,
}: {
  onCreated?: (incident: Incident) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("lost_parcel");
  const [origin, setOrigin] = useState<IncidentOrigin>("branch");
  // CONTEXT: use `central` when the report is not tied to a facility.
  const [branch, setBranch] = useState<IncidentBranch>("central");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // CONTEXT: when the origin is `branch`, the reporter is at a specific
  // facility — highlight the field so they don't leave it on Central.
  const branchIsSignificant = origin === "branch";

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Give the incident a short title.";
    else if (title.trim().length > 120)
      errs.title = "Keep the title to 120 characters or fewer.";
    if (!description.trim())
      errs.description = "Describe what happened so the team can act on it.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const created = await createIncident({
        title: title.trim(),
        description: description.trim(),
        category,
        origin,
        branch,
      });
      // Clear the form and confirm, per the brief.
      setTitle("");
      setDescription("");
      setSuccess(`Incident #${created.id} registered.`);
      onCreated?.(created);
    } catch (err) {
      if (err instanceof IncidentFieldError) {
        // The API named the field — show it next to that input.
        setFieldErrors({ [err.field]: err.message });
      } else {
        setFormError(
          err instanceof Error
            ? "We couldn't register that incident. Please try again."
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
        >
          {formError}
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

      <Field label="Title *" error={fieldErrors.title}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={140}
          className={inputCls(!!fieldErrors.title)}
          placeholder="Parcel missing from the outbound bay"
        />
      </Field>

      <Field label="Description *" error={fieldErrors.description}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={inputCls(!!fieldErrors.description)}
          placeholder="What happened, where, and when?"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category *" error={fieldErrors.category}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IncidentCategory)}
            className={selectCls(!!fieldErrors.category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Origin *" error={fieldErrors.origin}>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value as IncidentOrigin)}
            className={selectCls(!!fieldErrors.origin)}
          >
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {ORIGIN_LABELS[o]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Always visible and required. Highlighted when origin=branch. */}
      <div
        className={
          branchIsSignificant
            ? "rounded-md border-2 border-slate-900 bg-slate-50 p-4"
            : "rounded-md border border-transparent p-4"
        }
        data-testid="branch-field"
        data-highlighted={branchIsSignificant ? "true" : "false"}
      >
        <Field label="Branch *" error={fieldErrors.branch}>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as IncidentBranch)}
            className={selectCls(!!fieldErrors.branch)}
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {BRANCH_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
        {branchIsSignificant && (
          <p className="mt-2 text-xs font-medium text-slate-700">
            You&apos;re reporting from a specific location — pick the
            facility this incident happened at.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Registering…" : "Register incident"}
      </button>
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
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

// Generous vertical padding: these are used on warehouse-floor terminals.
function inputCls(hasError: boolean): string {
  return `w-full rounded-md border px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-slate-300 focus:ring-slate-400"
  }`;
}

function selectCls(hasError: boolean): string {
  return `${inputCls(hasError)} bg-white`;
}
