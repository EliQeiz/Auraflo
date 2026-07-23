import { useEffect, useRef } from "react";
import type { FaceDetection } from "../types/media";

interface FrameCanvasProps {
  imageUrl: string;
  detections?: FaceDetection[];
}

export function FrameCanvas({ imageUrl, detections = [] }: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !imageUrl) {
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const width = image.naturalWidth || 1280;
      const height = image.naturalHeight || 720;
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      detections.forEach((detection) => {
        const [x1, y1, x2, y2] = detection.boundingBox;
        context.strokeStyle = "#00E5FF";
        context.lineWidth = Math.max(2, width * 0.002);
        context.shadowColor = "rgba(0, 229, 255, 0.75)";
        context.shadowBlur = 12;
        context.strokeRect(x1, y1, x2 - x1, y2 - y1);
        context.shadowBlur = 0;
        context.fillStyle = "rgba(10, 1, 24, 0.82)";
        context.fillRect(x1, Math.max(0, y1 - 28), 116, 24);
        context.fillStyle = "#F0F9FF";
        context.font = "600 16px Inter, sans-serif";
        context.fillText(detection.faceId, x1 + 8, Math.max(18, y1 - 10));
      });
    };
    image.src = imageUrl;
  }, [detections, imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Current frame with facial detection overlays"
      className="aspect-video w-full rounded-lg border border-white/10 bg-background-dark object-contain shadow-card-glow"
    />
  );
}
