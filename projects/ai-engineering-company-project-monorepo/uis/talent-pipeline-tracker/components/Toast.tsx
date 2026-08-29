"use client";

import { useEffect } from "react";

export type ToastKind = "success" | "error";

export interface ToastMessage {
  kind: ToastKind;
  text: string;
}

export function Toast({
  message,
  onDismiss,
}: {
  message: ToastMessage | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  const color =
    message.kind === "success"
      ? "bg-emerald-600 text-white"
      : "bg-red-600 text-white";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-3 shadow-lg ${color}`}
    >
      {message.text}
    </div>
  );
}
