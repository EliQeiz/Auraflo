import { ReactNode, useMemo, useState } from "react";
import {
  Activity,
  Aperture,
  Archive,
  Boxes,
  ChevronRight,
  Clock3,
  DatabaseZap,
  Download,
  Fingerprint,
  Gauge,
  Layers3,
  LockKeyhole,
  LogOut,
  Play,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { supabase } from "./api/supabase";
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

const navItems = [
  { label: "Command", icon: Activity },
  { label: "Intake", icon: UploadCloud },
  { label: "Enhance", icon: Wand2 },
  { label: "Identity", icon: Fingerprint },
  { label: "Archive", icon: Archive },
];

const metrics = [
  { label: "Queue latency", value: "2.4s", tone: "text-accent-cyan", icon: Clock3 },
  { label: "Enhancement target", value: "4K", tone: "text-accent-light-blue", icon: Gauge },
  { label: "Indexed vectors", value: "512D", tone: "text-accent-violet", icon: DatabaseZap },
  { label: "Access mode", value: "RLS", tone: "text-emerald-300", icon: ShieldCheck },
];

const modelStages = [
  { name: "Media ingest", detail: "Signed upload, owner-bound storage path", state: "Ready", icon: UploadCloud },
  { name: "Frame extraction", detail: "FFmpeg thumbnails and source staging", state: "Worker", icon: Aperture },
  { name: "Resolution recovery", detail: "Sharp fallback with AI model adapter slots", state: "Online", icon: Sparkles },
  { name: "Identity indexing", detail: "pgvector embeddings and similarity search", state: "Guarded", icon: ScanFace },
];

const identities = [
  { id: "ID-014", confidence: "98.4%", frames: 42, status: "Verified" },
  { id: "ID-027", confidence: "94.1%", frames: 18, status: "Review" },
  { id: "ID-031", confidence: "89.7%", frames: 9, status: "Candidate" },
];

function StatusPill({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "purple" | "green" | "amber" }) {
  const tones = {
    cyan: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
    purple: "border-accent-violet/30 bg-accent-purple/15 text-accent-violet",
    green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-300",
    amber: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  };

  return <span className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function MetricTile({ label, value, tone, icon: Icon }: (typeof metrics)[number]) {
  return (
    <div className="glass-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
        <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.75)]" />
      </div>
      <p className="text-xs font-semibold uppercase text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-text-main">{value}</p>
    </div>
  );
}

