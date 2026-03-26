/** Loading skeleton grid for catalog pagination. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-3xl border border-market-sand/60 bg-white/70 dark:border-stone-800 dark:bg-stone-900/50"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-market-sand to-market-sage/10 dark:from-stone-800 dark:to-stone-900" />
          <div className="space-y-4 p-5">
            <div className="h-5 w-3/4 rounded-full bg-market-sand dark:bg-stone-700" />
            <div className="h-8 w-1/2 rounded-full bg-market-sand/80 dark:bg-stone-800" />
            <div className="h-11 rounded-2xl bg-market-sand dark:bg-stone-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
