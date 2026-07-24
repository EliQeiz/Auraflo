import { mkdir, rm } from "node:fs/promises";
import { createSupabaseAdmin } from "../server/supabaseAdmin.js";
import { getWorkerEnv } from "../server/env.js";
import { processJob } from "./processor.js";

const env = getWorkerEnv();
const admin = createSupabaseAdmin();

async function claimNextJob() {
  const { data, error } = await admin.rpc("claim_next_processing_job");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function markJobComplete(jobId: string, result: Record<string, unknown>) {
  const { data: job } = await admin
    .from("processing_jobs")
    .update({ status: "completed", result, completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .select("project_id")
    .single();

  if (job?.project_id) {
    await refreshProjectStatus(job.project_id);
  }
}

async function refreshProjectStatus(projectId: string) {
  const { data: jobs, error } = await admin
    .from("processing_jobs")
    .select("status")
    .eq("project_id", projectId);

  if (error || !jobs?.length) {
    return;
  }

  const statuses = jobs.map((job) => job.status);
  const nextStatus = statuses.some((status) => status === "failed")
    ? "failed"
    : statuses.some((status) => status === "running")
      ? "processing"
      : statuses.some((status) => status === "queued")
        ? "queued"
        : "completed";

  await admin
    .from("projects")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", projectId);
}

async function markJobFailed(jobId: string, projectId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown worker failure.";

  await admin
    .from("processing_jobs")
    .update({ status: "failed", result: { error: message }, completed_at: new Date().toISOString() })
    .eq("id", jobId);

  await admin
    .from("projects")
    .update({ status: "failed", error_message: message, updated_at: new Date().toISOString() })
    .eq("id", projectId);
}

async function tick() {
  for (let i = 0; i < env.workerBatchLimit; i += 1) {
    const job = await claimNextJob();
    if (!job) {
      return;
    }

    console.log(`[worker] claimed ${job.id} (${job.job_type})`);
    try {
      await admin.from("projects").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", job.project_id);
      const result = await processJob(job, { admin, tempDir: env.tempDir });
      await markJobComplete(job.id, result);
      console.log(`[worker] completed ${job.id}`);
    } catch (error) {
      await markJobFailed(job.id, job.project_id, error);
      console.error(`[worker] failed ${job.id}`, error);
    }
  }
}

async function main() {
  await mkdir(env.tempDir, { recursive: true });
  console.log(`[worker] AuraFlow worker started in ${env.processorMode} mode`);

  process.on("SIGINT", async () => {
    await rm(env.tempDir, { recursive: true, force: true });
    process.exit(0);
  });

  while (true) {
    await tick();
    await new Promise((resolve) => setTimeout(resolve, env.workerPollMs));
  }
}

void main().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
