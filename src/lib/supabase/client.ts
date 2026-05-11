import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const _supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!_supabaseUrl || !_supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
  );
}

const supabaseUrl: string = _supabaseUrl;
const supabaseAnonKey: string = _supabaseAnonKey;

// Singleton client to prevent multiple instances competing for locks
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (clientInstance) {
    return clientInstance;
  }

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Use PKCE flow for better security
      flowType: 'pkce',
      // Detect session in URL (for OAuth callbacks)
      detectSessionInUrl: true,
      // Persist session in localStorage
      persistSession: true,
      // Storage key to isolate from other apps
      storageKey: 'foci-auth',
    },
  });

  return clientInstance;
}
