"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isAuthLockError } from "@/lib/supabase/auth-errors";
import { activateSupabaseStorage, activateLocalStorage } from "@/lib/storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const LOCK_RETRY_ATTEMPTS = 4;
const LOCK_RETRY_BASE_MS = 150;

async function getSessionWithLockRetry(
  supabase: ReturnType<typeof createClient>,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < LOCK_RETRY_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error && isAuthLockError(error)) {
        lastError = error;
        await new Promise((r) => setTimeout(r, LOCK_RETRY_BASE_MS * (attempt + 1)));
        continue;
      }
      return { session: data.session, error };
    } catch (err) {
      if (isAuthLockError(err)) {
        lastError = err;
        await new Promise((r) => setTimeout(r, LOCK_RETRY_BASE_MS * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  return { session: null, error: lastError };
}

async function resolveUser(
  supabase: ReturnType<typeof createClient>,
  sessionUser: User | null,
): Promise<User | null> {
  if (!sessionUser) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) return user;
    if (error && !isAuthLockError(error)) {
      console.error("[Foci] Session validation failed:", error);
    }
  } catch (err) {
    if (!isAuthLockError(err)) {
      console.error("[Foci] Session validation error:", err);
    }
  }

  return sessionUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { session, error } = await getSessionWithLockRetry(supabase);

      if (cancelled) return;

      if (error && !isAuthLockError(error)) {
        console.error("[Foci] Auth initialization error:", error);
      } else if (error && isAuthLockError(error)) {
        console.warn("[Foci] Auth lock busy; waiting for auth state event");
      }

      const currentUser = await resolveUser(supabase, session?.user ?? null);
      if (cancelled) return;

      setUser(currentUser);
      if (currentUser) {
        await activateSupabaseStorage();
      } else {
        activateLocalStorage();
      }
      setLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = await resolveUser(supabase, session?.user ?? null);
      setUser(currentUser);
      if (currentUser) {
        await activateSupabaseStorage();
      } else {
        activateLocalStorage();
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    activateLocalStorage();
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
