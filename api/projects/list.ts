import { requireUser } from "../../server/auth.js";
import { getBearerToken, withApi } from "../../server/http.js";
import { createSupabaseAdmin } from "../../server/supabaseAdmin.js";

export default withApi(async (req, res) => {
  const admin = createSupabaseAdmin();
  const user = await requireUser(admin, getBearerToken(req));

  const { data, error } = await admin
    .from("projects")
    .select("id,project_name,media_type,status,storage_path_original,storage_path_hd,error_message,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    res.status(500).json({ error: "projects_list_failed", message: error.message });
    return;
  }

  res.status(200).json({ projects: data ?? [] });
}, ["GET"]);
