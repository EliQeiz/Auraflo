import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

export function createSupabaseAdmin() {
  const env = getServerEnv();

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type SupabaseAdminClient = ReturnType<typeof createSupabaseAdmin>;
