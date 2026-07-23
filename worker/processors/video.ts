import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { SupabaseAdminClient } from "../../server/supabaseAdmin.js";
import { runFfmpeg } from "../ffmpeg.js";
import { downloadStorageObject, uploadStorageObject } from "../storage.js";

export async function upscaleVideo(
  admin: SupabaseAdminClient,
  input: {
    projectId: string;
    originalPath: string;
    tempDir: string;
  },
) {
  const workDir = path.join(input.tempDir, input.projectId);
  const localOriginal = path.join(workDir, "original-video");
  const localEnhanced = path.join(workDir, "enhanced.mp4");
  const outputPath = input.originalPath.replace(/\/original(\.[a-z0-9]+)?$/i, "/enhanced.mp4");

  await mkdir(workDir, { recursive: true });
  await downloadStorageObject(admin, "original-media", input.originalPath, localOriginal);

  await runFfmpeg([
    "-y",
    "-i",
    localOriginal,
    "-vf",
    "scale='min(3840,iw*2)':-2:flags=lanczos",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "18",
    "-c:a",
    "copy",
    localEnhanced,
  ]);

  await uploadStorageObject(admin, "processed-media", outputPath, localEnhanced, "video/mp4");
  return { outputPath, model: "ffmpeg-lanczos-dev-upscaler", temporalModelReady: "BasicVSR++/SwinIR adapter slot" };
}

export async function extractVideoThumbnails(
  admin: SupabaseAdminClient,
  input: {
    projectId: string;
    originalPath: string;
    tempDir: string;
    count?: number;
  },
) {
  const count = input.count ?? 12;
  const workDir = path.join(input.tempDir, input.projectId, "thumbs");
  const localOriginal = path.join(input.tempDir, input.projectId, "thumb-video");
  const pattern = path.join(workDir, "frame-%03d.webp");

  await mkdir(workDir, { recursive: true });
  await downloadStorageObject(admin, "original-media", input.originalPath, localOriginal);

  await runFfmpeg([
    "-y",
    "-i",
    localOriginal,
    "-vf",
    `fps=1,scale=320:180:force_original_aspect_ratio=increase,crop=320:180`,
    "-frames:v",
    String(count),
    pattern,
  ]);

  const frames = [];
  for (let index = 1; index <= count; index += 1) {
    const frameIndex = (index - 1) * 24;
    const localThumb = path.join(workDir, `frame-${String(index).padStart(3, "0")}.webp`);
    const thumbnailPath = input.originalPath.replace(/\/original(\.[a-z0-9]+)?$/i, `/frames/${frameIndex}.webp`);
    await uploadStorageObject(admin, "frame-thumbnails", thumbnailPath, localThumb, "image/webp");
    frames.push({ frameIndex, thumbnailPath });
  }

  return frames;
}
