-- Radar Electoral ERM 2026 - esquema inicial colaborativo
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'ANALISTA' check (role in ('ADMIN','SUPERVISOR','ANALISTA','JEFATURA')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.electoral_processes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  starts_on date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  process_id uuid references public.electoral_processes(id) on delete cascade,
  name text not null,
  short_name text,
  logo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(process_id, name)
);

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  position text,
  region text,
  province text,
  district text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.social_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  platform text not null check (platform in ('FACEBOOK','INSTAGRAM','TIKTOK','YOUTUBE','X','OTRO')),
  profile_name text,
  profile_url text not null,
  native_profile_id text,
  active boolean not null default true,
  last_collected_at timestamptz,
  created_at timestamptz not null default now(),
  unique(platform, profile_url)
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

create table if not exists public.activity_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  active boolean not null default true
);

create table if not exists public.content_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  active boolean not null default true
);

create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  social_profile_id uuid references public.social_profiles(id) on delete set null,
  platform text not null,
  native_post_id text,
  post_url text not null,
  canonical_url text,
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  title text,
  body_text text,
  author_name text,
  media_kind text,
  status text not null default 'PENDIENTE' check (status in ('PENDIENTE','EN_REVISION','REVISADO','VALIDADO','OBSERVADO','NO_CORRESPONDE','ANULADO')),
  availability text not null default 'DISPONIBLE' check (availability in ('DISPONIBLE','NO_DISPONIBLE','PRIVADO','LOGIN_REQUERIDO','ERROR')),
  assigned_to uuid references public.profiles(id) on delete set null,
  activity_type_id uuid references public.activity_types(id) on delete set null,
  content_type_id uuid references public.content_types(id) on delete set null,
  corresponds boolean,
  observation text,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists publications_native_unique
on public.publications(platform, native_post_id)
where native_post_id is not null and native_post_id <> '';

create table if not exists public.evidence_files (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  kind text not null check (kind in ('CAPTURA','VIDEO','AUDIO','TRANSCRIPCION','METADATA','MINIATURA','OTRO')),
  provider text not null default 'DROPBOX',
  provider_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  sha256 text,
  captured_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null,
  activity_type_id uuid references public.activity_types(id),
  content_type_id uuid references public.content_types(id),
  observation text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

insert into public.electoral_processes(code,name,active)
values ('ERM2026','Elecciones Regionales y Municipales 2026',true)
on conflict (code) do nothing;

insert into public.activity_types(name) values
('REUNIÓN'),('VISITA'),('MITIN'),('ENTREVISTA'),('RECORRIDO'),('ACTIVIDAD PARTIDARIA'),('OTRO')
on conflict (name) do nothing;

insert into public.content_types(name) values
('IMAGEN CON PROPAGANDA ELECTORAL'),('VIDEO CON PROPAGANDA ELECTORAL'),('PUBLICACIÓN INFORMATIVA'),('PUBLICACIÓN INSTITUCIONAL'),('NO CORRESPONDE'),('OTRO')
on conflict (name) do nothing;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, role)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), 'ANALISTA')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.can_access_org(org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.current_role() in ('ADMIN','SUPERVISOR','JEFATURA')
    or exists(select 1 from public.assignments a where a.organization_id = org_id and a.user_id = auth.uid() and a.active);
$$;

alter table public.profiles enable row level security;
alter table public.electoral_processes enable row level security;
alter table public.organizations enable row level security;
alter table public.candidates enable row level security;
alter table public.social_profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.activity_types enable row level security;
alter table public.content_types enable row level security;
alter table public.publications enable row level security;
alter table public.evidence_files enable row level security;
alter table public.reviews enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles_self_or_manager_read" on public.profiles for select to authenticated using (id = auth.uid() or public.current_role() in ('ADMIN','SUPERVISOR','JEFATURA'));
create policy "process_read" on public.electoral_processes for select to authenticated using (true);
create policy "organizations_read" on public.organizations for select to authenticated using (public.can_access_org(id));
create policy "candidates_read" on public.candidates for select to authenticated using (public.can_access_org(organization_id));
create policy "social_profiles_read" on public.social_profiles for select to authenticated using (public.can_access_org(organization_id));
create policy "assignments_read" on public.assignments for select to authenticated using (user_id = auth.uid() or public.current_role() in ('ADMIN','SUPERVISOR','JEFATURA'));
create policy "catalog_activity_read" on public.activity_types for select to authenticated using (true);
create policy "catalog_content_read" on public.content_types for select to authenticated using (true);
create policy "publications_read" on public.publications for select to authenticated using (public.can_access_org(organization_id));
create policy "publications_insert" on public.publications for insert to authenticated with check (public.can_access_org(organization_id) and public.current_role() <> 'JEFATURA');
create policy "publications_update" on public.publications for update to authenticated using (public.can_access_org(organization_id) and public.current_role() <> 'JEFATURA') with check (public.can_access_org(organization_id));
create policy "evidence_read" on public.evidence_files for select to authenticated using (exists(select 1 from public.publications p where p.id = publication_id and public.can_access_org(p.organization_id)));
create policy "evidence_insert" on public.evidence_files for insert to authenticated with check (exists(select 1 from public.publications p where p.id = publication_id and public.can_access_org(p.organization_id)) and public.current_role() <> 'JEFATURA');
create policy "reviews_read" on public.reviews for select to authenticated using (exists(select 1 from public.publications p where p.id = publication_id and public.can_access_org(p.organization_id)));
create policy "reviews_insert" on public.reviews for insert to authenticated with check (user_id = auth.uid() and public.current_role() <> 'JEFATURA');
create policy "audit_read_managers" on public.audit_log for select to authenticated using (public.current_role() in ('ADMIN','SUPERVISOR','JEFATURA'));

-- Administración de catálogos y asignaciones solo para ADMIN/SUPERVISOR
create policy "organizations_manage" on public.organizations for all to authenticated using (public.current_role() in ('ADMIN','SUPERVISOR')) with check (public.current_role() in ('ADMIN','SUPERVISOR'));
create policy "candidates_manage" on public.candidates for all to authenticated using (public.current_role() in ('ADMIN','SUPERVISOR')) with check (public.current_role() in ('ADMIN','SUPERVISOR'));
create policy "social_profiles_manage" on public.social_profiles for all to authenticated using (public.current_role() in ('ADMIN','SUPERVISOR')) with check (public.current_role() in ('ADMIN','SUPERVISOR'));
create policy "assignments_manage" on public.assignments for all to authenticated using (public.current_role() in ('ADMIN','SUPERVISOR')) with check (public.current_role() in ('ADMIN','SUPERVISOR'));
create policy "profiles_manage" on public.profiles for update to authenticated using (public.current_role() = 'ADMIN') with check (public.current_role() = 'ADMIN');
