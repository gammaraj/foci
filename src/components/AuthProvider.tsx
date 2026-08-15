"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isAuthLockError } from "@/lib/supabase/auth-errors";
import {
  activateSupabaseStorage,
  activateLocalStorage,
  hasOfflineCache,
  hasLocalWorkspaceSnapshot,
} from "@/lib/storage";

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
const AUTH_INIT_TIMEOUT_MS = 5_000;

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

/**
 * Prefer the cached Supabase adapter whenever we still have a session, or
 * when a warm offline/local snapshot exists — so tasks can paint without waiting
 * on auth/network (slow mobile data).
 */
async function ensureOfflineCapableStorage(sessionUser: User | null) {
  const offline =
    typeof navigator !== "undefined" && navigator.onLine === false;

  if (sessionUser || hasOfflineCache() || (offline && hasLocalWorkspaceSnapshot())) {
    await activateSupabaseStorage();
  } else {
    // Keep foci_cache_* intact — only explicit logout clears it.
    activateLocalStorage();
  }
}

async function applyAuthState(
  sessionUser: User | null,
  setUser: (u: User | null) => void,
  setLoading: (v: boolean) => void,
) {
  try {
    await ensureOfflineCapableStorage(sessionUser);
  } catch (err) {
    console.error("[Foci] Storage activation failed:", err);
  }
  setUser(sessionUser);
  setLoading(false);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;

    // Warm cache: install cache-first adapter immediately so TaskList can
    // reconcile without waiting on getSession (often slow on mobile data).
    if (hasOfflineCache()) {
      void activateSupabaseStorage().catch((err) => {
        console.warn("[Foci] Early cache adapter activate failed:", err);
      });
    }

    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("[Foci] Auth init timed out; continuing with offline/guest storage");
        // Never wipe foci_cache_* here — that is what keeps tasks available offline.
        void ensureOfflineCapableStorage(null)
          .catch(() => activateLocalStorage())
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      }
    }, AUTH_INIT_TIMEOUT_MS);

    (async () => {
      const { session, error } = await getSessionWithLockRetry(supabase);

      if (cancelled) return;

      if (error && !isAuthLockError(error)) {
        console.error("[Foci] Auth initialization error:", error);
      } else if (error && isAuthLockError(error)) {
        console.warn("[Foci] Auth lock busy; using auth state event or guest mode");
      }

      void applyAuthState(session?.user ?? null, setUser, setLoading);
      clearTimeout(safetyTimeout);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      void applyAuthState(session?.user ?? null, setUser, setLoading);
      clearTimeout(safetyTimeout);
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    activateLocalStorage({ clearCache: true });
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
