import { supabase } from "./supabase";
import { enqueueBackendJob } from "./backend";
import type { FrameAsset, ProcessingJobType } from "../types/media";

export interface EnqueueJobInput {
  projectId: string;
  jobType: ProcessingJobType;
  accessToken?: string;
  payload?: Record<string, unknown>;
}

export async function enqueueProcessingJob({ projectId, jobType, accessToken, payload = {} }: EnqueueJobInput) {
  if (accessToken) {
    const response = await enqueueBackendJob(projectId, jobType, accessToken, payload);
    return response.job;
  }

  const { data, error } = await supabase
    .from("processing_jobs")
    .insert({
      project_id: projectId,
      job_type: jobType,
      status: "queued",
      payload,
    })
    .select("id,status,queued_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchFrameThumbnails(projectId: string, fromFrame: number, toFrame: number) {
  const { data, error } = await supabase
    .from("frame_assets")
    .select("id,project_id,frame_index,thumbnail_path,enhanced_path,detections")
    .eq("project_id", projectId)
    .gte("frame_index", fromFrame)
    .lte("frame_index", toFrame)
    .order("frame_index", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as FrameAsset[];
}

export function enhanceFrame(projectId: string, frameIndex: number, accessToken?: string) {
  return enqueueProcessingJob({
    projectId,
    jobType: "enhance_frame",
    accessToken,
    payload: { frameIndex, model: "Real-ESRGAN" },
  });
}

export function blurFace(projectId: string, frameIndex: number, faceId: string, accessToken?: string) {
  return enqueueProcessingJob({
    projectId,
    jobType: "blur_face",
    accessToken,
    payload: { frameIndex, faceId, mask: "gaussian" },
  });
}

export function stitchVideo(projectId: string, framerate: number, accessToken?: string) {
  return enqueueProcessingJob({
    projectId,
    jobType: "stitch_video",
    accessToken,
    payload: { framerate, encoder: "ffmpeg-h264", preserveAudio: true },
  });
}
