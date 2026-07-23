import path from "node:path";
import sharp from "sharp";
import type { SupabaseAdminClient } from "../../server/supabaseAdmin";
import { downloadStorageObject, uploadStorageObject } from "../storage";

export async function upscaleImage(
  admin: SupabaseAdminClient,
  input: {
    projectId: string;
    originalPath: string;
    tempDir: string;
  },
) {
  const localOriginal = path.join(input.tempDir, input.projectId, "original-image");
  const localEnhanced = path.join(input.tempDir, input.projectId, "enhanced.webp");
  const outputPath = input.originalPath.replace(/\/original(\.[a-z0-9]+)?$/i, "/enhanced.webp");

  await downloadStorageObject(admin, "original-media", input.originalPath, localOriginal);

  const metadata = await sharp(localOriginal).metadata();
  const width = metadata.width ?? 1280;
  const height = metadata.height ?? 720;
  const scale = Math.min(4, Math.max(2, Math.floor(3840 / Math.max(width, height)) || 2));

  await sharp(localOriginal)
    .resize({
      width: Math.min(width * scale, 3840),
      height: Math.min(height * scale, 3840),
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
      withoutEnlargement: false,
    })
    .modulate({ saturation: 1.03, brightness: 1.01 })
    .sharpen({ sigma: 1.15, m1: 0.7, m2: 1.8 })
    .webp({ quality: 94 })
    .toFile(localEnhanced);

  await uploadStorageObject(admin, "processed-media", outputPath, localEnhanced, "image/webp");
  return { outputPath, model: "sharp-lanczos-dev-upscaler", width, height, scale };
}

export async function createImageThumbnail(
  admin: SupabaseAdminClient,
  input: {
    projectId: string;
    sourcePath: string;
    tempDir: string;
  },
) {
  const localOriginal = path.join(input.tempDir, input.projectId, "thumb-source");
  const localThumb = path.join(input.tempDir, input.projectId, "thumb-0.webp");
  const thumbPath = input.sourcePath.replace(/\/original(\.[a-z0-9]+)?$/i, "/frames/0.webp");

  await downloadStorageObject(admin, "original-media", input.sourcePath, localOriginal);
  await sharp(localOriginal).resize({ width: 320, height: 180, fit: "cover" }).webp({ quality: 78 }).toFile(localThumb);
  await uploadStorageObject(admin, "frame-thumbnails", thumbPath, localThumb, "image/webp");

  return { frameIndex: 0, thumbnailPath: thumbPath };
}
