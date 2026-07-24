import { ReactNode, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Bell,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  DatabaseZap,
  Download,
  FileVideo,
  Fingerprint,
  Gauge,
  HardDriveUpload,
  Image,
  Layers3,
  LayoutGrid,
  ListChecks,
  LockKeyhole,
  LogOut,
  PanelRight,
  Play,
  ScanFace,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "./api/supabase";
import { AuraFlowProvider } from "./theme/AuraFlowProvider";
import { AuraButton } from "./components/AuraButton";
import { AuraCard } from "./components/AuraCard";
import { FrameCanvas } from "./components/FrameCanvas";
import { ProjectMonitor } from "./components/ProjectMonitor";
import { ProjectUploader } from "./components/ProjectUploader";
import { VideoTimeline } from "./components/VideoTimeline";
import { useFrameEditor } from "./hooks/useFrameEditor";
import { useSupabaseSession } from "./hooks/useSupabaseSession";
import type { FrameAsset } from "./types/media";

type SuiteId = "operations" | "intake" | "enhance" | "identity" | "exports" | "settings";

const demoFrames: FrameAsset[] = Array.from({ length: 18 }, (_, index) => ({
  id: `frame-${index}`,
  project_id: "demo-project",
  frame_index: index * 24,
  thumbnail_path: `https://picsum.photos/seed/auraflow-frame-${index}/240/135`,
  enhanced_path: null,
  detections:
    index === 5 || index === 9
      ? [{ faceId: index === 5 ? "ID-014" : "ID-027", boundingBox: [410, 124, 628, 382], confidence: 0.98 }]
      : [],
}));

const suites = [
  { id: "operations", label: "Operations", icon: LayoutGrid },
  { id: "intake", label: "Intake", icon: UploadCloud },
  { id: "enhance", label: "Enhance Lab", icon: Wand2 },
  { id: "identity", label: "Identity Graph", icon: Fingerprint },
  { id: "exports", label: "Exports", icon: Archive },
  { id: "settings", label: "System", icon: Settings },
] satisfies Array<{ id: SuiteId; label: string; icon: typeof Activity }>;

const operatingMetrics = [
  { label: "Active queue", value: "12", detail: "5 running", icon: Activity, tone: "text-accent-cyan" },
  { label: "Median latency", value: "2.4s", detail: "API handoff", icon: Clock3, tone: "text-accent-light-blue" },
  { label: "Enhancement", value: "4K", detail: "target output", icon: Gauge, tone: "text-accent-violet" },
  { label: "Vector index", value: "512D", detail: "pgvector", icon: DatabaseZap, tone: "text-emerald-300" },
];

const queueRows = [
  { id: "job_81", type: "upscale_video", project: "Warehouse camera 03", state: "running", eta: "04:18", worker: "gpu-worker-1" },
  { id: "job_82", type: "detect_faces", project: "Lobby stills", state: "queued", eta: "pending", worker: "unassigned" },
  { id: "job_83", type: "stitch_video", project: "Street clip", state: "running", eta: "01:12", worker: "media-worker-2" },
  { id: "job_84", type: "enhance_frame", project: "Frame review", state: "completed", eta: "done", worker: "media-worker-1" },
];

const identities = [
  { id: "ID-014", label: "Primary subject", confidence: "98.4%", frames: 42, state: "Verified", lastSeen: "00:18:12" },
  { id: "ID-027", label: "Secondary subject", confidence: "94.1%", frames: 18, state: "Review", lastSeen: "00:09:45" },
  { id: "ID-031", label: "Candidate match", confidence: "89.7%", frames: 9, state: "Candidate", lastSeen: "00:04:28" },
  { id: "ID-044", label: "Occluded profile", confidence: "76.2%", frames: 5, state: "Low signal", lastSeen: "00:02:02" },
];

const exportRows = [
  { asset: "Enhanced master", format: "MP4 H.264", status: "Ready", size: "1.8 GB" },
  { asset: "Frame thumbnails", format: "WebP strip", status: "Ready", size: "88 MB" },
  { asset: "Identity report", format: "JSON", status: "Queued", size: "pending" },
  { asset: "Audit package", format: "ZIP", status: "Draft", size: "pending" },
];

function StatusPill({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "purple" | "green" | "amber" | "slate" }) {
  const tones = {
    cyan: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
    purple: "border-accent-violet/30 bg-accent-purple/15 text-accent-violet",
    green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-300",
    amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    slate: "border-white/10 bg-white/5 text-text-muted",
  };

  return <span className={`inline-flex whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
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
    <section className={`glass-panel rounded-lg p-4 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="mb-1 text-[11px] font-bold uppercase text-accent-cyan">{eyebrow}</p> : null}
          <h2 className="text-base font-bold text-text-main">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ label, value, detail, icon: Icon, tone }: (typeof operatingMetrics)[number]) {
  return (
    <div className="rounded-lg border border-white/10 bg-background-panel/65 p-4">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
        </div>
        <CircleDot className="h-4 w-4 text-emerald-300" aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold text-text-muted">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <p className="text-2xl font-black text-text-main">{value}</p>
        <p className="text-xs font-medium text-text-muted">{detail}</p>
      </div>
    </div>
  );
}

