import type { SupabaseAdminClient } from "../server/supabaseAdmin";
import type { ProcessingJobType } from "../src/types/media";
import { detectFaces } from "./processors/faces";
import { createImageThumbnail, upscaleImage } from "./processors/image";
import { extractVideoThumbnails, upscaleVideo } from "./processors/video";

interface ProcessingJob {
  id: string;
  project_id: string;
  job_type: ProcessingJobType;
  payload: Record<string, unknown>;
}

interface WorkerContext {
  admin: SupabaseAdminClient;
  tempDir: string;
}

export async function processJob(job: ProcessingJob, context: WorkerContext) {
  const project = await loadProject(context.admin, job.project_id);

  if (job.job_type === "upscale_image" || job.job_type === "enhance_frame") {
    const result = await upscaleImage(context.admin, {
      projectId: project.id,
      originalPath: project.storage_path_original,
      tempDir: context.tempDir,
    });

    const frame = await createImageThumbnail(context.admin, {
      projectId: project.id,
      sourcePath: project.storage_path_original,
      tempDir: context.tempDir,
    });

    await upsertFrame(context.admin, project.id, frame.frameIndex, frame.thumbnailPath);
    await context.admin.from("projects").update({ storage_path_hd: result.outputPath }).eq("id", project.id);
    return result;
  }

  if (job.job_type === "upscale_video" || job.job_type === "stitch_video") {
    const result = await upscaleVideo(context.admin, {
      projectId: project.id,
      originalPath: project.storage_path_original,
      tempDir: context.tempDir,
    });
    const frames = await extractVideoThumbnails(context.admin, {
      projectId: project.id,
      originalPath: project.storage_path_original,
      tempDir: context.tempDir,
    });

    for (const frame of frames) {
      await upsertFrame(context.admin, project.id, frame.frameIndex, frame.thumbnailPath);
    }

    await context.admin.from("projects").update({ storage_path_hd: result.outputPath }).eq("id", project.id);
    return result;
  }

  if (job.job_type === "detect_faces" || job.job_type === "blur_face") {
    const faces = await detectFaces({ projectId: project.id, frameCount: 12 });
    const { error } = await context.admin.from("facial_embeddings").insert(
      faces.map((face) => ({
        project_id: project.id,
        face_id: face.face_id,
        frame_index: face.frame_index,
        bounding_box: face.bounding_box,
        embedding: face.embedding,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }

    return { insertedFaces: faces.length, model: "deterministic-dev-insightface-adapter" };
  }

  throw new Error(`Unsupported job type: ${job.job_type}`);
}

async function loadProject(admin: SupabaseAdminClient, projectId: string) {
  const { data, error } = await admin
    .from("projects")
    .select("id,media_type,storage_path_original")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? `Project ${projectId} not found`);
  }

  return data;
}

async function upsertFrame(admin: SupabaseAdminClient, projectId: string, frameIndex: number, thumbnailPath: string) {
  const { error } = await admin.from("frame_assets").upsert(
    {
      project_id: projectId,
      frame_index: frameIndex,
      thumbnail_path: thumbnailPath,
      detections: [],
    },
    { onConflict: "project_id,frame_index" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
