import "dotenv/config";

function readEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    supabaseUrl: readEnv("SUPABASE_URL", process.env.VITE_SUPABASE_URL),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    publicSiteUrl: process.env.PUBLIC_SITE_URL ?? process.env.VERCEL_URL ?? "http://127.0.0.1:5173",
  };
}

export function getWorkerEnv() {
  return {
    ...getServerEnv(),
    workerPollMs: Number(process.env.WORKER_POLL_MS ?? 2500),
    workerBatchLimit: Number(process.env.WORKER_BATCH_LIMIT ?? 1),
    processorMode: process.env.WORKER_PROCESSOR_MODE ?? "local",
    tempDir: process.env.WORKER_TEMP_DIR ?? ".auraflow-tmp",
  };
}
