"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextValue = {
  user: User | null;
  authReady: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authReady: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    let knownUserId: string | null | undefined;
    void supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      knownUserId = sessionUser?.id ?? null;
      setUser(sessionUser);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // A recovery link signs the user in wherever it lands — which is the site root
      // whenever Supabase falls back to the Site URL (an emailed redirect_to that isn't
      // on the dashboard's Redirect URLs allowlist is ignored). Without this the user is
      // silently logged in and never shown the form that actually changes the password.
      if (event === "PASSWORD_RECOVERY") router.push("/auth/reset");
      const nextUser = session?.user ?? null;
      const nextUserId = nextUser?.id ?? null;
      if (nextUserId === knownUserId) return;
      knownUserId = nextUserId;
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return <AuthContext.Provider value={{ user, authReady, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
