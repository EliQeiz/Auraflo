import path from "node:path";
import { ApiError } from "./http";
import type { SupabaseAdminClient } from "./supabaseAdmin";
import type { MediaType, ProcessingJobType } from "../src/types/media";

const bucketByMediaType: Record<"original" | "processed" | "thumbnails", string> = {
  original: "original-media",
  processed: "processed-media",
  thumbnails: "frame-thumbnails",
};

export function buildStoragePath(userId: string, fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const safeExtension = extension && extension.length <= 12 ? extension : "";
  return `${userId}/${crypto.randomUUID()}/original${safeExtension}`;
}

export async function createProjectWithSignedUpload(
  admin: SupabaseAdminClient,
  input: {
    userId: string;
    projectName: string;
    mediaType: MediaType;
    fileName: string;
    contentType: string;
    fileSize: number;
  },
) {
  const storagePath = buildStoragePath(input.userId, input.fileName);

  const { data: project, error: projectError } = await admin
    .from("projects")
    .insert({
      user_id: input.userId,
      project_name: input.projectName,
      media_type: input.mediaType,
      storage_path_original: storagePath,
      status: "uploading",
    })
    .select("id,user_id,project_name,media_type,storage_path_original,status,created_at")
    .single();

  if (projectError || !project) {
    throw new ApiError(500, "project_create_failed", projectError?.message ?? "Unable to create project.");
  }

  const { data: upload, error: uploadError } = await admin.storage
    .from(bucketByMediaType.original)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (uploadError || !upload) {
    await admin.from("projects").delete().eq("id", project.id);
    throw new ApiError(500, "signed_upload_failed", uploadError?.message ?? "Unable to create upload URL.");
  }

  return {
    project,
    upload: {
      bucket: bucketByMediaType.original,
      path: storagePath,
      signedUrl: upload.signedUrl,
      token: upload.token,
      contentType: input.contentType,
      fileSize: input.fileSize,
    },
  };
}

export function defaultJobsForMedia(mediaType: MediaType): ProcessingJobType[] {
  return mediaType === "image" ? ["upscale_image", "detect_faces"] : ["upscale_video", "detect_faces"];
}
