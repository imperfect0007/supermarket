import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatOrderStatus } from "@/lib/format";
import * as api from "@/lib/api";

const STATUSES = ["pending", "delivered", "cancelled"] as const;

export function AdminOrders() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminListOrders(token);
    },
  });

  const patch = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminPatchOrderStatus(token, id, status);
    },
    onSuccess: () => {
      toast.success("Status updated");
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">All orders</h1>
        <p className="text-sm text-market-muted dark:text-stone-400">Update fulfillment status.</p>
      </div>

      <div className="card-elevated overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-market-sand/80 bg-market-sand/30 text-left text-xs font-bold uppercase tracking-wider text-market-muted dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-market-sand/60 dark:divide-stone-800">
            {(q.data ?? []).map((o) => (
              <tr key={o.id} className="bg-white/40 dark:bg-transparent">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-market-muted dark:text-stone-500">{o.id}</td>
                <td className="px-4 py-3 font-mono text-xs text-market-muted dark:text-stone-500">{o.user_id}</td>
                <td className="px-4 py-3 font-semibold text-market-ink dark:text-white">
                  ${Number(o.total_price).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => patch.mutate({ id: o.id, status: e.target.value })}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {formatOrderStatus(s)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
