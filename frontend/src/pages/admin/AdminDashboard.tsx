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
import { Link } from "react-router-dom";
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

  const orders = useQuery({
    queryKey: ["admin", "orders", "recent"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return api.adminListOrders(token);
    },
  });

  const d = dash.data;
  const recentOrders = (orders.data ?? []).slice(0, 6);
  const pendingCount = (orders.data ?? []).filter((o) => o.status === "pending").length;
  const deliveredCount = (orders.data ?? []).filter((o) => o.status === "delivered").length;
  const cancelledCount = (orders.data ?? []).filter((o) => o.status === "cancelled").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Admin dashboard</h1>
        <p className="text-sm text-market-muted dark:text-stone-400">Overview for your mini supermarket.</p>
      </div>

      {dash.isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      ) : d ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="card-elevated p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
              Low stock items
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
              {d.low_stock_count}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-elevated p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
        </div>
        <div className="card-elevated p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">Delivered</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{deliveredCount}</p>
        </div>
        <div className="card-elevated p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{cancelledCount}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/inventory" className="card-elevated p-5 transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Quick action
          </p>
          <h3 className="mt-1 text-lg font-semibold text-market-ink dark:text-white">Manage inventory</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Add, edit, and remove products.</p>
        </Link>
        <Link to="/admin/orders" className="card-elevated p-5 transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Quick action
          </p>
          <h3 className="mt-1 text-lg font-semibold text-market-ink dark:text-white">Review orders</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Update pending orders quickly.</p>
        </Link>
        <Link to="/" className="card-elevated p-5 transition hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Quick action
          </p>
          <h3 className="mt-1 text-lg font-semibold text-market-ink dark:text-white">Open storefront</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Check customer view instantly.</p>
        </Link>
      </div>

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

      <div className="card-elevated p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-market-ink dark:text-white">Recent orders</h2>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            View all
          </Link>
        </div>
        {orders.isLoading ? (
          <div className="mt-4 h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ) : recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-zinc-500">{o.id}</p>
                  <p className="text-xs text-zinc-500">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-market-ink dark:text-white">
                    ${Number(o.total_price).toFixed(2)}
                  </p>
                  <p className="text-xs capitalize text-zinc-600 dark:text-zinc-400">{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
