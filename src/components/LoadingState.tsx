export const LoadingState = ({ label = "Finding remarkable stays…" }: { label?: string }) => (
  <div className="grid min-h-64 place-items-center" role="status">
    <div className="text-center">
      <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-zinc-200 border-t-rose-500" />
      <p className="text-sm font-medium text-zinc-600">{label}</p>
    </div>
  </div>
);
