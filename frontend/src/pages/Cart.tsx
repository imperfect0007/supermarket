import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";

export function Cart() {
  const { getAccessToken } = useAuth();
  const qc = useQueryClient();

  const cartQ = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.getCart(token);
    },
  });

  const patchLine = useMutation({
    mutationFn: async ({ id, qty }: { id: string; qty: number }) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.patchCartLine(token, id, qty);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const removeLine = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.removeCartLine(token, id);
    },
    onSuccess: () => {
      toast.success("Removed from basket");
      void qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [addressId, setAddressId] = useState<string | "">("");

  const addrQ = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.getAddresses(token);
    },
  });

  const checkout = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.placeOrder(token, addressId || null);
    },
    onSuccess: (order) => {
      toast.success(`Order placed: ${order.id.slice(0, 8)}…`);
      void qc.invalidateQueries({ queryKey: ["cart"] });
      void qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lines = cartQ.data ?? [];
  const subtotal = lines.reduce((s, l) => s + Number(l.price) * l.quantity, 0);

  if (cartQ.isLoading) {
    return (
      <div className="card-elevated animate-pulse space-y-4 p-8">
        <div className="h-8 w-40 rounded-full bg-market-sand dark:bg-stone-800" />
        <div className="h-32 rounded-3xl bg-market-sand/80 dark:bg-stone-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Your basket</h1>
        <p className="mt-1 text-sm text-market-muted dark:text-stone-400">Review quantities before checkout.</p>
      </div>
      {lines.length === 0 ? (
        <div className="card-elevated p-10 text-center">
          <p className="text-market-muted dark:text-stone-400">
            Your basket is empty.{" "}
            <Link to="/" className="font-semibold text-market-terra underline-offset-4 hover:underline dark:text-brand-400">
              Browse the shop
            </Link>
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-market-sand/80 bg-market-sand/30 text-left text-xs font-bold uppercase tracking-wider text-market-muted dark:border-stone-800 dark:bg-stone-800/50 dark:text-stone-400">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Qty</th>
                <th className="px-5 py-4">Line</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-market-sand/60 dark:divide-stone-800">
              {lines.map((l) => (
                <tr key={l.id} className="bg-white/50 dark:bg-transparent">
                  <td className="px-5 py-4 font-semibold text-market-ink dark:text-white">{l.name}</td>
                  <td className="px-5 py-4 text-market-muted dark:text-stone-400">${Number(l.price).toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <input
                      type="number"
                      min={1}
                      max={l.stock}
                      defaultValue={l.quantity}
                      className="w-16 rounded-xl border border-market-sand bg-white px-2 py-1.5 text-center dark:border-stone-700 dark:bg-stone-900"
                      onBlur={(e) => {
                        const q = Number(e.target.value);
                        if (!Number.isFinite(q) || q < 1) return;
                        patchLine.mutate({ id: l.id, qty: q });
                      }}
                    />
                  </td>
                  <td className="px-5 py-4 font-display font-bold tabular-nums text-market-terra dark:text-brand-400">
                    ${(Number(l.price) * l.quantity).toFixed(2)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeLine.mutate(l.id)}
                      className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lines.length > 0 && (
        <div className="card-elevated flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
              Delivery address
            </p>
            <select
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
              className="input-market mt-2 max-w-md"
            >
              <option value="">None (optional)</option>
              {(addrQ.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {(a.label ?? "Address") + " — " + a.address_text.slice(0, 48)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-market-muted dark:text-stone-500">
              Manage on{" "}
              <Link to="/addresses" className="font-semibold text-market-terra hover:underline dark:text-brand-400">
                Addresses
              </Link>
              .
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-market-muted dark:text-stone-400">Total</p>
            <p className="font-display text-3xl font-bold tabular-nums text-market-ink dark:text-white">
              ${subtotal.toFixed(2)}
            </p>
            <button
              type="button"
              disabled={checkout.isPending}
              onClick={() => checkout.mutate()}
              className="btn-primary mt-4 min-w-[10rem]"
            >
              {checkout.isPending ? "Placing…" : "Place order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
