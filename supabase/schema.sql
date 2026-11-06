-- Jalankan sekali di Supabase: SQL Editor > New query > tempel > Run.

create table if not exists public.runs (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null,
  deleted boolean not null default false,
  primary key (user_id, id)
);

create table if not exists public.tracker_settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  goal_km numeric not null,
  gear jsonb not null default '[]',
  prefs jsonb not null default '{}',
  updated_at timestamptz not null
);

alter table public.tracker_settings add column if not exists gear jsonb not null default '[]';
alter table public.tracker_settings add column if not exists prefs jsonb not null default '{}';

alter table public.runs enable row level security;
alter table public.tracker_settings enable row level security;

-- Setiap akun hanya bisa membaca dan mengubah datanya sendiri.
drop policy if exists "Pemilik mengelola lari sendiri" on public.runs;
create policy "Pemilik mengelola lari sendiri" on public.runs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Pemilik mengelola pengaturan sendiri" on public.tracker_settings;
create policy "Pemilik mengelola pengaturan sendiri" on public.tracker_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.runs to authenticated;
grant select, insert, update, delete on public.tracker_settings to authenticated;
