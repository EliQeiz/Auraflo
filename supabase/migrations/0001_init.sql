create extension if not exists "pgcrypto";
create extension if not exists vector;

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_name text not null,
  media_type text check (media_type in ('video', 'image')) not null,
  storage_path_original text not null,
  storage_path_hd text,
  status text check (status in ('uploading', 'staging', 'queued', 'processing', 'completed', 'failed')) default 'uploading',
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.processing_jobs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  job_type text check (job_type in ('upscale_image', 'upscale_video', 'detect_faces', 'enhance_frame', 'blur_face', 'stitch_video')) not null,
  status text check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')) default 'queued',
  payload jsonb default '{}'::jsonb not null,
  result jsonb,
  queued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone
);

create table public.facial_embeddings (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  face_id text not null,
  embedding vector(512) not null,
  frame_index integer not null check (frame_index >= 0),
  bounding_box jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.frame_assets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  frame_index integer not null check (frame_index >= 0),
  thumbnail_path text not null,
  enhanced_path text,
  detections jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, frame_index)
);

create index projects_user_id_idx on public.projects (user_id);
create index processing_jobs_project_id_status_idx on public.processing_jobs (project_id, status);
create index facial_embeddings_project_id_idx on public.facial_embeddings (project_id);
create index facial_embeddings_embedding_idx on public.facial_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index frame_assets_project_id_frame_idx on public.frame_assets (project_id, frame_index);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.facial_embeddings enable row level security;
alter table public.frame_assets enable row level security;

create policy "Profiles are self-readable"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are self-writable"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Profiles are self-updatable"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can read their projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create their projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their projects"
  on public.projects for delete
  using (auth.uid() = user_id);

create policy "Users can read jobs for owned projects"
  on public.processing_jobs for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = processing_jobs.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can enqueue jobs for owned projects"
  on public.processing_jobs for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = processing_jobs.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can read embeddings for owned projects"
  on public.facial_embeddings for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = facial_embeddings.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Service role can manage embeddings"
  on public.facial_embeddings for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Users can read frames for owned projects"
  on public.frame_assets for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = frame_assets.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Service role can manage frame assets"
  on public.frame_assets for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.match_project_faces(
  query_embedding vector(512),
  match_project_id uuid,
  match_threshold float default 0.42,
  match_count int default 12
)
returns table (
  id uuid,
  face_id text,
  frame_index integer,
  bounding_box jsonb,
  similarity float
)
language sql
stable
as $$
  select
    facial_embeddings.id,
    facial_embeddings.face_id,
    facial_embeddings.frame_index,
    facial_embeddings.bounding_box,
    1 - (facial_embeddings.embedding <=> query_embedding) as similarity
  from public.facial_embeddings
  where facial_embeddings.project_id = match_project_id
    and exists (
      select 1 from public.projects
      where projects.id = facial_embeddings.project_id
        and projects.user_id = auth.uid()
    )
    and 1 - (facial_embeddings.embedding <=> query_embedding) >= match_threshold
  order by facial_embeddings.embedding <=> query_embedding
  limit match_count;
$$;
