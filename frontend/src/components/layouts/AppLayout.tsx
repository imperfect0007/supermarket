import { Link, NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const navCls = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-market-terra text-white shadow-md shadow-market-terra/25 dark:bg-brand-500 dark:shadow-brand-500/20"
      : "text-market-muted hover:bg-white/80 hover:text-market-ink dark:text-stone-400 dark:hover:bg-stone-800/80 dark:hover:text-stone-100"
  );

export function AppLayout() {
  const { authConfigured, session, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="surface-page">
      <div className="mesh-bg" aria-hidden />
      {!authConfigured ? (
        <div
          className="border-b border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3 text-center text-sm text-amber-950 dark:border-amber-900/50 dark:from-amber-950 dark:to-orange-950/50 dark:text-amber-100"
          role="status"
        >
          <strong>Supabase env missing.</strong> Copy{" "}
          <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/60">
            frontend/.env.example
          </code>{" "}
          to{" "}
          <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/60">
            frontend/.env
          </code>{" "}
          and set URL + anon key, then restart{" "}
          <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/60">
            npm run dev
          </code>
          .
        </div>
      ) : null}

      <header className="sticky top-0 z-50 border-b border-market-sand/60 bg-market-paper/75 backdrop-blur-xl dark:border-stone-800/80 dark:bg-market-warm/80">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-market-terra/30 to-transparent dark:via-brand-500/30" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-3 font-display text-xl font-semibold tracking-tight text-market-ink dark:text-stone-100"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-market-terra to-market-terradark text-lg shadow-lg shadow-market-terra/25 transition group-hover:scale-105 dark:from-brand-500 dark:to-brand-600 dark:shadow-brand-500/20"
              aria-hidden
            >
              🌿
            </span>
            <span className="flex flex-col leading-tight">
              FreshMart
              <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-market-muted dark:text-stone-500">
                Daily goods
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-1 sm:order-none sm:w-auto sm:justify-start">
            <NavLink to="/" end className={navCls}>
              Shop
            </NavLink>
            {session && (
              <>
                <NavLink to="/cart" className={navCls}>
                  Cart
                </NavLink>
                <NavLink to="/orders" className={navCls}>
                  Orders
                </NavLink>
                <NavLink to="/addresses" className={navCls}>
                  Addresses
                </NavLink>
              </>
            )}
            {profile?.role === "admin" && (
              <>
                <span className="mx-1 hidden h-5 w-px bg-market-sand sm:block dark:bg-stone-700" aria-hidden />
                <NavLink to="/admin" end className={navCls}>
                  Admin
                </NavLink>
                <NavLink to="/admin/inventory" className={navCls}>
                  Stock
                </NavLink>
                <NavLink to="/admin/orders" className={navCls}>
                  All orders
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="btn-ghost rounded-full !px-3"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
            {session ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full bg-market-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-200 dark:text-market-ink dark:hover:bg-white"
              >
                Log out
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-market-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 dark:bg-stone-200 dark:text-market-ink dark:hover:bg-white"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-market-sand/60 py-8 text-center dark:border-stone-800">
        <p className="font-display text-sm font-medium text-market-muted dark:text-stone-500">
          FreshMart · Groceries with care
        </p>
      </footer>
    </div>
  );
}
