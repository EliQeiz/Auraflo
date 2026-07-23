# AuraFlow

AuraFlow is a React, TypeScript, Tailwind, Framer Motion, and Supabase foundation for AI-driven media enhancement workflows.

The starter includes:

- A dark glassmorphism interface inspired by the AuraFlow reference design.
- Animated reusable UI primitives for CTA buttons, profile buttons, cards, frame canvas overlays, and a video timeline.
- Supabase schema and RLS policies for projects, async processing jobs, frame assets, and `pgvector` facial embeddings.
- Frontend API helpers that enqueue long-running media actions instead of blocking the UI.
- Vercel-compatible API routes for auth-guarded project creation, signed uploads, upload completion, project status, signed media reads, and job queueing.
- A Node worker that claims queued jobs and runs local Sharp/FFmpeg processors.

## Run Locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` when connecting to Supabase.

## Backend API

The Vercel API routes live in `api/`:

- `GET /api/health`
- `GET /api/projects/list`
- `GET /api/projects/detail?id=<project-id>`
- `POST /api/projects/create`
- `POST /api/projects/complete-upload`
- `POST /api/jobs/enqueue`
- `POST /api/media/sign-read`

All protected routes expect a Supabase user session:

```text
Authorization: Bearer <access-token>
```

## Worker

Run the queue worker in a separate terminal:

```bash
npm run worker:dev
```

The worker uses the Supabase service role key, downloads original media, processes it with Sharp/FFmpeg, uploads processed assets, writes thumbnails, and marks jobs complete or failed.

## Build

```bash
npm run build
```

## Supabase

Apply the initial migration from `supabase/migrations/0001_init.sql`.

## Vercel

Set the variables from `.env.example` in Vercel. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code; it is only used by API functions and the worker.

More backend details are in `docs/backend.md`.
