import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function Register() {
  const { session, booting, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  if (booting) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-display text-market-muted dark:text-stone-500">
        Loading…
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="card-elevated relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-end">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-market-ink/90 via-market-ink/30 to-transparent dark:from-stone-950/95" />
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579113800032-c38cbd763dbf?w=800&q=80')] bg-cover bg-center"
          aria-hidden
        />
        <div className="relative z-10">
          <p className="font-display text-3xl font-semibold leading-tight text-white">Join the morning queue.</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
            New signups get a profile row in <code className="rounded bg-white/20 px-1">public.users</code> automatically.
          </p>
        </div>
      </div>

      <div className="card-elevated p-8 sm:p-10">
        <div>
          <h1 className="font-display text-3xl font-semibold text-market-ink dark:text-white">Create account</h1>
          <p className="mt-2 text-sm text-market-muted dark:text-stone-400">
            Choose a strong password. We will sync your profile with the backend.
          </p>
        </div>
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setPending(true);
            void signUp(email, password)
              .then(() => toast.success("Check your email if confirmation is required, then log in."))
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-market mt-2"
            />
          </label>
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Creating…" : "Sign up"}
          </button>
        </form>
        <p className="mt-8 text-center text-sm text-market-muted dark:text-stone-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-market-terra underline-offset-4 hover:underline dark:text-brand-400">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
