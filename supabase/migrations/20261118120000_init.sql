-- Amigo Secreto das Meninas — schema inicial (Etapa 2/3)
-- Políticas restritivas: público só vê nome+comida via RPC com slug privado.

create extension if not exists pgcrypto;

create type public.registration_status as enum ('open', 'closed');
create type public.draw_status as enum ('pending', 'done');
create type public.email_job_type as enum (
  'confirmation',
  'edit_link',
  'draw_result'
);
create type public.email_job_status as enum (
  'pending',
  'processing',
  'accepted',
  'failed',
  'delivered'
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  public_slug text not null unique,
  name text not null,
  date_label text not null,
  time_label text not null,
  timezone text not null default 'America/Sao_Paulo',
  venue text not null,
  address text not null,
  gift_limit_label text not null,
  registration_status public.registration_status not null default 'open',
  draw_status public.draw_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_len check (char_length(public_slug) >= 24)
);

create table public.event_admins (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  email text not null,
  email_normalized text not null,
  gift1 text not null default '',
  gift2 text not null default '',
  gift3 text not null default '',
  food text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participants_name_not_empty check (char_length(trim(name)) > 0),
  constraint participants_food_not_empty check (char_length(trim(food)) > 0),
  constraint participants_email_unique_per_event unique (event_id, email_normalized)
);

create index participants_event_id_idx on public.participants (event_id);

create table public.edit_tokens (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

create index edit_tokens_participant_id_idx on public.edit_tokens (participant_id);

create table public.draw_pairs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  giver_id uuid not null references public.participants (id) on delete restrict,
  receiver_id uuid not null references public.participants (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint draw_pairs_no_self check (giver_id <> receiver_id),
  constraint draw_pairs_giver_unique unique (event_id, giver_id),
  constraint draw_pairs_receiver_unique unique (event_id, receiver_id)
);

create index draw_pairs_event_id_idx on public.draw_pairs (event_id);

create table public.email_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  participant_id uuid references public.participants (id) on delete set null,
  job_type public.email_job_type not null,
  status public.email_job_status not null default 'pending',
  idempotency_key text not null unique,
  provider_message_id text,
  attempts integer not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  locked_at timestamptz
);

create index email_jobs_status_idx on public.email_jobs (status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger participants_set_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

create trigger email_jobs_set_updated_at
before update on public.email_jobs
for each row execute function public.set_updated_at();

-- Lista pública de comidas: somente nome + comida, exige slug privado.
create or replace function public.get_public_foods(p_slug text)
returns table (
  participant_id uuid,
  name text,
  food text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.food
  from public.participants p
  inner join public.events e on e.id = p.event_id
  where e.public_slug = p_slug
  order by p.created_at asc;
$$;

create or replace function public.get_public_event(p_slug text)
returns table (
  id uuid,
  public_slug text,
  name text,
  date_label text,
  time_label text,
  timezone text,
  venue text,
  address text,
  gift_limit_label text,
  registration_status public.registration_status,
  draw_status public.draw_status
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.public_slug,
    e.name,
    e.date_label,
    e.time_label,
    e.timezone,
    e.venue,
    e.address,
    e.gift_limit_label,
    e.registration_status,
    e.draw_status
  from public.events e
  where e.public_slug = p_slug;
$$;

revoke all on function public.get_public_foods(text) from public;
revoke all on function public.get_public_event(text) from public;
grant execute on function public.get_public_foods(text) to anon, authenticated;
grant execute on function public.get_public_event(text) to anon, authenticated;

alter table public.events enable row level security;
alter table public.event_admins enable row level security;
alter table public.participants enable row level security;
alter table public.edit_tokens enable row level security;
alter table public.draw_pairs enable row level security;
alter table public.email_jobs enable row level security;

-- Sem políticas permissivas de SELECT/INSERT públicos nas tabelas.
-- Leituras públicas só via RPCs acima. Mutações via Edge Functions (service_role).

create or replace function public.is_event_admin(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.event_admins ea
    where ea.event_id = p_event_id
      and ea.user_id = auth.uid()
  );
$$;

revoke all on function public.is_event_admin(uuid) from public;
grant execute on function public.is_event_admin(uuid) to authenticated;

-- Admin autenticado: pode ler participantes do evento (sem pares).
create policy event_admins_select_own
on public.event_admins
for select
to authenticated
using (user_id = auth.uid());

create policy events_admin_select
on public.events
for select
to authenticated
using (public.is_event_admin(id));

create policy events_admin_update
on public.events
for update
to authenticated
using (public.is_event_admin(id))
with check (public.is_event_admin(id));

create policy participants_admin_select
on public.participants
for select
to authenticated
using (public.is_event_admin(event_id));

create policy participants_admin_update
on public.participants
for update
to authenticated
using (public.is_event_admin(event_id))
with check (public.is_event_admin(event_id));

create policy participants_admin_delete
on public.participants
for delete
to authenticated
using (
  public.is_event_admin(event_id)
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.draw_status = 'pending'
  )
);

create policy email_jobs_admin_select
on public.email_jobs
for select
to authenticated
using (public.is_event_admin(event_id));

-- draw_pairs: sem política de SELECT para authenticated/anon (só service_role).
