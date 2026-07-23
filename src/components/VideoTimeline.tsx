import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { FrameAsset } from "../types/media";

interface VideoTimelineProps {
  frames: FrameAsset[];
  currentFrame: number;
  totalFrames: number;
  isLoading?: boolean;
  onFrameChange: (frameIndex: number) => void;
}

export function VideoTimeline({ frames, currentFrame, totalFrames, isLoading = false, onFrameChange }: VideoTimelineProps) {
  const progress = totalFrames > 1 ? (currentFrame / (totalFrames - 1)) * 100 : 0;

  return (
    <section className="glass-panel rounded-lg p-4" aria-label="Video frame timeline">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-text-main">Timeline</h2>
          <p className="text-xs text-text-muted">Frame {currentFrame.toLocaleString()} of {totalFrames.toLocaleString()}</p>
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-cyan" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading strips
          </div>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-background-dark/75 p-3">
        <div className="absolute inset-x-3 top-1/2 h-px bg-white/10" aria-hidden="true" />
        <motion.div
          className="absolute left-3 top-1/2 h-px bg-accent-cyan shadow-cyan-glow"
          style={{ width: `calc(${progress}% - 1.5rem)` }}
          aria-hidden="true"
        />
        <div className="relative grid grid-flow-col auto-cols-[72px] gap-2 overflow-x-auto pb-2">
          {frames.map((frame) => {
            const selected = frame.frame_index === currentFrame;
            return (
              <button
                key={frame.id}
                type="button"
                aria-label={`Go to frame ${frame.frame_index}`}
                aria-pressed={selected}
                onClick={() => onFrameChange(frame.frame_index)}
                className="group grid gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
              >
                <span
                  className={`block aspect-video overflow-hidden rounded-md border bg-background-panel transition ${
                    selected ? "border-accent-cyan shadow-cyan-glow" : "border-white/10 group-hover:border-accent-cyan/50"
                  }`}
                >
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={frame.thumbnail_path}
                  />
                </span>
                <span className="text-[11px] font-semibold text-text-muted">{frame.frame_index}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
