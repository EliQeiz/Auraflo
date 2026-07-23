export type MediaType = "image" | "video";

export type ProjectStatus =
  | "uploading"
  | "staging"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type ProcessingJobType =
  | "upscale_image"
  | "upscale_video"
  | "detect_faces"
  | "enhance_frame"
  | "blur_face"
  | "stitch_video";

export interface Project {
  id: string;
  project_name: string;
  media_type: MediaType;
  status: ProjectStatus;
  storage_path_original: string;
  storage_path_hd?: string | null;
  created_at: string;
}

export interface FaceDetection {
  faceId: string;
  boundingBox: [number, number, number, number];
  confidence: number;
}

export interface FrameAsset {
  id: string;
  project_id: string;
  frame_index: number;
  thumbnail_path: string;
  enhanced_path?: string | null;
  detections: FaceDetection[];
}
