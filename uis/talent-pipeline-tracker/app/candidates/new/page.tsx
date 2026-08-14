"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CandidateForm } from "@/components/CandidateForm";
import { Toast, ToastMessage } from "@/components/Toast";
import { candidatesService } from "@/services/candidates";

export default function NewCandidatePage() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-600 hover:underline">
        ← Back to candidates
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Register a new candidate
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Use this form to add a candidate whose application came in outside the
          standard channel.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <CandidateForm
          submitLabel="Register candidate"
          onCancel={() => router.push("/")}
          onSubmit={async (data) => {
            try {
              const created = await candidatesService.create(data);
              setToast({
                kind: "success",
                text: `Registered ${created.full_name}`,
              });
              router.push(`/candidates/${created.id}`);
            } catch (e) {
              setToast({
                kind: "error",
                text:
                  e instanceof Error
                    ? e.message
                    : "Failed to register candidate",
              });
            }
          }}
        />
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
