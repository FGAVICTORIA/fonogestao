create extension if not exists pgcrypto;

create type public.user_role as enum ('supervisora','estagiaria');
create type public.appointment_status as enum ('agendado','atendido','falta','cancelado');
create type public.evolution_status as enum ('rascunho','concluida');

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null,
 role public.user_role not null default 'estagiaria',
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.patients (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 birth_date date,
 guardian text,
 phone text,
 notes text,
 professional_id uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now()
);
create table if not exists public.appointments (
 id uuid primary key default gen_random_uuid(),
 patient_id uuid not null references public.patients(id) on delete cascade,
 professional_id uuid references public.profiles(id) on delete set null,
 appointment_date date not null,
 start_time time not null,
 end_time time,
 status public.appointment_status not null default 'agendado',
 created_at timestamptz not null default now()
);
create table if not exists public.evolutions (
 id uuid primary key default gen_random_uuid(),
 patient_id uuid not null references public.patients(id) on delete cascade,
 appointment_id uuid references public.appointments(id) on delete set null,
 professional_id uuid references public.profiles(id) on delete set null,
 evolution_date date not null,
 evolution_time time,
 text text not null,
 notes text,
 status public.evolution_status not null default 'rascunho',
 supervisor_feedback text,
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.documents (
 id uuid primary key default gen_random_uuid(),
 patient_id uuid not null references public.patients(id) on delete cascade,
 uploaded_by uuid references public.profiles(id) on delete set null,
 file_name text not null,
 storage_path text not null,
 created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.evolutions enable row level security;
alter table public.documents enable row level security;
create or replace function public.is_supervisor()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='supervisora' and active=true); $$;
create policy "profiles_read" on public.profiles for select using(id=auth.uid() or public.is_supervisor());
create policy "profiles_update" on public.profiles for update using(id=auth.uid() or public.is_supervisor()) with check(id=auth.uid() or public.is_supervisor());
create policy "patients_read" on public.patients for select using(public.is_supervisor() or professional_id=auth.uid());
create policy "patients_insert" on public.patients for insert with check(public.is_supervisor() or professional_id=auth.uid());
create policy "patients_update" on public.patients for update using(public.is_supervisor() or professional_id=auth.uid()) with check(public.is_supervisor() or professional_id=auth.uid());
create policy "appointments_read" on public.appointments for select using(public.is_supervisor() or professional_id=auth.uid());
create policy "appointments_insert" on public.appointments for insert with check(public.is_supervisor() or professional_id=auth.uid());
create policy "appointments_update" on public.appointments for update using(public.is_supervisor() or professional_id=auth.uid()) with check(public.is_supervisor() or professional_id=auth.uid());
create policy "evolutions_read" on public.evolutions for select using(public.is_supervisor() or professional_id=auth.uid());
create policy "evolutions_insert" on public.evolutions for insert with check(public.is_supervisor() or professional_id=auth.uid());
create policy "evolutions_update" on public.evolutions for update using(public.is_supervisor() or professional_id=auth.uid()) with check(public.is_supervisor() or professional_id=auth.uid());
create policy "documents_read" on public.documents for select using(public.is_supervisor() or uploaded_by=auth.uid());
create policy "documents_insert" on public.documents for insert with check(public.is_supervisor() or uploaded_by=auth.uid());
