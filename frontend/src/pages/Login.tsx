import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function Login() {
  const { session, booting, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/";
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
  const supabaseRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "not-set";
  const apiUrl = (import.meta.env.VITE_API_URL ?? "").trim() || "not-set";

  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-display text-market-muted dark:text-stone-500">
        Loading…
      </div>
    );
  }

  if (session) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="card-elevated relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-end">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-market-ink/90 via-market-ink/20 to-transparent dark:from-stone-950/95" />
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80')] bg-cover bg-center"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="font-display text-3xl font-semibold leading-tight text-white">Welcome back to the market.</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
            Your basket and orders sync securely with Supabase — sign in to continue.
          </p>
        </div>
      </div>

      <div className="card-elevated p-8 sm:p-10">
        <div>
          <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Log in</h1>
          <p className="mt-2 text-sm text-market-muted dark:text-stone-400">Email and password from your Supabase account.</p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Env check: Supabase ref <code className="font-mono">{supabaseRef}</code> | API{" "}
            <code className="font-mono">{apiUrl}</code>
          </p>
          {import.meta.env.DEV ? (
            <p className="mt-3 rounded-lg border border-market-terra/20 bg-market-cream/50 px-3 py-2 text-xs leading-relaxed text-market-ink/90 dark:border-brand-500/25 dark:bg-stone-900/40 dark:text-stone-300">
              <strong className="font-semibold">Local dev:</strong> after{" "}
              <code className="rounded bg-white/80 px-1 font-mono dark:bg-stone-800">python scripts/seed_dev_admin.py</code> in{" "}
              <code className="rounded bg-white/80 px-1 font-mono dark:bg-stone-800">backend/</code>, sign in as{" "}
              <span className="font-mono">admin@admin.com</span> / <span className="font-mono">admin@12</span>.{" "}
              <span className="text-market-muted dark:text-stone-500">
                Frontend <code className="font-mono">VITE_SUPABASE_URL</code> must be the same project as{" "}
                <code className="font-mono">backend/.env</code> <code className="font-mono">SUPABASE_URL</code>.
              </span>
            </p>
          ) : null}
        </div>
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
            void signIn(email, password)
              .then(() => toast.success("Welcome back"))
              .catch((err: Error) => toast.error(err.message))
              .finally(() => setPending(false));
          }}
        >
          <label className="block text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-market mt-2"
            />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-market-muted dark:text-stone-500">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-market mt-2"
            />
          </label>
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-market-muted dark:text-stone-400">
          No account?{" "}
          <Link to="/register" className="font-semibold text-market-terra underline-offset-4 hover:underline dark:text-brand-400">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
