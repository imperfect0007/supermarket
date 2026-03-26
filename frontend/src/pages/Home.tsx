import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/ProductGridSkeleton";
import * as api from "@/lib/api";
import type { Category } from "@/types/models";

const CATEGORIES: (Category | "All")[] = ["All", "Vegetables", "Fruits", "Dairy", "Snacks"];

export function Home() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const pageSize = 8;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debounced || undefined,
      category: category === "All" ? undefined : category,
    }),
    [page, pageSize, debounced, category]
  );

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => api.getProducts(queryParams),
    placeholderData: keepPreviousData,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Hero */}
      <section className="card-elevated overflow-hidden p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-market-terralight px-3 py-1 font-sans text-xs font-bold uppercase tracking-[0.15em] text-market-terradark dark:bg-brand-900/40 dark:text-brand-100">
              <span className="h-1.5 w-1.5 rounded-full bg-market-terra dark:bg-brand-400" />
              Curated aisles
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-market-ink dark:text-stone-50 md:text-5xl">
              Groceries that
              <span className="text-market-terra dark:text-brand-400"> feel like Sunday</span> morning.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-market-muted dark:text-stone-400">
              Search the shelf, filter by aisle, and fill your cart. Checkout keeps stock honest on the server —
              Supabase + FastAPI under the hood.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 rounded-3xl bg-gradient-to-br from-market-sage/15 via-market-cream to-market-citrus/10 p-6 dark:from-stone-800 dark:via-stone-900 dark:to-stone-800">
            <p className="font-display text-4xl font-bold text-market-sage dark:text-market-sagemuted">
              {data?.total ?? "—"}
            </p>
            <p className="text-sm font-medium text-market-muted dark:text-stone-400">lines on the shelf</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-market-sand dark:bg-stone-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-market-terra via-market-citrus to-market-sage dark:from-brand-500 dark:via-amber-500 dark:to-emerald-600"
                style={{ width: data?.total ? `${Math.min(100, (data.items.length / Math.max(data.total, 1)) * 100)}%` : "36%" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative flex-1 max-w-lg">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Find on the shelf
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-market-muted/70 dark:text-stone-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Apples, milk, chips…"
              className="input-market !py-3.5 !pl-12"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                category === c
                  ? "bg-market-ink text-white shadow-md ring-2 ring-market-ink ring-offset-2 ring-offset-market-cream dark:bg-white dark:text-market-ink dark:ring-white dark:ring-offset-market-ink"
                  : "bg-white/80 text-market-muted shadow-sm hover:bg-white hover:text-market-ink dark:bg-stone-800/80 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {(error as Error).message}
        </div>
      )}

      {isFetching && !data ? (
        <ProductGridSkeleton />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data?.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {isFetching && data ? (
        <p className="text-center text-xs font-medium text-market-muted dark:text-stone-500">Refreshing shelves…</p>
      ) : null}

      <nav
        aria-label="Pagination"
        className="flex items-center justify-between rounded-3xl border border-market-sand/80 bg-white/60 px-4 py-4 dark:border-stone-800 dark:bg-stone-900/50 sm:px-6"
      >
        <button
          type="button"
          disabled={page <= 1 || isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-2xl border border-market-sand bg-white px-4 py-2.5 text-sm font-semibold text-market-ink transition hover:border-market-terra/40 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-600"
        >
          ← Previous
        </button>
        <span className="text-sm font-medium text-market-muted dark:text-stone-400">
          Page <span className="text-market-ink dark:text-white">{page}</span> of {totalPages}
          {data ? (
            <span className="text-market-muted/80 dark:text-stone-500"> · {data.total} products</span>
          ) : null}
        </span>
        <button
          type="button"
          disabled={page >= totalPages || isFetching}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-2xl border border-market-sand bg-white px-4 py-2.5 text-sm font-semibold text-market-ink transition hover:border-market-terra/40 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-600"
        >
          Next →
        </button>
      </nav>
    </div>
  );
}
