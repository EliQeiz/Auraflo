import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

export function requireFfmpeg() {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide a binary path.");
  }

  return ffmpegPath;
}

export async function runFfmpeg(args: string[]) {
  const executable = requireFfmpeg();

  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`FFmpeg exited with ${code}: ${stderr.slice(-2000)}`));
    });
  });
}
