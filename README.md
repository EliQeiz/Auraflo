# AuraFlow

AuraFlow is a React, TypeScript, Tailwind, Framer Motion, and Supabase foundation for AI-driven media enhancement workflows.

The starter includes:

- A dark glassmorphism interface inspired by the AuraFlow reference design.
- Animated reusable UI primitives for CTA buttons, profile buttons, cards, frame canvas overlays, and a video timeline.
- Supabase schema and RLS policies for projects, async processing jobs, frame assets, and `pgvector` facial embeddings.
- Frontend API helpers that enqueue long-running media actions instead of blocking the UI.

## Run Locally

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` when connecting to Supabase.

## Build

```bash
npm run build
```

## Supabase

Apply the initial migration from `supabase/migrations/0001_init.sql`.
