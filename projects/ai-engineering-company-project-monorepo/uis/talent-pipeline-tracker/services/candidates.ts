import { apiFetch } from "@/lib/api";
import type {
  Candidate,
  CandidateInput,
  CandidateListFilters,
  CandidateListResponse,
  CandidateStage,
  CandidateStatus,
  Note,
} from "@/types";

function buildQuery(filters: CandidateListFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.stage) params.set("stage", filters.stage);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const candidatesService = {
  list(filters: CandidateListFilters = {}): Promise<CandidateListResponse> {
    return apiFetch<CandidateListResponse>(`/records${buildQuery(filters)}`);
  },

  get(id: string): Promise<Candidate> {
    return apiFetch<Candidate>(`/records/${id}`);
  },

  create(data: CandidateInput): Promise<Candidate> {
    return apiFetch<Candidate>(`/records`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  replace(id: string, data: CandidateInput): Promise<Candidate> {
    return apiFetch<Candidate>(`/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  patch(
    id: string,
    data: { status?: CandidateStatus; stage?: CandidateStage }
  ): Promise<Candidate> {
    return apiFetch<Candidate>(`/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`/records/${id}`, { method: "DELETE" });
  },

  listNotes(id: string): Promise<Note[]> {
    return apiFetch<Note[]>(`/records/${id}/notes`);
  },

  addNote(id: string, content: string): Promise<Note> {
    return apiFetch<Note>(`/records/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  deleteNote(id: string, noteId: string): Promise<void> {
    return apiFetch<void>(`/records/${id}/notes/${noteId}`, {
      method: "DELETE",
    });
  },
};
