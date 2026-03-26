import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { formatOrderStatus } from "@/lib/format";
import * as api from "@/lib/api";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-900",
    delivered:
      "bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-100 dark:ring-emerald-900",
    cancelled:
      "bg-red-100 text-red-950 ring-1 ring-red-200/80 dark:bg-red-950/50 dark:text-red-100 dark:ring-red-900",
  };
  return map[status] ?? "bg-market-sand text-market-muted dark:bg-stone-800 dark:text-stone-300";
}

export function Orders() {
  const { getAccessToken } = useAuth();

  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.getMyOrders(token);
    },
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-full bg-market-sand dark:bg-stone-800" />
        <div className="h-36 animate-pulse rounded-3xl bg-market-sand/80 dark:bg-stone-800" />
      </div>
    );
  }

  const orders = q.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Your orders</h1>
        <p className="mt-1 text-sm text-market-muted dark:text-stone-400">Receipts and delivery details.</p>
      </div>
      {orders.length === 0 ? (
        <div className="card-elevated p-10 text-center text-market-muted dark:text-stone-400">No orders yet.</div>
      ) : (
        <ul className="space-y-5">
          {orders.map((o) => (
            <li key={o.id} className="card-elevated p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-market-muted dark:text-stone-500">{o.id}</p>
                  <p className="mt-1 text-sm text-market-muted dark:text-stone-400">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge(o.status)}`}
                >
                  {formatOrderStatus(o.status)}
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-bold text-market-ink dark:text-white">
                ${Number(o.total_price).toFixed(2)}
              </p>
              {o.delivery_address_text ? (
                <p className="mt-2 text-xs text-market-muted dark:text-stone-500">
                  Deliver to: {o.delivery_address_text}
                </p>
              ) : null}
              <ul className="mt-4 space-y-2 border-t border-market-sand/80 pt-4 text-sm dark:border-stone-800">
                {o.items.map((it) => (
                  <li key={it.id} className="flex justify-between text-market-muted dark:text-stone-400">
                    <span>
                      {it.product_name ?? "Product"} × {it.quantity}
                    </span>
                    <span className="font-medium tabular-nums text-market-ink dark:text-stone-200">
                      ${(Number(it.unit_price) * it.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
