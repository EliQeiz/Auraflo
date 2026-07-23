import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseAdminClient } from "../server/supabaseAdmin";

export async function downloadStorageObject(
  admin: SupabaseAdminClient,
  bucket: string,
  storagePath: string,
  localPath: string,
) {
  const { data, error } = await admin.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new Error(error?.message ?? `Unable to download ${bucket}/${storagePath}`);
  }

  await mkdir(path.dirname(localPath), { recursive: true });
  const bytes = Buffer.from(await data.arrayBuffer());
  await writeFile(localPath, bytes);
  return localPath;
}

export async function uploadStorageObject(
  admin: SupabaseAdminClient,
  bucket: string,
  storagePath: string,
  localPath: string,
  contentType: string,
) {
  const body = await readFile(localPath);
  const { error } = await admin.storage.from(bucket).upload(storagePath, body, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return storagePath;
}
