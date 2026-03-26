import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/lib/api";

export function AdminDashboard() {
  const { getAccessToken } = useAuth();

  const dash = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminDashboard(token);
    },
  });

  const chart = useQuery({
    queryKey: ["admin", "orders-per-day"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminOrdersDaily(token);
    },
  });

  const low = useQuery({
    queryKey: ["admin", "low-stock"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminLowStock(token);
    },
  });

  const d = dash.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Admin dashboard</h1>
        <p className="text-sm text-market-muted dark:text-stone-400">Overview for your mini supermarket.</p>
      </div>

      {dash.isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      ) : d ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">Users</p>
            <p className="mt-2 font-display text-3xl font-bold text-market-ink dark:text-white">{d.total_users}</p>
          </div>
          <div className="card-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">Orders</p>
            <p className="mt-2 font-display text-3xl font-bold text-market-ink dark:text-white">{d.total_orders}</p>
          </div>
          <div className="card-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">Revenue (delivered)</p>
            <p className="mt-2 font-display text-3xl font-bold text-market-terra dark:text-brand-400">
              ${d.revenue_delivered.toFixed(2)}
            </p>
          </div>
        </div>
      ) : null}

      {low.data && low.data.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-bold">Low stock alert</p>
          <p className="mt-1">
            {low.data.length} product(s) below threshold — open Inventory to restock.
          </p>
          <ul className="mt-2 list-inside list-disc">
            {low.data.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.name} ({p.stock} left)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card-elevated p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-market-ink dark:text-white">
          Orders per day (14d)
        </h2>
        <div className="mt-4 h-64 w-full">
          {chart.data && chart.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-zinc-500">No data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
