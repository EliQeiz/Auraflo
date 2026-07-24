# AuraFlow

AuraFlow is a React, TypeScript, Tailwind, Framer Motion, Vercel, and Supabase platform for private AI media enhancement workflows.

The platform includes:

- A project-centered command interface for media intake, processing jobs, frame workbench, identity review, exports, and system readiness.
- Reusable UI primitives for actions, panels, frame canvas overlays, status states, and private media workflows.
- Supabase schema and RLS policies for projects, async processing jobs, frame assets, and `pgvector` facial embeddings.
- Frontend API helpers that fetch live project details, sign private media URLs, and enqueue long-running media actions.
- Vercel-compatible API routes for auth-guarded project creation, signed uploads, upload completion, project status, signed media reads, and job queueing.
- A Node worker that claims queued jobs, runs local Sharp/FFmpeg processors, and keeps project status aligned with the whole job set.

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

The worker uses the Supabase service role key, downloads original media, processes it with Sharp/FFmpeg, uploads processed assets, writes thumbnails, and updates project status from the full job lifecycle.

## Build

```bash
npm run build
```

## Supabase

Apply the initial migration from `supabase/migrations/0001_init.sql`.

## Vercel

Set the variables from `.env.example` in Vercel. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code; it is only used by API functions and the worker.

More backend details are in `docs/backend.md`.
