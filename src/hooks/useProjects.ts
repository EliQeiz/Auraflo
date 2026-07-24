import { useEffect, useState } from "react";
import { listProjects } from "../api/backend";
import type { Project } from "../types/media";

export type ProjectSummary = Project;

export function useProjects(accessToken?: string, refreshKey = 0) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setProjects([]);
      return;
    }

    const token = accessToken;
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const response = await listProjects(token);
        if (active) {
          setProjects(response.projects);
        }
      } catch (error) {
        console.warn("Unable to load projects", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    const interval = window.setInterval(load, 6000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [accessToken, refreshKey]);

  return { projects, isLoading };
}
