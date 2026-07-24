import { useEffect, useState } from "react";
import { getProjectDetail } from "../api/backend";
import type { FrameAsset, ProcessingJob, Project } from "../types/media";

export interface ProjectDetailState {
  project: Project | null;
  jobs: ProcessingJob[];
  frames: FrameAsset[];
  isLoading: boolean;
  error: string | null;
}

export function useProjectDetail(projectId?: string | null, accessToken?: string, refreshKey = 0) {
  const [state, setState] = useState<ProjectDetailState>({
    project: null,
    jobs: [],
    frames: [],
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!projectId || !accessToken) {
      setState({ project: null, jobs: [], frames: [], isLoading: false, error: null });
      return;
    }

    let active = true;
    const id = projectId;
    const token = accessToken;

    async function load() {
      setState((current) => ({ ...current, isLoading: true, error: null }));
      try {
        const detail = await getProjectDetail(id, token);
        if (active) {
          setState({ ...detail, isLoading: false, error: null });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load project.";
        if (active) {
          setState((current) => ({ ...current, isLoading: false, error: message }));
        }
      }
    }

    void load();
    const interval = window.setInterval(load, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [accessToken, projectId, refreshKey]);

  return state;
}
