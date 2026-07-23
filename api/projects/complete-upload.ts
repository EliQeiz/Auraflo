import { requireUser } from "../../server/auth";
import { enqueueJob } from "../../server/jobs";
import { getBearerToken, parseBody, withApi } from "../../server/http";
import { defaultJobsForMedia } from "../../server/projects";
import { completeUploadSchema } from "../../server/schemas";
import { createSupabaseAdmin } from "../../server/supabaseAdmin";

export default withApi(async (req, res) => {
  const admin = createSupabaseAdmin();
  const user = await requireUser(admin, getBearerToken(req));
  const input = completeUploadSchema.parse(parseBody(req));

  const { data: project, error } = await admin
    .from("projects")
    .update({ status: "staging", updated_at: new Date().toISOString() })
    .eq("id", input.projectId)
    .eq("user_id", user.id)
    .select("id,media_type")
    .single();

  if (error || !project) {
    res.status(404).json({ error: "project_not_found", message: "Project not found." });
    return;
  }

  const jobTypes = input.enqueue ?? defaultJobsForMedia(project.media_type);
  const jobs = [];

  for (const jobType of jobTypes) {
    jobs.push(
      await enqueueJob(admin, {
        projectId: input.projectId,
        userId: user.id,
        jobType,
        payload: { source: "upload_complete" },
      }),
    );
  }

  res.status(200).json({ projectId: input.projectId, jobs });
}, ["POST"]);
