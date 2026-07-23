import { ApiError } from "./http";
import type { SupabaseAdminClient } from "./supabaseAdmin";

export async function requireUser(admin: SupabaseAdminClient, token: string) {
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    throw new ApiError(401, "invalid_authorization", "The supplied Supabase session is invalid or expired.");
  }

  return data.user;
}
