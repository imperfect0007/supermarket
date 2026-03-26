/** Shown while a lazy route chunk is loading. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 text-market-muted">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-market-terra/30 border-t-market-terra dark:border-brand-500/30 dark:border-t-brand-500"
        aria-hidden
      />
      <p className="text-sm font-medium">Loading…</p>
    </div>
  );
}
