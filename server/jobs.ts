import { ApiError } from "./http.js";
import type { SupabaseAdminClient } from "./supabaseAdmin.js";
import type { ProcessingJobType } from "../src/types/media";

export interface EnqueueJobOptions {
  projectId: string;
  userId: string;
  jobType: ProcessingJobType;
  payload?: Record<string, unknown>;
}

export async function assertProjectOwner(admin: SupabaseAdminClient, projectId: string, userId: string) {
  const { data, error } = await admin
    .from("projects")
    .select("id,user_id,media_type,storage_path_original,status")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    throw new ApiError(404, "project_not_found", "Project not found.");
  }

  if (data.user_id !== userId) {
    throw new ApiError(403, "project_forbidden", "You do not have access to this project.");
  }

  return data;
}

export async function enqueueJob(admin: SupabaseAdminClient, options: EnqueueJobOptions) {
  await assertProjectOwner(admin, options.projectId, options.userId);

  const { data, error } = await admin
    .from("processing_jobs")
    .insert({
      project_id: options.projectId,
      job_type: options.jobType,
      status: "queued",
      payload: options.payload ?? {},
    })
    .select("id,project_id,job_type,status,queued_at")
    .single();

  if (error) {
    throw new ApiError(500, "job_enqueue_failed", error.message);
  }

  await admin.from("projects").update({ status: "queued", updated_at: new Date().toISOString() }).eq("id", options.projectId);
  return data;
}
