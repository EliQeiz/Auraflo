# AuraFlow Backend

## Runtime Shape

AuraFlow uses three runtime layers:

- Vercel frontend: React/Vite static app.
- Vercel API functions: fast auth, project creation, signed upload URLs, and job queueing.
- Worker process: long-running FFmpeg/media/AI jobs. Run this locally first, then move it to a GPU host when connecting Real-ESRGAN, BasicVSR++, SwinIR, or InsightFace.

## Required Environment Variables

Set these in Vercel:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PUBLIC_SITE_URL
```

Set these wherever the worker runs:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
WORKER_POLL_MS
WORKER_BATCH_LIMIT
WORKER_PROCESSOR_MODE
WORKER_TEMP_DIR
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## API Routes

- `GET /api/health`
- `POST /api/projects/create`
- `POST /api/projects/complete-upload`
- `GET /api/projects/list`
- `GET /api/projects/detail?id=<project-id>`
- `POST /api/jobs/enqueue`
- `POST /api/media/sign-read`

All protected routes require:

```text
Authorization: Bearer <supabase-user-access-token>
```

## Worker

Run locally:

```bash
npm run worker:dev
```

The current local worker is operational with:

- Sharp image upscaling to WebP.
- FFmpeg video scaling to MP4 with audio copy.
- Thumbnail extraction into `frame-thumbnails`.
- Deterministic face embedding fallback that keeps the pgvector pipeline testable.

Replace `worker/processors/faces.ts` with an InsightFace service call when the GPU inference service is ready.
