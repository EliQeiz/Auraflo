import { requireUser } from "../../server/auth.js";
import { getBearerToken, withApi } from "../../server/http.js";
import { createSupabaseAdmin } from "../../server/supabaseAdmin.js";

export default withApi(async (req, res) => {
  const admin = createSupabaseAdmin();
  const user = await requireUser(admin, getBearerToken(req));
  const id = Array.isArray(req.query?.id) ? req.query?.id[0] : req.query?.id;

  if (!id) {
    res.status(400).json({ error: "missing_project_id", message: "Provide ?id=<project-id>." });
    return;
  }

  const { data: project, error: projectError } = await admin
    .from("projects")
    .select("id,project_name,media_type,status,storage_path_original,storage_path_hd,error_message,created_at,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    res.status(404).json({ error: "project_not_found", message: "Project not found." });
    return;
  }

  const [{ data: jobs }, { data: frames }] = await Promise.all([
    admin
      .from("processing_jobs")
      .select("id,project_id,job_type,status,result,queued_at,started_at,completed_at")
      .eq("project_id", id)
      .order("queued_at", { ascending: false }),
    admin
      .from("frame_assets")
      .select("id,project_id,frame_index,thumbnail_path,enhanced_path,detections,created_at")
      .eq("project_id", id)
      .order("frame_index", { ascending: true })
      .limit(100),
  ]);

  res.status(200).json({ project, jobs: jobs ?? [], frames: frames ?? [] });
}, ["GET"]);
