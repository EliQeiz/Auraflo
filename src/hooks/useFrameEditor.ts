import { useCallback, useEffect, useMemo, useState } from "react";
import { blurFace, enhanceFrame, fetchFrameThumbnails, stitchVideo } from "../api/pipeline";
import type { FrameAsset } from "../types/media";

interface UseFrameEditorOptions {
  projectId: string;
  totalFrames: number;
  accessToken?: string;
  windowSize?: number;
}

export function useFrameEditor({ projectId, totalFrames, accessToken, windowSize = 48 }: UseFrameEditorOptions) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<FrameAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingJob, setPendingJob] = useState<string | null>(null);

  const frameWindow = useMemo(() => {
    const halfWindow = Math.floor(windowSize / 2);
    const from = Math.max(0, currentFrame - halfWindow);
    const to = Math.min(totalFrames - 1, from + windowSize - 1);
    return { from, to };
  }, [currentFrame, totalFrames, windowSize]);

  useEffect(() => {
    let cancelled = false;

    async function loadFrames() {
      if (!projectId || totalFrames <= 0) {
        return;
      }

      setIsLoading(true);
      try {
        const nextFrames = await fetchFrameThumbnails(projectId, frameWindow.from, frameWindow.to);
        if (!cancelled) {
          setFrames(nextFrames);
        }
      } catch (error) {
        console.warn("Unable to fetch frame thumbnails. The editor can continue with local/mock frames.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFrames();

    return () => {
      cancelled = true;
    };
  }, [frameWindow.from, frameWindow.to, projectId, totalFrames]);

  const runEnhanceFrame = useCallback(async () => {
    const job = await enhanceFrame(projectId, currentFrame, accessToken);
    setPendingJob(job.id);
    return job;
  }, [accessToken, currentFrame, projectId]);

  const runBlurFace = useCallback(
    async (faceId: string) => {
      const job = await blurFace(projectId, currentFrame, faceId, accessToken);
      setPendingJob(job.id);
      return job;
    },
    [accessToken, currentFrame, projectId],
  );

  const runStitchVideo = useCallback(
    async (framerate: number) => {
      const job = await stitchVideo(projectId, framerate, accessToken);
      setPendingJob(job.id);
      return job;
    },
    [accessToken, projectId],
  );

  return {
    currentFrame,
    frames,
    frameWindow,
    isLoading,
    pendingJob,
    setCurrentFrame,
    enhanceFrame: runEnhanceFrame,
    blurFace: runBlurFace,
    stitchVideo: runStitchVideo,
  };
}
