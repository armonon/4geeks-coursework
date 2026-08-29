"use client";

import { toUserMessage } from "@/lib/errors";
import { FormEvent, useEffect, useState } from "react";
import { candidatesService } from "@/services/candidates";
import type { Note } from "@/types";

interface Props {
  candidateId: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function NotesPanel({ candidateId, onError, onSuccess }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLoading(true);
      setLoadError(null);
    });
    candidatesService
      .listNotes(candidateId)
      .then((res) => {
        if (!cancelled) setNotes(res);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(toUserMessage(e, "Failed to load notes"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setAdding(true);
    try {
      const created = await candidatesService.addNote(candidateId, content);
      setNotes((prev) => [created, ...prev]);
      setDraft("");
      onSuccess("Note added");
    } catch (err) {
      onError(toUserMessage(err, "Failed to add note"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId);
    try {
      await candidatesService.deleteNote(candidateId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      onSuccess("Note deleted");
    } catch (err) {
      onError(toUserMessage(err, "Failed to delete note"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="space-y-2">
        <label
          htmlFor="note-input"
          className="block text-sm font-medium text-slate-700"
        >
          Add an internal note
        </label>
        <textarea
          id="note-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Anything the team should know — visible only to TrackFlow recruiters."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={adding || !draft.trim()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {adding ? "Saving…" : "Add note"}
          </button>
        </div>
      </form>

      <div>
        {loading && (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Loading notes…
          </div>
        )}
        {loadError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        {!loading && !loadError && notes.length === 0 && (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No notes yet.
          </div>
        )}
        {!loading && !loadError && notes.length > 0 && (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <div>
                  <p className="whitespace-pre-wrap text-slate-800">
                    {n.content}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  disabled={deletingId === n.id}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                >
                  {deletingId === n.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
