import { Film, ScanFace, Sparkles, Wand2 } from "lucide-react";
import { AuraFlowProvider } from "./theme/AuraFlowProvider";
import { AuraButton } from "./components/AuraButton";
import { AuraCard } from "./components/AuraCard";
import { FrameCanvas } from "./components/FrameCanvas";
import { VideoTimeline } from "./components/VideoTimeline";
import { useFrameEditor } from "./hooks/useFrameEditor";
import type { FrameAsset } from "./types/media";

const demoFrames: FrameAsset[] = Array.from({ length: 16 }, (_, index) => ({
  id: `frame-${index}`,
  project_id: "demo-project",
  frame_index: index * 24,
  thumbnail_path: `https://picsum.photos/seed/auraflow-${index}/240/135`,
  enhanced_path: null,
  detections: index === 4 ? [{ faceId: "PERSON_A", boundingBox: [410, 124, 628, 382], confidence: 0.98 }] : [],
}));

function DemoWorkspace() {
  const editor = useFrameEditor({ projectId: "demo-project", totalFrames: 384 });
  const current = demoFrames.find((frame) => frame.frame_index === editor.currentFrame) ?? demoFrames[0];

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <nav className="glass-panel mb-12 flex items-center justify-between rounded-lg px-4 py-3">
          <a className="font-display text-xl font-black text-accent-cyan" href="/" aria-label="AuraFlow home">
            AuraFlow
          </a>
          <div className="hidden items-center gap-7 text-sm text-text-muted md:flex">
            {["Home", "Services", "Templates", "Portfolio", "Pricing", "Blog", "About"].map((item) => (
              <a key={item} className="transition hover:text-text-main" href={`#${item.toLowerCase()}`}>
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <AuraButton aria-label="Request a quote">Get a Quote</AuraButton>
            <AuraButton variant="icon-purple" aria-label="Open profile menu">E</AuraButton>
          </div>
        </nav>

        <div className="relative mb-10 pt-8">
          <span className="glass-panel absolute left-0 top-0 rounded-md px-4 py-3 text-sm font-bold">50+ Templates</span>
          <span className="glass-panel absolute right-0 top-14 hidden rounded-md px-4 py-3 text-sm font-bold sm:inline-flex">
            Fast Delivery
          </span>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 bg-white/10 font-display text-2xl font-black shadow-purple-glow">
            AF
          </div>
          <h1 className="mx-auto max-w-5xl text-center font-display text-4xl font-black leading-tight text-white sm:text-6xl lg:text-7xl">
            We Build Digital Experiences That <span className="bg-cta-cyan bg-clip-text text-transparent">Scale</span> People
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-7 text-text-muted sm:text-lg">
            Premium media enhancement, intelligent identity indexing, and frame-accurate editing in one async workspace.
          </p>
        </div>

        <div className="grid gap-5">
          <FrameCanvas
            imageUrl="https://picsum.photos/seed/auraflow-viewer/1280/720"
            detections={[{ faceId: "PERSON_A", boundingBox: [410, 124, 628, 382], confidence: 0.98 }]}
          />
          <VideoTimeline
            frames={demoFrames}
            currentFrame={editor.currentFrame}
            totalFrames={384}
            isLoading={editor.isLoading}
            onFrameChange={editor.setCurrentFrame}
          />
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <AuraCard
          eyebrow="Super-resolution"
          title="HD/4K Upscaling"
          description="FFmpeg workers extract frames, run Real-ESRGAN or temporal video restoration, and reassemble synchronized outputs."
          icon={<Wand2 className="h-5 w-5" aria-hidden="true" />}
        />
        <AuraCard
          eyebrow="Identity graph"
          title="Face Recognition"
          description="InsightFace embeddings are indexed with pgvector for fast cosine similarity search inside owned projects."
          icon={<ScanFace className="h-5 w-5" aria-hidden="true" />}
        />
        <AuraCard
          eyebrow="Async queue"
          title="Worker Orchestration"
          description="UI actions enqueue stateless processing jobs while workers handle FFmpeg, enhancement, detection, and stitching."
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="grid grid-cols-2 gap-2">
            <AuraButton variant="ghost" icon={<Film className="h-4 w-4" aria-hidden="true" />} onClick={() => void editor.enhanceFrame()}>
              Enhance
            </AuraButton>
            <AuraButton variant="ghost" onClick={() => void editor.stitchVideo(24)}>
              Stitch
            </AuraButton>
          </div>
        </AuraCard>
      </aside>
    </main>
  );
}

export function App() {
  return (
    <AuraFlowProvider>
      <DemoWorkspace />
    </AuraFlowProvider>
  );
}
