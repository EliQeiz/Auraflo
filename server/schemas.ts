import { z } from "zod";

export const mediaTypeSchema = z.enum(["image", "video"]);

export const createProjectSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  mediaType: mediaTypeSchema,
  fileName: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(3).max(120),
  fileSize: z.number().int().positive().max(8 * 1024 * 1024 * 1024),
});

export const completeUploadSchema = z.object({
  projectId: z.string().uuid(),
  enqueue: z.array(z.enum(["upscale_image", "upscale_video", "detect_faces"])).optional(),
});

export const enqueueJobSchema = z.object({
  projectId: z.string().uuid(),
  jobType: z.enum(["upscale_image", "upscale_video", "detect_faces", "enhance_frame", "blur_face", "stitch_video"]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const signReadUrlSchema = z.object({
  bucket: z.enum(["original-media", "processed-media", "frame-thumbnails"]),
  path: z.string().min(1).max(600),
  expiresIn: z.number().int().positive().max(60 * 60 * 24).optional(),
});
