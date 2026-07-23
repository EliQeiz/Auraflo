import crypto from "node:crypto";

function deterministicVector(seed: string) {
  const values: number[] = [];
  let counter = 0;

  while (values.length < 512) {
    const hash = crypto.createHash("sha256").update(`${seed}:${counter}`).digest();
    for (const byte of hash) {
      values.push(Number(((byte / 255) * 2 - 1).toFixed(6)));
      if (values.length === 512) {
        break;
      }
    }
    counter += 1;
  }

  return `[${values.join(",")}]`;
}

export async function detectFaces(input: { projectId: string; frameCount: number }) {
  // Production hook: call an InsightFace service here and return real detections/embeddings.
  // The deterministic local fallback keeps the queue operational before GPU services are connected.
  const count = Math.max(1, Math.min(input.frameCount, 12));

  return Array.from({ length: count }, (_, index) => ({
    face_id: "PERSON_A",
    frame_index: index * 24,
    bounding_box: [410, 124, 628, 382],
    embedding: deterministicVector(`${input.projectId}:PERSON_A:${index}`),
  }));
}
