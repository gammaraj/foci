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

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
