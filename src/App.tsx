import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Command,
  Database,
  Download,
  FileVideo,
  Fingerprint,
  Gauge,
  HardDriveUpload,
  Image as ImageIcon,
  Layers3,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ScanFace,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Wand2,
  XCircle,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./api/supabase";
import { enhanceFrame, stitchVideo } from "./api/pipeline";
import { AuraButton } from "./components/AuraButton";
import { FrameCanvas } from "./components/FrameCanvas";
import { ProjectUploader } from "./components/ProjectUploader";
import { AuraFlowProvider } from "./theme/AuraFlowProvider";
import { useProjectDetail } from "./hooks/useProjectDetail";
import { useProjects } from "./hooks/useProjects";
import { useSignedFrameUrls, useSignedProjectAsset } from "./hooks/useSignedMediaUrls";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import type { FrameAsset, ProcessingJob, Project, ProjectStatus } from "./types/media";

type SuiteId = "operations" | "intake" | "workbench" | "identity" | "exports" | "system";

const suites = [
  { id: "operations", label: "Command", icon: LayoutDashboard },
  { id: "intake", label: "Intake", icon: UploadCloud },
  { id: "workbench", label: "Workbench", icon: Wand2 },
  { id: "identity", label: "Identity", icon: Fingerprint },
  { id: "exports", label: "Exports", icon: Archive },
  { id: "system", label: "System", icon: Settings },
] satisfies Array<{ id: SuiteId; label: string; icon: typeof Activity }>;

const statusStyles: Record<ProjectStatus | ProcessingJob["status"], string> = {
  uploading: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  staging: "border-violet-300/25 bg-violet-300/10 text-violet-200",
  queued: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  processing: "border-blue-300/25 bg-blue-300/10 text-blue-200",
  running: "border-blue-300/25 bg-blue-300/10 text-blue-200",
  completed: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  failed: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  cancelled: "border-white/15 bg-white/5 text-text-muted",
};

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatJobType(value: string) {
  return value.replace(/_/g, " ");
}

function StatusPill({ status }: { status: ProjectStatus | ProcessingJob["status"] }) {
  return <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-bold capitalize ${statusStyles[status]}`}>{status}</span>;
}

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`platform-panel ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-[11px] font-black uppercase tracking-normal text-accent-cyan">{eyebrow}</p> : null}
          <h2 className="truncate text-base font-black text-text-main">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-lg border border-dashed border-white/15 bg-background-dark/45 p-6 text-center">
      <div>
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">{icon}</div>
        <h3 className="text-sm font-black text-text-main">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">{body}</p>
      </div>
    </div>
  );
}