function AppSidebar() {
  return (
    <aside className="hidden border-r border-white/10 bg-background-dark/45 px-4 py-5 backdrop-blur-xl lg:block">
      <a className="mb-10 flex items-center gap-3" href="/" aria-label="AuraFlow command center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 font-display font-black text-accent-cyan">
          AF
        </span>
        <span>
          <span className="block font-display text-lg font-black text-text-main">AuraFlow</span>
          <span className="block text-xs font-semibold text-text-muted">Media Intelligence OS</span>
        </span>
      </a>

      <nav className="grid gap-2" aria-label="Primary">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                index === 0
                  ? "border border-accent-cyan/25 bg-accent-cyan/10 text-text-main shadow-cyan-glow"
                  : "text-text-muted hover:bg-white/5 hover:text-text-main"
              }`}
              href={`#${item.label.toLowerCase()}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background-dark/70 px-5 py-4 backdrop-blur-xl sm:px-7">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusPill tone={signedIn ? "green" : "amber"}>{signedIn ? "Authenticated" : "Auth Required"}</StatusPill>
            <StatusPill tone="purple">Async Workers</StatusPill>
          </div>
          <h1 className="mt-3 font-display text-xl font-black leading-tight text-text-main sm:text-3xl">
            Enhancement Command Center
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <AuraButton variant="secondary" disabled={!signedIn} icon={<Play className="h-4 w-4" aria-hidden="true" />}>
            Run Queue
          </AuraButton>
          {signedIn ? (
            <AuraButton variant="ghost" icon={<LogOut className="h-4 w-4" aria-hidden="true" />} onClick={() => void supabase.auth.signOut()}>
              Sign Out
            </AuraButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ProcessingStack() {
  return (
    <section className="glass-panel rounded-lg p-5" id="enhance" aria-label="Processing stack">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-main">Processing Stack</h2>
          <p className="mt-1 text-sm text-text-muted">Queue: processing_jobs · Storage: Supabase · Claiming: RPC lock</p>
        </div>
        <StatusPill>Stateless</StatusPill>
      </div>

      <div className="grid gap-3">
        {modelStages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.name} className="grid gap-3 rounded-lg border border-white/10 bg-background-dark/55 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-accent-cyan">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xs font-black text-accent-cyan">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-sm font-bold text-text-main">{stage.name}</h3>
                </div>
                <p className="mt-1 text-sm leading-6 text-text-muted">{stage.detail}</p>
              </div>
              <StatusPill tone={index === 3 ? "purple" : "cyan"}>{stage.state}</StatusPill>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IdentityIndex() {
  return (
    <section className="glass-panel rounded-lg p-5" id="identity" aria-label="Identity index">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text-main">Identity Index</h2>
          <p className="mt-1 text-sm text-text-muted">Clusters · Confidence · Frame coverage</p>
        </div>
        <Fingerprint className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Identity</th>
              <th className="px-4 py-3 font-bold">Confidence</th>
              <th className="px-4 py-3 font-bold">Frames</th>
              <th className="px-4 py-3 font-bold">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {identities.map((identity) => (
              <tr key={identity.id} className="bg-background-dark/45">
                <td className="px-4 py-3 font-bold text-text-main">{identity.id}</td>
                <td className="px-4 py-3 text-text-muted">{identity.confidence}</td>
                <td className="px-4 py-3 text-text-muted">{identity.frames}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={identity.status === "Verified" ? "green" : identity.status === "Review" ? "amber" : "purple"}>
                    {identity.status}
                  </StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EditorWorkspace() {
  const { session } = useSupabaseSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const editor = useFrameEditor({ projectId: "demo-project", totalFrames: 432, accessToken: session?.access_token });
  const current = useMemo(
    () => demoFrames.find((frame) => frame.frame_index === editor.currentFrame) ?? demoFrames[0],
    [editor.currentFrame],
  );

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
      <AppSidebar />
      <div className="min-w-0">
        <TopBar signedIn={Boolean(session)} />

        <main className="grid gap-6 px-5 py-6 sm:px-7 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="grid min-w-0 gap-6">
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricTile key={metric.label} {...metric} />
              ))}
            </div>

            <section className="grid gap-4 rounded-lg border border-white/10 bg-background-panel/55 p-4 shadow-card-glow" id="command">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StatusPill>Live Preview</StatusPill>
                    <StatusPill tone="purple">Frame {current.frame_index}</StatusPill>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-text-main">Frame Editor</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-text-muted">
                    Enhancement output · Identity overlays · Frame actions
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AuraButton
                    variant="secondary"
                    disabled={!session}
                    icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void editor.enhanceFrame()}
                  >
                    Enhance Frame
                  </AuraButton>
                  <AuraButton
                    variant="ghost"
                    disabled={!session}
                    icon={<Download className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void editor.stitchVideo(24)}
                  >
                    Export Master
                  </AuraButton>
                </div>
              </div>

              <FrameCanvas
                imageUrl="https://picsum.photos/seed/auraflow-command-viewer/1280/720"
                detections={[{ faceId: "ID-014", boundingBox: [410, 124, 628, 382], confidence: 0.98 }]}
              />
              <VideoTimeline
                frames={demoFrames}
                currentFrame={editor.currentFrame}
                totalFrames={432}
                isLoading={editor.isLoading}
                onFrameChange={editor.setCurrentFrame}
              />
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <ProcessingStack />
              <IdentityIndex />
            </div>
          </section>

          <aside className="grid content-start gap-5">
            <ProjectUploader session={session} onQueued={() => setRefreshKey((value) => value + 1)} />
            <ProjectMonitor session={session} refreshKey={refreshKey} />

            <AuraCard
              eyebrow="Security"
              title="Owner-Bound Media"
              description="Signed uploads, private buckets, user-scoped paths, and Supabase storage policies."
              icon={<LockKeyhole className="h-5 w-5" aria-hidden="true" />}
            />

            <AuraCard
              eyebrow="Infrastructure"
              title="Queue-First Processing"
              description="Fast API handoff with external workers for FFmpeg, enhancement, indexing, and exports."
              icon={<Boxes className="h-5 w-5" aria-hidden="true" />}
            >
              <div className="grid gap-2 text-sm text-text-muted">
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-background-dark/55 px-3 py-2">
                  <span>Original media</span>
                  <ChevronRight className="h-4 w-4 text-accent-cyan" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-background-dark/55 px-3 py-2">
                  <span>Processed assets</span>
                  <Layers3 className="h-4 w-4 text-accent-violet" aria-hidden="true" />
                </div>
              </div>
            </AuraCard>
          </aside>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuraFlowProvider>
      <EditorWorkspace />
    </AuraFlowProvider>
  );
}
