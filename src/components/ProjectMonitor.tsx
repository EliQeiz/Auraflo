import { Clock3, Image, Video } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useProjects } from "../hooks/useProjects";

interface ProjectMonitorProps {
  session: Session | null;
  refreshKey?: number;
}

const statusStyles: Record<string, string> = {
  uploading: "bg-white/10 text-text-muted",
  staging: "bg-accent-light-blue/15 text-accent-light-blue",
  queued: "bg-accent-cyan/15 text-accent-cyan",
  processing: "bg-accent-purple/20 text-accent-violet",
  completed: "bg-emerald-400/15 text-emerald-300",
  failed: "bg-amber-300/15 text-amber-200",
};

export function ProjectMonitor({ session, refreshKey = 0 }: ProjectMonitorProps) {
  const { projects, isLoading } = useProjects(session?.access_token, refreshKey);

  return (
    <section className="glass-panel rounded-lg p-5" aria-label="Project monitor">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-text-main">Project Monitor</h2>
          <p className="text-xs text-text-muted">{session ? `${projects.length} recent projects` : "Sign in to load projects"}</p>
        </div>
        {isLoading ? <Clock3 className="h-4 w-4 animate-pulse text-accent-cyan" aria-hidden="true" /> : null}
      </div>

      <div className="grid gap-3">
        {projects.slice(0, 5).map((project) => {
          const Icon = project.media_type === "video" ? Video : Image;
          return (
            <article key={project.id} className="rounded-lg border border-white/10 bg-background-dark/55 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-accent-cyan">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-text-main">{project.project_name}</h3>
                  <p className="mt-1 truncate text-xs text-text-muted">{project.id}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${statusStyles[project.status] ?? statusStyles.uploading}`}>
                  {project.status}
                </span>
              </div>
              {project.error_message ? <p className="mt-2 text-xs leading-5 text-amber-200">{project.error_message}</p> : null}
            </article>
          );
        })}

        {session && !projects.length && !isLoading ? (
          <p className="rounded-lg border border-white/10 bg-background-dark/50 p-3 text-xs leading-5 text-text-muted">
            No projects yet. Upload media to start the queue.
          </p>
        ) : null}
      </div>
    </section>
  );
}
