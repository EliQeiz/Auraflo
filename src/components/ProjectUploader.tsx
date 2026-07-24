import { FormEvent, useMemo, useState } from "react";
import { Upload, LogIn, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../api/supabase";
import { useProjectUpload } from "../hooks/useProjectUpload";
import type { MediaType } from "../types/media";
import { AuraButton } from "./AuraButton";

interface ProjectUploaderProps {
  session: Session | null;
  onQueued?: () => void;
}

export function ProjectUploader({ session, onQueued }: ProjectUploaderProps) {
  const [email, setEmail] = useState("");
  const [projectName, setProjectName] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [file, setFile] = useState<File | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const upload = useProjectUpload(session?.access_token);

  const canUpload = Boolean(session && file && projectName.trim() && upload.state !== "uploading" && upload.state !== "creating");
  const statusText = useMemo(() => {
    if (upload.state === "idle") return "Ready";
    if (upload.state === "creating") return "Creating project";
    if (upload.state === "uploading") return "Uploading media";
    if (upload.state === "queueing") return "Queueing AI jobs";
    if (upload.state === "complete") return "Queued";
    return "Failed";
  }, [upload.state]);

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setAuthMessage(error ? error.message : "Magic link sent. Check your email, then return here.");
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    await upload.uploadProject({
      projectName,
      mediaType,
      file,
    });
    onQueued?.();
  }

  return (
    <section className="platform-panel" aria-label="Upload project">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-black uppercase text-accent-cyan">Secure intake</p>
          <h2 className="text-base font-black text-text-main">Create Processing Workspace</h2>
          <p className="mt-1 text-xs text-text-muted">{statusText}</p>
        </div>
        {upload.state === "complete" ? <CheckCircle2 className="h-5 w-5 text-accent-cyan" aria-hidden="true" /> : null}
        {upload.state === "failed" ? <AlertTriangle className="h-5 w-5 text-amber-300" aria-hidden="true" /> : null}
      </div>

      {!session ? (
        <form className="grid gap-3" onSubmit={handleMagicLink}>
          <label className="grid gap-2 text-xs font-semibold text-text-muted">
            Work Email
            <input
              className="rounded-lg border border-white/10 bg-background-dark/80 px-3 py-3 text-sm text-text-main outline-none focus:border-accent-cyan"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
            />
          </label>
          <AuraButton type="submit" icon={<LogIn className="h-4 w-4" aria-hidden="true" />}>
            Send Magic Link
          </AuraButton>
          {authMessage ? <p className="text-xs leading-5 text-text-muted">{authMessage}</p> : null}
        </form>
      ) : (
        <form className="grid gap-3" onSubmit={handleUpload}>
          <label className="grid gap-2 text-xs font-semibold text-text-muted">
            Workspace Name
            <input
              className="rounded-lg border border-white/10 bg-background-dark/80 px-3 py-3 text-sm text-text-main outline-none focus:border-accent-cyan"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Restoration batch, case footage, archive import"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Media type">
            {(["video", "image"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMediaType(type)}
                className={`rounded-lg border px-3 py-2 text-sm font-bold capitalize transition ${
                  mediaType === type
                    ? "border-accent-cyan bg-accent-cyan/15 text-text-main"
                    : "border-white/10 bg-background-dark/60 text-text-muted hover:border-accent-cyan/50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label className="grid gap-2 text-xs font-semibold text-text-muted">
            Source Media
            <input
              className="rounded-lg border border-dashed border-accent-cyan/25 bg-background-dark/70 px-3 py-6 text-sm text-text-muted outline-none file:mr-3 file:rounded-md file:border-0 file:bg-accent-cyan file:px-3 file:py-2 file:text-xs file:font-bold file:text-white focus:border-accent-cyan"
              type="file"
              accept={mediaType === "video" ? "video/mp4,video/quicktime" : "image/png,image/jpeg,image/webp"}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>

          <AuraButton type="submit" disabled={!canUpload} icon={<Upload className="h-4 w-4" aria-hidden="true" />}>
            Upload And Queue
          </AuraButton>
          {upload.projectId ? <p className="text-xs leading-5 text-text-muted">Project: {upload.projectId}</p> : null}
          {upload.jobIds.length ? <p className="text-xs leading-5 text-text-muted">Jobs: {upload.jobIds.join(", ")}</p> : null}
          {upload.error ? <p className="text-xs leading-5 text-amber-300">{upload.error}</p> : null}
        </form>
      )}
    </section>
  );
}
