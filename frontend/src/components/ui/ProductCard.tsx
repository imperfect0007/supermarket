import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";
import type { Product } from "@/types/models";

export function ProductCard({ product }: { product: Product }) {
  const { session, getAccessToken } = useAuth();
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("Login required");
      return api.upsertCart(token, product.id, 1);
    },
    onSuccess: () => {
      toast.success("Added to your basket");
      void qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const out = product.stock <= 0;

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-3xl border border-market-sand/90 bg-market-card shadow-soft transition duration-300 hover:-translate-y-1 hover:border-market-terra/25 hover:shadow-lift dark:border-stone-800 dark:bg-stone-900/90 dark:hover:border-brand-500/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-market-sand/50 to-market-sage/10 dark:from-stone-800 dark:to-stone-900">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-market-muted/60 dark:text-stone-600">
            <span className="text-3xl opacity-50" aria-hidden>
              🧺
            </span>
            <span className="text-xs font-medium">No photo yet</span>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-market-sage shadow-sm backdrop-blur-sm dark:bg-stone-900/90 dark:text-market-sagemuted">
            {product.category}
          </span>
        </div>
        {out && (
          <span className="absolute right-3 top-3 rounded-full bg-market-ink/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug text-market-ink dark:text-stone-100">
          {product.name}
        </h3>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-bold tabular-nums text-market-terra dark:text-brand-400">
              ${Number(product.price).toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-market-muted dark:text-stone-500">
              {product.stock} in stock
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={out || add.isPending}
          onClick={() => {
            if (!session) {
              toast.message("Sign in to add items to your basket");
              return;
            }
            add.mutate();
          }}
          className="btn-primary mt-5 w-full"
        >
          {add.isPending ? "Adding…" : out ? "Unavailable" : "Add to basket"}
        </button>
      </div>
    </article>
  );
}
