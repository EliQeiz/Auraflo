import { useState } from "react";
import { completeProjectUpload, createProjectUpload } from "../api/backend";
import { supabase } from "../api/supabase";
import type { MediaType } from "../types/media";

export type UploadState = "idle" | "creating" | "uploading" | "queueing" | "complete" | "failed";

export function useProjectUpload(accessToken?: string) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [jobIds, setJobIds] = useState<string[]>([]);

  async function uploadProject(input: { projectName: string; mediaType: MediaType; file: File }) {
    if (!accessToken) {
      throw new Error("Sign in before uploading media.");
    }

    setError(null);
    setJobIds([]);
    setProjectId(null);

    try {
      setState("creating");
      const created = await createProjectUpload(input, accessToken);
      setProjectId(created.project.id);

      setState("uploading");
      const { error: uploadError } = await supabase.storage
        .from(created.upload.bucket)
        .uploadToSignedUrl(created.upload.path, created.upload.token, input.file, {
          contentType: created.upload.contentType,
        });

      if (uploadError) {
        throw uploadError;
      }

      setState("queueing");
      const queued = await completeProjectUpload(created.project.id, accessToken);
      setJobIds(queued.jobs.map((job) => job.id));
      setState("complete");
      return { project: created.project, jobs: queued.jobs };
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      setState("failed");
      throw uploadError;
    }
  }

  return {
    state,
    error,
    projectId,
    jobIds,
    uploadProject,
  };
}
