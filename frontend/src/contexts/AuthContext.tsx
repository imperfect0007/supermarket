import type { AuthError, Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as api from "@/lib/api";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Me } from "@/types/models";

interface AuthContextValue {
  /** False if `VITE_SUPABASE_*` are missing from `frontend/.env`. */
  authConfigured: boolean;
  session: Session | null;
  profile: Me | null;
  booting: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function formatAuthError(error: AuthError): Error {
  const base = error.message || "Authentication failed";
  if (error.code === "email_not_confirmed") {
    return new Error(
      `${base} Open Supabase → Authentication → Users and confirm the user, or turn off “Confirm email” under Email provider for local dev.`
    );
  }
  if (error.code === "invalid_credentials") {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
    const ref = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "unknown";
    return new Error(
      `${base} Use the exact email/password for this Supabase project. Current frontend Supabase ref: ${ref}. If this is wrong on production, update Vercel env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), redeploy, and clear browser site data.`
    );
  }
  return new Error(base);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Me | null>(null);
  /** True until the first `getSession()` completes (avoids auth flash). */
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!supabase) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s?.access_token) {
      setProfile(null);
      return;
    }
    try {
      const me = await api.getMe(s.access_token);
      setProfile(me);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setBooting(false);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (booting) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!session?.access_token) {
        setProfile(null);
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await api.getMe(session.access_token);
        if (!cancelled) setProfile(me);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, booting]);

  const getAccessToken = useCallback(async () => {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured (add frontend/.env).");
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) throw formatAuthError(error);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured (add frontend/.env).");
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) throw formatAuthError(error);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      authConfigured: isSupabaseConfigured,
      session,
      profile,
      booting,
      loading,
      refreshProfile,
      signIn,
      signUp,
      signOut,
      getAccessToken,
    }),
    [session, profile, booting, loading, refreshProfile, signIn, signUp, signOut, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
