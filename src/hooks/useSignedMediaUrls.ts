import { useEffect, useMemo, useState } from "react";
import { signReadUrl } from "../api/backend";
import type { FrameAsset } from "../types/media";

type SignedUrlMap = Record<string, string>;

export function useSignedFrameUrls(frames: FrameAsset[], accessToken?: string) {
  const [urls, setUrls] = useState<SignedUrlMap>({});

  const frameKey = useMemo(() => frames.map((frame) => `${frame.id}:${frame.thumbnail_path}`).join("|"), [frames]);

  useEffect(() => {
    if (!accessToken || frames.length === 0) {
      setUrls({});
      return;
    }

    let active = true;
    const token = accessToken;

    async function signFrames() {
      const pairs = await Promise.all(
        frames.map(async (frame) => {
          if (/^https?:\/\//i.test(frame.thumbnail_path)) {
            return [frame.id, frame.thumbnail_path] as const;
          }

          const response = await signReadUrl(
            { bucket: "frame-thumbnails", path: frame.thumbnail_path, expiresIn: 3600 },
            token,
          );
          return [frame.id, response.signedUrl] as const;
        }),
      );

      if (active) {
        setUrls(Object.fromEntries(pairs));
      }
    }

    void signFrames().catch(() => {
      if (active) {
        setUrls({});
      }
    });

    return () => {
      active = false;
    };
  }, [accessToken, frameKey, frames]);

  return urls;
}

export function useSignedProjectAsset(
  bucket: "original-media" | "processed-media" | "frame-thumbnails",
  path?: string | null,
  accessToken?: string,
) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!path || !accessToken) {
      setUrl(null);
      return;
    }

    if (/^https?:\/\//i.test(path)) {
      setUrl(path);
      return;
    }

    let active = true;
    signReadUrl({ bucket, path, expiresIn: 3600 }, accessToken)
      .then((response) => {
        if (active) setUrl(response.signedUrl);
      })
      .catch(() => {
        if (active) setUrl(null);
      });

    return () => {
      active = false;
    };
  }, [accessToken, bucket, path]);

  return url;
}
