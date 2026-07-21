create table if not exists public.color_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day integer not null,
  color_hex text not null,
  photo text not null,
  score integer,
  painting_id text not null,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

alter table public.color_entries enable row level security;

create policy "Users can read their color entries"
  on public.color_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their color entries"
  on public.color_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their color entries"
  on public.color_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their color entries"
  on public.color_entries for delete
  using (auth.uid() = user_id);