function Sidebar({ activeSuite, onSelect }: { activeSuite: SuiteId; onSelect: (suite: SuiteId) => void }) {
  return (
    <aside className="hidden min-h-screen border-r border-white/10 bg-background-dark/55 px-4 py-4 backdrop-blur-xl lg:block">
      <button className="mb-6 flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left" type="button">
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 text-sm font-black text-accent-cyan">
          AF
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-text-main">AuraFlow</span>
          <span className="block truncate text-xs font-medium text-text-muted">AI media operations</span>
        </span>
      </button>

      <nav className="grid gap-1" aria-label="Application suites">
        {suites.map((suite) => {
          const Icon = suite.icon;
          const active = suite.id === activeSuite;
          return (
            <button
              key={suite.id}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
                active
                  ? "border border-accent-cyan/25 bg-accent-cyan/10 text-text-main shadow-cyan-glow"
                  : "border border-transparent text-text-muted hover:border-white/10 hover:bg-white/5 hover:text-text-main"
              }`}
              type="button"
              onClick={() => onSelect(suite.id)}
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

function TopBar({ activeSuite, signedIn }: { activeSuite: SuiteId; signedIn: boolean }) {
  const current = suites.find((suite) => suite.id === activeSuite);
  return (
    <header className="border-b border-white/10 bg-background-dark/75 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={signedIn ? "green" : "amber"}>{signedIn ? "Authenticated" : "Auth required"}</StatusPill>
            <StatusPill tone={isSupabaseConfigured ? "green" : "amber"}>{isSupabaseConfigured ? "Supabase linked" : "Supabase env missing"}</StatusPill>
            <StatusPill tone="purple">Vercel production</StatusPill>
          </div>
          <h1 className="mt-2 text-xl font-black tracking-normal text-text-main sm:text-2xl">{current?.label}</h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-md border border-white/10 bg-background-panel/80 px-3 text-sm text-text-muted xl:w-80">
            <Search className="h-4 w-4 shrink-0 text-accent-cyan" aria-hidden="true" />
            <input className="min-w-0 flex-1 bg-transparent text-text-main outline-none placeholder:text-text-muted" placeholder="Search projects, jobs, identities" />
          </label>
          <AuraButton variant="ghost" icon={<Bell className="h-4 w-4" aria-hidden="true" />} aria-label="Open alerts" />
          {signedIn ? (
            <AuraButton variant="ghost" icon={<LogOut className="h-4 w-4" aria-hidden="true" />} onClick={() => void supabase.auth.signOut()}>
              Sign out
            </AuraButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MobileSuiteBar({ activeSuite, onSelect }: { activeSuite: SuiteId; onSelect: (suite: SuiteId) => void }) {
  return (
    <div className="border-b border-white/10 bg-background-dark/75 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 text-xs font-black text-accent-cyan">
          AF
        </span>
        <div>
          <p className="text-sm font-black text-text-main">AuraFlow</p>
          <p className="text-xs text-text-muted">AI media operations</p>
        </div>
      </div>
      <div className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-1">
        {suites.map((suite) => {
          const Icon = suite.icon;
          const active = suite.id === activeSuite;
          return (
            <button
              key={suite.id}
              type="button"
              onClick={() => onSelect(suite.id)}
              className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold ${
                active ? "border-accent-cyan/40 bg-accent-cyan/10 text-text-main" : "border-white/10 bg-white/5 text-text-muted"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {suite.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QueueTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/5 text-xs text-text-muted">
          <tr>
            <th className="px-3 py-2 font-semibold">Job</th>
            <th className="px-3 py-2 font-semibold">Project</th>
            <th className="px-3 py-2 font-semibold">State</th>
            <th className="px-3 py-2 font-semibold">Worker</th>
            <th className="px-3 py-2 text-right font-semibold">ETA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {queueRows.map((job) => (
            <tr key={job.id} className="bg-background-dark/45">
              <td className="px-3 py-3">
                <p className="font-semibold text-text-main">{job.type}</p>
                <p className="text-xs text-text-muted">{job.id}</p>
              </td>
              <td className="px-3 py-3 text-text-muted">{job.project}</td>
              <td className="px-3 py-3">
                <StatusPill tone={job.state === "completed" ? "green" : job.state === "running" ? "cyan" : "slate"}>{job.state}</StatusPill>
              </td>
              <td className="px-3 py-3 text-text-muted">{job.worker}</td>
              <td className="px-3 py-3 text-right font-semibold text-text-main">{job.eta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OperationsPage({ session, refreshKey }: { session: ReturnType<typeof useSupabaseSession>["session"]; refreshKey: number }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {operatingMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Processing Queue"
          eyebrow="Live operations"
          action={
            <AuraButton variant="secondary" disabled={!session} icon={<Play className="h-4 w-4" aria-hidden="true" />}>
              Run queue
            </AuraButton>
          }
        >
          <QueueTable />
        </Panel>
        <ProjectMonitor session={session} refreshKey={refreshKey} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <AuraCard eyebrow="Ingest" title="Private Media Intake" description="Signed uploads place source files into owner-scoped storage paths." icon={<HardDriveUpload className="h-5 w-5" aria-hidden="true" />} />
        <AuraCard eyebrow="Workers" title="Stateless Processing" description="Jobs are claimed through RPC locks and processed outside the request path." icon={<Boxes className="h-5 w-5" aria-hidden="true" />} />
        <AuraCard eyebrow="Index" title="Vector Search Ready" description="Facial embeddings use pgvector for cosine similarity over owned project data." icon={<DatabaseZap className="h-5 w-5" aria-hidden="true" />} />
      </div>
    </div>
  );
}

function IntakePage({ session, onQueued }: { session: ReturnType<typeof useSupabaseSession>["session"]; onQueued: () => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <ProjectUploader session={session} onQueued={onQueued} />
      <Panel title="Media Intake Policy" eyebrow="Upload contract">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: FileVideo, title: "Video", body: "MP4 or MOV up to 8 GB" },
            { icon: Image, title: "Image", body: "PNG, JPEG, WebP sources" },
            { icon: LockKeyhole, title: "Storage", body: "Private buckets and signed URLs" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-white/10 bg-background-dark/55 p-4">
                <Icon className="mb-4 h-5 w-5 text-accent-cyan" aria-hidden="true" />
                <h3 className="font-semibold text-text-main">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Staging Checklist" eyebrow="Before processing" className="xl:col-span-2">
        <div className="grid gap-2 md:grid-cols-2">
          {["Source uploaded", "Project owner verified", "Enhancement jobs queued", "Identity indexing queued"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-background-dark/50 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span className="text-sm font-medium text-text-main">{item}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function EnhancePage({ session }: { session: ReturnType<typeof useSupabaseSession>["session"] }) {
  const editor = useFrameEditor({ projectId: "demo-project", totalFrames: 432, accessToken: session?.access_token });
  const current = useMemo(() => demoFrames.find((frame) => frame.frame_index === editor.currentFrame) ?? demoFrames[0], [editor.currentFrame]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel
        title="Frame Workbench"
        eyebrow={`Frame ${current.frame_index}`}
        action={
          <div className="flex flex-wrap gap-2">
            <AuraButton variant="secondary" disabled={!session} icon={<Wand2 className="h-4 w-4" aria-hidden="true" />} onClick={() => void editor.enhanceFrame()}>
              Enhance
            </AuraButton>
            <AuraButton variant="ghost" disabled={!session} icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={() => void editor.stitchVideo(24)}>
              Export
            </AuraButton>
          </div>
        }
      >
        <div className="grid gap-4">
          <FrameCanvas imageUrl="https://picsum.photos/seed/auraflow-command-viewer/1280/720" detections={[{ faceId: "ID-014", boundingBox: [410, 124, 628, 382], confidence: 0.98 }]} />
          <VideoTimeline frames={demoFrames} currentFrame={editor.currentFrame} totalFrames={432} isLoading={editor.isLoading} onFrameChange={editor.setCurrentFrame} />
        </div>
      </Panel>

      <Panel title="Model Controls" eyebrow="Enhancement profile">
        <div className="grid gap-4">
          {[
            { label: "Scale", value: "4x", icon: SlidersHorizontal },
            { label: "Temporal lock", value: "Enabled", icon: Layers3 },
            { label: "Denoise", value: "Balanced", icon: Sparkles },
            { label: "Face masks", value: "Overlay", icon: ScanFace },
          ].map((control) => {
            const Icon = control.icon;
            return (
              <div key={control.label} className="flex items-center justify-between rounded-md border border-white/10 bg-background-dark/55 px-3 py-3">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-accent-cyan" aria-hidden="true" />
                  <span className="text-sm font-semibold text-text-main">{control.label}</span>
                </div>
                <StatusPill tone="slate">{control.value}</StatusPill>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function IdentityPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title="Identity Registry" eyebrow="Face embeddings">
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs text-text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Identity</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Frames</th>
                <th className="px-3 py-2 font-semibold">Last seen</th>
                <th className="px-3 py-2 font-semibold">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {identities.map((identity) => (
                <tr key={identity.id} className="bg-background-dark/45">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-text-main">{identity.id}</p>
                    <p className="text-xs text-text-muted">{identity.label}</p>
                  </td>
                  <td className="px-3 py-3 text-text-muted">{identity.confidence}</td>
                  <td className="px-3 py-3 text-text-muted">{identity.frames}</td>
                  <td className="px-3 py-3 text-text-muted">{identity.lastSeen}</td>
                  <td className="px-3 py-3">
                    <StatusPill tone={identity.state === "Verified" ? "green" : identity.state === "Review" ? "amber" : "purple"}>{identity.state}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Similarity Search" eyebrow="pgvector">
        <div className="grid gap-3">
          <div className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/10 p-4">
            <BrainCircuit className="mb-4 h-5 w-5 text-accent-cyan" aria-hidden="true" />
            <p className="text-sm font-semibold text-text-main">ArcFace-compatible vector store</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">Embeddings are scoped by project ownership before similarity search.</p>
          </div>
          <AuraButton variant="secondary" icon={<Search className="h-4 w-4" aria-hidden="true" />}>
            Run match query
          </AuraButton>
        </div>
      </Panel>
    </div>
  );
}

function ExportsPage() {
  return (
    <div className="grid gap-5">
      <Panel title="Export Center" eyebrow="Deliverables">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {exportRows.map((row) => (
            <div key={row.asset} className="rounded-lg border border-white/10 bg-background-dark/55 p-4">
              <div className="mb-4 flex items-center justify-between">
                <Archive className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
                <StatusPill tone={row.status === "Ready" ? "green" : row.status === "Queued" ? "cyan" : "slate"}>{row.status}</StatusPill>
              </div>
              <h3 className="font-semibold text-text-main">{row.asset}</h3>
              <p className="mt-1 text-sm text-text-muted">{row.format}</p>
              <p className="mt-4 text-xs font-semibold text-text-muted">{row.size}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Audit Trail" eyebrow="Chain of custody">
        <div className="grid gap-2">
          {["Upload signed", "Enhancement model selected", "Worker output stored", "Export manifest generated"].map((event, index) => (
            <div key={event} className="flex items-center justify-between rounded-md border border-white/10 bg-background-dark/50 px-3 py-2">
              <span className="text-sm font-medium text-text-main">{event}</span>
              <span className="text-xs text-text-muted">Step {index + 1}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Environment" eyebrow="Deployment state">
        <div className="grid gap-2">
          {[
            { key: "VITE_SUPABASE_URL", ok: isSupabaseConfigured },
            { key: "VITE_SUPABASE_ANON_KEY", ok: isSupabaseConfigured },
            { key: "SUPABASE_URL", ok: false },
            { key: "SUPABASE_SERVICE_ROLE_KEY", ok: false },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-md border border-white/10 bg-background-dark/55 px-3 py-2">
              <span className="text-sm font-semibold text-text-main">{item.key}</span>
              <StatusPill tone={item.ok ? "green" : "amber"}>{item.ok ? "Detected" : "Required"}</StatusPill>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="System Guardrails" eyebrow="Access control">
        <div className="grid gap-3">
          <AuraCard eyebrow="RLS" title="Project ownership" description="Projects, jobs, frames, and embeddings are restricted by authenticated user ownership." icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} />
          <AuraCard eyebrow="Storage" title="Private buckets" description="Source, output, and thumbnail assets stay behind signed URL flows." icon={<Database className="h-5 w-5" aria-hidden="true" />} />
        </div>
      </Panel>
    </div>
  );
}

function SuiteContent({ activeSuite, session, refreshKey, onQueued }: { activeSuite: SuiteId; session: ReturnType<typeof useSupabaseSession>["session"]; refreshKey: number; onQueued: () => void }) {
  if (activeSuite === "intake") return <IntakePage session={session} onQueued={onQueued} />;
  if (activeSuite === "enhance") return <EnhancePage session={session} />;
  if (activeSuite === "identity") return <IdentityPage />;
  if (activeSuite === "exports") return <ExportsPage />;
  if (activeSuite === "settings") return <SettingsPage />;
  return <OperationsPage session={session} refreshKey={refreshKey} />;
}

function AppShell() {
  const { session } = useSupabaseSession();
  const [activeSuite, setActiveSuite] = useState<SuiteId>("operations");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <Sidebar activeSuite={activeSuite} onSelect={setActiveSuite} />
      <div className="min-w-0">
        <MobileSuiteBar activeSuite={activeSuite} onSelect={setActiveSuite} />
        <TopBar activeSuite={activeSuite} signedIn={Boolean(session)} />
        <main className="px-4 py-5 sm:px-6">
          <SuiteContent activeSuite={activeSuite} session={session} refreshKey={refreshKey} onQueued={() => setRefreshKey((value) => value + 1)} />
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuraFlowProvider>
      <AppShell />
    </AuraFlowProvider>
  );
}
