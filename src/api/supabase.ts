import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before connecting to live data.",
  );
}

export const supabase = createClient(supabaseUrl || "http://127.0.0.1:54321", supabaseAnonKey || "local-dev-anon-key", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