function Sidebar({ activeSuite, onSuiteChange }: { activeSuite: SuiteId; onSuiteChange: (suite: SuiteId) => void }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-background-dark/80 p-4 lg:block">
      <button className="mb-6 flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent-cyan/25 bg-accent-cyan/10 text-sm font-black text-accent-cyan">AF</span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-text-main">AuraFlow</span>
          <span className="block text-xs text-text-muted">Media intelligence OS</span>
        </span>
      </button>

      <nav className="grid gap-1">
        {suites.map((suite) => {
          const Icon = suite.icon;
          const isActive = activeSuite === suite.id;
          return (
            <button
              key={suite.id}
              type="button"
              onClick={() => onSuiteChange(suite.id)}
              className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-bold transition ${
                isActive
                  ? "border border-accent-cyan/40 bg-accent-cyan/12 text-text-main shadow-cyan-glow"
                  : "text-text-muted hover:bg-white/[0.05] hover:text-text-main"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {suite.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function MobileSuiteBar({ activeSuite, onSuiteChange }: { activeSuite: SuiteId; onSuiteChange: (suite: SuiteId) => void }) {
  return (
    <div className="grid grid-flow-col gap-2 overflow-x-auto border-b border-white/10 bg-background-dark/85 px-4 py-3 lg:hidden">
      {suites.map((suite) => {
        const Icon = suite.icon;
        return (
          <button
            key={suite.id}
            type="button"
            onClick={() => onSuiteChange(suite.id)}
            className={`inline-flex h-10 min-w-max items-center gap-2 rounded-md border px-3 text-xs font-black ${
              activeSuite === suite.id ? "border-accent-cyan bg-accent-cyan/15 text-text-main" : "border-white/10 bg-white/[0.04] text-text-muted"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {suite.label}
          </button>
        );
      })}
    </div>
  );
}

function TopBar({
  activeSuite,
  signedIn,
  search,
  setSearch,
}: {
  activeSuite: SuiteId;
  signedIn: boolean;
  search: string;
  setSearch: (value: string) => void;
}) {
  const title = suites.find((suite) => suite.id === activeSuite)?.label ?? "AuraFlow";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background-dark/88 px-4 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className={`rounded-md border px-2.5 py-1 text-[11px] font-black ${signedIn ? statusStyles.completed : statusStyles.failed}`}>
              {signedIn ? "Authenticated" : "Auth required"}
            </span>
            <span className={`rounded-md border px-2.5 py-1 text-[11px] font-black ${isSupabaseConfigured ? statusStyles.completed : statusStyles.failed}`}>
              {isSupabaseConfigured ? "Supabase linked" : "Supabase missing"}
            </span>
            <span className="rounded-md border border-accent-violet/25 bg-accent-purple/15 px-2.5 py-1 text-[11px] font-black text-accent-violet">Production</span>
          </div>
          <h1 className="truncate text-2xl font-black text-text-main">{title}</h1>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 xl:w-[360px]">
            <Search className="h-4 w-4 text-accent-cyan" aria-hidden="true" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm text-text-main outline-none placeholder:text-text-muted"
              placeholder="Search projects and jobs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-text-main">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

function ProjectRail({
  projects,
  selectedProjectId,
  onSelectProject,
  isLoading,
  search,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  isLoading: boolean;
  search: string;
}) {
  const filtered = projects.filter((project) => project.project_name.toLowerCase().includes(search.toLowerCase()) || project.id.includes(search));

  return (
    <Panel
      title="Projects"
      eyebrow="Workspace"
      action={isLoading ? <Loader2 className="h-4 w-4 animate-spin text-accent-cyan" aria-hidden="true" /> : null}
      className="h-fit xl:sticky xl:top-28"
    >
      {filtered.length ? (
        <div className="grid gap-2">
          {filtered.map((project) => {
            const Icon = project.media_type === "video" ? FileVideo : ImageIcon;
            const active = selectedProjectId === project.id;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={`group rounded-lg border p-3 text-left transition ${
                  active ? "border-accent-cyan/55 bg-accent-cyan/10 shadow-cyan-glow" : "border-white/10 bg-background-dark/45 hover:border-accent-cyan/35"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-accent-cyan">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-text-main">{project.project_name}</span>
                      <span className="mt-1 block text-xs text-text-muted">{formatDate(project.updated_at ?? project.created_at)}</span>
                    </span>
                  </div>
                  <ChevronRight className={`h-4 w-4 shrink-0 text-text-muted transition ${active ? "translate-x-0.5 text-accent-cyan" : ""}`} aria-hidden="true" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <StatusPill status={project.status} />
                  <span className="text-[11px] font-bold uppercase text-text-muted">{project.media_type}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<HardDriveUpload className="h-5 w-5" aria-hidden="true" />} title="No projects found" body="Upload source media in Intake to create your first processing workspace." />
      )}
    </Panel>
  );
}

function Metrics({ projects, jobs, frames }: { projects: Project[]; jobs: ProcessingJob[]; frames: FrameAsset[] }) {
  const activeJobs = jobs.filter((job) => job.status === "running" || job.status === "queued").length;
  const completedProjects = projects.filter((project) => project.status === "completed").length;
  const failedJobs = jobs.filter((job) => job.status === "failed").length;

  const metrics = [
    { label: "Projects", value: projects.length.toString(), detail: `${completedProjects} completed`, icon: Database },
    { label: "Active jobs", value: activeJobs.toString(), detail: failedJobs ? `${failedJobs} need review` : "Queue healthy", icon: Activity },
    { label: "Indexed frames", value: frames.length.toString(), detail: frames.length ? "Signed previews ready" : "Awaiting worker output", icon: Layers3 },
    { label: "Pipeline", value: isSupabaseConfigured ? "Live" : "Setup", detail: "Vercel API plus Supabase", icon: ShieldCheck },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article key={metric.label} className="platform-panel min-h-[132px]">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-accent-cyan">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="h-2.5 w-2.5 rounded-full border border-accent-cyan bg-accent-cyan/35 shadow-cyan-glow" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-muted">{metric.label}</p>
                <div className="mt-1 flex items-end justify-between gap-4">
                  <strong className="text-3xl font-black text-text-main">{metric.value}</strong>
                  <span className="text-xs font-semibold text-text-muted">{metric.detail}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function JobConsole({ jobs }: { jobs: ProcessingJob[] }) {
  return (
    <Panel title="Processing Jobs" eyebrow="Queue">
      {jobs.length ? (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-white/[0.05] text-xs font-bold text-text-muted">
              <tr>
                <th className="px-3 py-3">Job</th>
                <th className="px-3 py-3">State</th>
                <th className="px-3 py-3">Queued</th>
                <th className="px-3 py-3">Completed</th>
                <th className="px-3 py-3">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.map((job) => (
                <tr key={job.id} className="bg-background-dark/45">
                  <td className="px-3 py-3">
                    <p className="font-black capitalize text-text-main">{formatJobType(job.job_type)}</p>
                    <p className="mt-1 max-w-[190px] truncate text-xs text-text-muted">{job.id}</p>
                  </td>
                  <td className="px-3 py-3"><StatusPill status={job.status} /></td>
                  <td className="px-3 py-3 text-text-muted">{formatDate(job.queued_at)}</td>
                  <td className="px-3 py-3 text-text-muted">{formatDate(job.completed_at)}</td>
                  <td className="px-3 py-3 text-text-muted">{job.result ? "Output recorded" : "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={<Clock3 className="h-5 w-5" aria-hidden="true" />} title="No jobs for this project" body="Upload media or run an action from the Workbench to populate the processing queue." />
      )}
    </Panel>
  );
}

function OperationsPage({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  projectLoading,
  detail,
  search,
}: {
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string) => void;
  projectLoading: boolean;
  detail: ReturnType<typeof useProjectDetail>;
  search: string;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      <ProjectRail projects={projects} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} isLoading={projectLoading} search={search} />
      <div className="grid gap-5">
        <Metrics projects={projects} jobs={detail.jobs} frames={detail.frames} />
        {detail.project ? (
          <Panel
            title={detail.project.project_name}
            eyebrow="Selected workspace"
            action={<StatusPill status={detail.project.status} />}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <InfoTile icon={<FileVideo className="h-4 w-4" aria-hidden="true" />} label="Media type" value={detail.project.media_type} />
              <InfoTile icon={<Database className="h-4 w-4" aria-hidden="true" />} label="Frames" value={detail.frames.length.toString()} />
              <InfoTile icon={<Clock3 className="h-4 w-4" aria-hidden="true" />} label="Updated" value={formatDate(detail.project.updated_at ?? detail.project.created_at)} />
            </div>
            {detail.project.error_message ? (
              <div className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">{detail.project.error_message}</div>
            ) : null}
          </Panel>
        ) : (
          <EmptyState icon={<Command className="h-5 w-5" aria-hidden="true" />} title="Choose or create a workspace" body="AuraFlow becomes operational once a signed-in user uploads media into a project." />
        )}
        <JobConsole jobs={detail.jobs} />
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-background-dark/45 p-3">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">{icon}</div>
      <p className="text-xs font-bold text-text-muted">{label}</p>
      <p className="mt-1 truncate text-lg font-black capitalize text-text-main">{value}</p>
    </div>
  );
}

function IntakePage({ session, onQueued, projects }: { session: ReturnType<typeof useSupabaseSession>["session"]; onQueued: () => void; projects: Project[] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <ProjectUploader session={session} onQueued={onQueued} />
      <Panel title="Intake Standard" eyebrow="Upload contract">
        <div className="grid gap-3">
          {[
            { icon: FileVideo, title: "Video sources", body: "MP4 or MOV, private signed upload, maximum 8 GB." },
            { icon: ImageIcon, title: "Image sources", body: "PNG, JPEG, and WebP files are accepted for enhancement." },
            { icon: LockKeyhole, title: "Storage boundary", body: "Objects are scoped to the authenticated user folder." },
            { icon: Activity, title: "Queue creation", body: "Upload completion creates enhancement and identity jobs." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-white/10 bg-background-dark/45 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-black text-text-main">{item.title}</h3>
                </div>
                <p className="text-sm leading-6 text-text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Recent Imports" eyebrow="Workspace history" className="xl:col-span-2">
        {projects.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <div key={project.id} className="rounded-lg border border-white/10 bg-background-dark/45 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-text-main">{project.project_name}</h3>
                    <p className="mt-1 text-xs text-text-muted">{formatDate(project.created_at)}</p>
                  </div>
                  <StatusPill status={project.status} />
                </div>
                <p className="truncate text-xs text-text-muted">{project.storage_path_original}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<UploadCloud className="h-5 w-5" aria-hidden="true" />} title="No imports yet" body="Once media is uploaded, each import appears here with status and storage lineage." />
        )}
      </Panel>
    </div>
  );
}

function WorkbenchPage({
  detail,
  accessToken,
  onJobQueued,
}: {
  detail: ReturnType<typeof useProjectDetail>;
  accessToken?: string;
  onJobQueued: () => void;
}) {
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<string | null>(null);
  const signedFrames = useSignedFrameUrls(detail.frames, accessToken);
  const processedUrl = useSignedProjectAsset("processed-media", detail.project?.storage_path_hd, accessToken);
  const selectedFrame = useMemo(
    () => detail.frames.find((frame) => frame.id === selectedFrameId) ?? detail.frames[0] ?? null,
    [detail.frames, selectedFrameId],
  );
  const stageUrl = selectedFrame ? signedFrames[selectedFrame.id] : processedUrl;

  useEffect(() => {
    if (!selectedFrameId && detail.frames[0]) {
      setSelectedFrameId(detail.frames[0].id);
    }
  }, [detail.frames, selectedFrameId]);

  async function queueEnhance() {
    if (!detail.project || !accessToken) return;
    setActionState("Queueing frame enhancement");
    try {
      await enhanceFrame(detail.project.id, selectedFrame?.frame_index ?? 0, accessToken);
      setActionState("Enhancement job queued");
      onJobQueued();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "Unable to queue enhancement");
    }
  }

  async function queueExport() {
    if (!detail.project || !accessToken) return;
    setActionState("Queueing export assembly");
    try {
      await stitchVideo(detail.project.id, 24, accessToken);
      setActionState("Export job queued");
      onJobQueued();
    } catch (error) {
      setActionState(error instanceof Error ? error.message : "Unable to queue export");
    }
  }

  if (!detail.project) {
    return <EmptyState icon={<Wand2 className="h-5 w-5" aria-hidden="true" />} title="Select a project to open the workbench" body="The editor is now project-bound. Upload or select media before running enhancement actions." />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel
        title={detail.project.project_name}
        eyebrow={selectedFrame ? `Frame ${selectedFrame.frame_index}` : "Media workbench"}
        action={
          <div className="flex flex-wrap gap-2">
            <AuraButton variant="secondary" disabled={!accessToken} icon={<Wand2 className="h-4 w-4" aria-hidden="true" />} onClick={() => void queueEnhance()}>
              Enhance
            </AuraButton>
            <AuraButton variant="ghost" disabled={!accessToken} icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={() => void queueExport()}>
              Export
            </AuraButton>
          </div>
        }
      >
        <FrameCanvas imageUrl={stageUrl ?? null} detections={selectedFrame?.detections ?? []} />
        <div className="mt-4 rounded-lg border border-white/10 bg-background-dark/55 p-3">
          {detail.frames.length ? (
            <div className="grid grid-flow-col auto-cols-[92px] gap-2 overflow-x-auto pb-2">
              {detail.frames.map((frame) => {
                const src = signedFrames[frame.id];
                const active = selectedFrame?.id === frame.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setSelectedFrameId(frame.id)}
                    className={`rounded-md border p-1 text-left transition ${active ? "border-accent-cyan bg-accent-cyan/10" : "border-white/10 bg-white/[0.03] hover:border-accent-cyan/40"}`}
                  >
                    <span className="block aspect-video overflow-hidden rounded bg-background-panel">
                      {src ? <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="grid h-full place-items-center text-[10px] text-text-muted">Signing</span>}
                    </span>
                    <span className="mt-1 block text-center text-[11px] font-bold text-text-muted">{frame.frame_index}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={<Layers3 className="h-5 w-5" aria-hidden="true" />} title="No frame assets yet" body="The worker must create thumbnails before the timeline can show frame-level controls." />
          )}
        </div>
      </Panel>

      <Panel title="Controls" eyebrow="Model profile">
        <div className="grid gap-3">
          <ControlRow icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />} label="Scale target" value="4x" />
          <ControlRow icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Denoise" value="Balanced" />
          <ControlRow icon={<ScanFace className="h-4 w-4" aria-hidden="true" />} label="Faces" value={`${selectedFrame?.detections?.length ?? 0} detected`} />
          <ControlRow icon={<Gauge className="h-4 w-4" aria-hidden="true" />} label="Status" value={detail.project.status} />
        </div>
        {actionState ? <p className="mt-4 rounded-lg border border-white/10 bg-background-dark/55 p-3 text-sm leading-6 text-text-muted">{actionState}</p> : null}
      </Panel>
    </div>
  );
}

function ControlRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-background-dark/45 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-md border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">{icon}</span>
        <span className="truncate text-sm font-bold text-text-main">{label}</span>
      </div>
      <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold capitalize text-text-muted">{value}</span>
    </div>
  );
}

function IdentityPage({ detail }: { detail: ReturnType<typeof useProjectDetail> }) {
  const detectionFrames = detail.frames.filter((frame) => frame.detections?.length);
  const faceCount = detectionFrames.reduce((total, frame) => total + (frame.detections?.length ?? 0), 0);
  const detectJobs = detail.jobs.filter((job) => job.job_type === "detect_faces" || job.job_type === "blur_face");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Identity Review" eyebrow="Project scoped">
        {detail.project ? (
          detectionFrames.length ? (
            <div className="grid gap-3">
              {detectionFrames.map((frame) => (
                <div key={frame.id} className="rounded-lg border border-white/10 bg-background-dark/45 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-text-main">Frame {frame.frame_index}</h3>
                    <span className="text-xs font-bold text-text-muted">{frame.detections.length} detections</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {frame.detections.map((face) => (
                      <div key={`${frame.id}-${face.faceId}`} className="rounded-md border border-accent-cyan/15 bg-accent-cyan/10 p-3">
                        <p className="text-sm font-black text-text-main">{face.faceId}</p>
                        <p className="mt-1 text-xs text-text-muted">{Math.round(face.confidence * 100)}% confidence</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Fingerprint className="h-5 w-5" aria-hidden="true" />} title="No identity detections yet" body="Run identity indexing and wait for worker output before reviewing faces." />
          )
        ) : (
          <EmptyState icon={<Fingerprint className="h-5 w-5" aria-hidden="true" />} title="Select a project" body="Identity review is scoped to one project at a time." />
        )}
      </Panel>
      <Panel title="Identity Pipeline" eyebrow="Signals">
        <div className="grid gap-3">
          <InfoTile icon={<ScanFace className="h-4 w-4" aria-hidden="true" />} label="Detected faces" value={faceCount.toString()} />
          <InfoTile icon={<Database className="h-4 w-4" aria-hidden="true" />} label="Identity jobs" value={detectJobs.length.toString()} />
          <InfoTile icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} label="Scope" value="Owner locked" />
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-background-dark/45 p-4 text-sm leading-6 text-text-muted">
          The UI no longer invents identity rows. It shows detections only after real frame data exists.
        </div>
      </Panel>
    </div>
  );
}

function ExportsPage({ detail, accessToken }: { detail: ReturnType<typeof useProjectDetail>; accessToken?: string }) {
  const processedUrl = useSignedProjectAsset("processed-media", detail.project?.storage_path_hd, accessToken);
  const originalUrl = useSignedProjectAsset("original-media", detail.project?.storage_path_original, accessToken);
  const exportJobs = detail.jobs.filter((job) => job.job_type === "stitch_video" || job.job_type === "upscale_video" || job.job_type === "upscale_image");

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Export Center" eyebrow="Deliverables">
        {detail.project ? (
          <div className="grid gap-3">
            <ExportRow label="Original source" detail={detail.project.storage_path_original} href={originalUrl} ready={Boolean(originalUrl)} />
            <ExportRow label="Enhanced output" detail={detail.project.storage_path_hd ?? "No processed asset yet"} href={processedUrl} ready={Boolean(processedUrl)} />
            <ExportRow label="Frame thumbnails" detail={`${detail.frames.length} frame assets`} ready={detail.frames.length > 0} />
          </div>
        ) : (
          <EmptyState icon={<Archive className="h-5 w-5" aria-hidden="true" />} title="No project selected" body="Select a project to inspect available source and processed assets." />
        )}
      </Panel>
      <Panel title="Export Jobs" eyebrow="Assembly">
        {exportJobs.length ? (
          <div className="grid gap-2">
            {exportJobs.map((job) => (
              <div key={job.id} className="rounded-lg border border-white/10 bg-background-dark/45 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black capitalize text-text-main">{formatJobType(job.job_type)}</p>
                  <StatusPill status={job.status} />
                </div>
                <p className="truncate text-xs text-text-muted">{job.id}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Download className="h-5 w-5" aria-hidden="true" />} title="No export jobs" body="Run export assembly from the Workbench once processed media is available." />
        )}
      </Panel>
    </div>
  );
}

function ExportRow({ label, detail, href, ready }: { label: string; detail: string; href?: string | null; ready: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-background-dark/45 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2">
          {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" /> : <CircleAlert className="h-4 w-4 text-text-muted" aria-hidden="true" />}
          <h3 className="text-sm font-black text-text-main">{label}</h3>
        </div>
        <p className="truncate text-xs text-text-muted">{detail}</p>
      </div>
      {href ? (
        <a className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent-cyan/25 bg-accent-cyan/10 px-3 text-sm font-bold text-accent-cyan" href={href} target="_blank" rel="noreferrer">
          <Download className="h-4 w-4" aria-hidden="true" />
          Open
        </a>
      ) : (
        <span className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-text-muted">Pending</span>
      )}
    </div>
  );
}

function SystemPage({ signedIn, detail }: { signedIn: boolean; detail: ReturnType<typeof useProjectDetail> }) {
  const checks = [
    { label: "Browser configuration", state: isSupabaseConfigured, body: isSupabaseConfigured ? "Public Supabase URL and anon key are available." : "Public Supabase URL and anon key are missing in this runtime." },
    { label: "Authenticated session", state: signedIn, body: "Required for private media and project actions." },
    { label: "Project selected", state: Boolean(detail.project), body: "Required for workbench, identity, and export views." },
    { label: "Worker output", state: detail.frames.length > 0 || Boolean(detail.project?.storage_path_hd), body: "Requires a running queue worker outside Vercel." },
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Readiness" eyebrow="Platform state">
        <div className="grid gap-3">
          {checks.map((check) => (
            <div key={check.label} className="rounded-lg border border-white/10 bg-background-dark/45 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-text-main">{check.label}</h3>
                {check.state ? <CheckCircle2 className="h-5 w-5 text-emerald-300" aria-hidden="true" /> : <XCircle className="h-5 w-5 text-amber-300" aria-hidden="true" />}
              </div>
              <p className="text-sm leading-6 text-text-muted">{check.body}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Architecture" eyebrow="Runtime map">
        <div className="grid gap-3">
          <ControlRow icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />} label="Intake" value="Vercel API" />
          <ControlRow icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />} label="Storage" value="Supabase private" />
          <ControlRow icon={<Activity className="h-4 w-4" aria-hidden="true" />} label="Queue" value="Postgres RPC" />
          <ControlRow icon={<Sparkles className="h-4 w-4" aria-hidden="true" />} label="Processing" value="External worker" />
        </div>
        <p className="mt-4 rounded-lg border border-accent-cyan/15 bg-accent-cyan/10 p-4 text-sm leading-6 text-cyan-100">
          The platform is now honest about worker readiness instead of implying Vercel is running long media jobs.
        </p>
      </Panel>
    </div>
  );
}

export default function App() {
  const { session, isLoading } = useSupabaseSession();
  const [activeSuite, setActiveSuite] = useState<SuiteId>("operations");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { projects, isLoading: projectsLoading } = useProjects(session?.access_token, refreshKey);
  const detail = useProjectDetail(selectedProjectId, session?.access_token, refreshKey);

  useEffect(() => {
    if (!selectedProjectId && projects[0]) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  const page = useMemo(() => {
    if (isLoading) {
      return <EmptyState icon={<Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} title="Loading AuraFlow" body="Restoring your secure workspace session." />;
    }

    if (activeSuite === "intake") {
      return <IntakePage session={session} onQueued={refresh} projects={projects} />;
    }

    if (activeSuite === "workbench") {
      return <WorkbenchPage detail={detail} accessToken={session?.access_token} onJobQueued={refresh} />;
    }

    if (activeSuite === "identity") {
      return <IdentityPage detail={detail} />;
    }

    if (activeSuite === "exports") {
      return <ExportsPage detail={detail} accessToken={session?.access_token} />;
    }

    if (activeSuite === "system") {
      return <SystemPage signedIn={Boolean(session)} detail={detail} />;
    }

    return (
      <OperationsPage
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        projectLoading={projectsLoading}
        detail={detail}
        search={search}
      />
    );
  }, [activeSuite, detail, isLoading, projects, projectsLoading, search, selectedProjectId, session]);

  return (
    <AuraFlowProvider>
      <div className="min-h-screen bg-aurora-field text-text-main">
        <div className="constellation-layer pointer-events-none fixed inset-0" aria-hidden="true" />
        <div className="relative flex min-h-screen">
          <Sidebar activeSuite={activeSuite} onSuiteChange={setActiveSuite} />
          <main className="min-w-0 flex-1">
            <TopBar activeSuite={activeSuite} signedIn={Boolean(session)} search={search} setSearch={setSearch} />
            <MobileSuiteBar activeSuite={activeSuite} onSuiteChange={setActiveSuite} />
            <div className="p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md border border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan">
                    <Command className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase text-text-muted">Current project</p>
                    <p className="truncate text-sm font-black text-text-main">{detail.project?.project_name ?? "No project selected"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AuraButton variant="ghost" icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />} onClick={refresh}>
                    Refresh
                  </AuraButton>
                  {session ? (
                    <AuraButton variant="danger" icon={<LogOut className="h-4 w-4" aria-hidden="true" />} onClick={() => void supabase.auth.signOut()}>
                      Sign out
                    </AuraButton>
                  ) : null}
                </div>
              </div>
              {page}
            </div>
          </main>
        </div>
      </div>
    </AuraFlowProvider>
  );
}
