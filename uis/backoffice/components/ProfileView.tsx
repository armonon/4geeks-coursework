"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { updateMyProfile } from "@/lib/auth";

/**
 * /account/profile
 *
 * Email and role come from `User` (via GET /auth/me); name, phone, and
 * address come from the linked `Profile` and are edited through
 * PUT /profiles/me. Both calls carry the bearer token.
 */
export function ProfileView() {
  const { user, refresh } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the form once the session is known.
  useEffect(() => {
    if (!user?.profile) return;
    setName(user.profile.name ?? "");
    setPhone(user.profile.phone ?? "");
    setAddress(user.profile.address ?? "");
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateMyProfile({
        name: name.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      // Re-read /auth/me so the header and this form reflect the server.
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          My profile
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Your sign-in email is part of your account and is managed
          separately. Name and contact details live on your profile and
          can be edited here.
        </p>
      </div>

      {/* Credentials — from User */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Account
        </h3>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Email
            </dt>
            <dd className="mt-0.5 text-slate-900" data-testid="profile-email">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">
              Role
            </dt>
            <dd className="mt-0.5">
              <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {user.role}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Profile — editable */}
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Contact details
        </h3>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}
        {saved && (
          <div
            role="status"
            className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            Profile updated.
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">
            Full name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            placeholder="Carlos Vega"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder="+34 976 000 000"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputCls}
            placeholder="Zaragoza, ES"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400";
