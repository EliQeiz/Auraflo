import type { MediaType, ProcessingJobType } from "../types/media";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

async function apiFetch<T>(path: string, accessToken: string, body?: Record<string, unknown>) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : "AuraFlow API request failed.";
    throw new Error(message);
  }

  return payload as T;
}

export interface CreateProjectUploadInput {
  projectName: string;
  mediaType: MediaType;
  file: File;
}

export interface CreateProjectUploadResponse {
  project: {
    id: string;
    project_name: string;
    media_type: MediaType;
    storage_path_original: string;
    status: string;
    created_at: string;
  };
  upload: {
    bucket: string;
    path: string;
    signedUrl: string;
    token: string;
    contentType: string;
    fileSize: number;
  };
}

export function createProjectUpload(input: CreateProjectUploadInput, accessToken: string) {
  return apiFetch<CreateProjectUploadResponse>("/api/projects/create", accessToken, {
    projectName: input.projectName,
    mediaType: input.mediaType,
    fileName: input.file.name,
    contentType: input.file.type || "application/octet-stream",
    fileSize: input.file.size,
  });
}

export function completeProjectUpload(projectId: string, accessToken: string) {
  return apiFetch<{ projectId: string; jobs: Array<{ id: string; status: string; job_type: ProcessingJobType }> }>(
    "/api/projects/complete-upload",
    accessToken,
    { projectId },
  );
}

export function enqueueBackendJob(
  projectId: string,
  jobType: ProcessingJobType,
  accessToken: string,
  payload: Record<string, unknown> = {},
) {
  return apiFetch<{ job: { id: string; status: string; job_type: ProcessingJobType } }>("/api/jobs/enqueue", accessToken, {
    projectId,
    jobType,
    payload,
  });
}

export function listProjects(accessToken: string) {
  return apiFetch<{
    projects: Array<{
      id: string;
      project_name: string;
      media_type: MediaType;
      status: string;
      storage_path_hd?: string | null;
      error_message?: string | null;
      created_at: string;
      updated_at: string;
    }>;
  }>("/api/projects/list", accessToken);
}

export function getProjectDetail(projectId: string, accessToken: string) {
  return apiFetch<{
    project: {
      id: string;
      project_name: string;
      media_type: MediaType;
      status: string;
      storage_path_hd?: string | null;
      error_message?: string | null;
    };
    jobs: Array<{ id: string; job_type: ProcessingJobType; status: string }>;
    frames: Array<{ id: string; frame_index: number; thumbnail_path: string }>;
  }>(`/api/projects/detail?id=${encodeURIComponent(projectId)}`, accessToken);
}
