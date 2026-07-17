create table if not exists public.rawdata (
  id bigserial primary key,
  rd integer,
  code text not null,
  nm text,
  full text,
  sec text,
  dept text,
  dt date,
  mo text,
  v numeric default 0,
  si numeric default 0,
  p numeric default 0,
  pu numeric default 0,
  ab numeric default 0,
  ot numeric default 0,
  lt numeric default 0,
  row_hash text not null unique
);

create table if not exists public.employee_master (
  code text primary key,
  sec text,
  dept text,
  nm text,
  full_name text
);

create table if not exists public.user_access (
  email text not null,
  sec text not null,
  primary key (email, sec)
);

insert into public.user_access (email, sec)
values
  ('akkaraphol.c@gmail.com', 'PG'),
  ('kaew1475@gmail.com', 'PG')
on conflict (email, sec) do nothing;

alter table public.rawdata enable row level security;
alter table public.employee_master enable row level security;
alter table public.user_access enable row level security;

drop policy if exists "rawdata_select_by_sec_access" on public.rawdata;
create policy "rawdata_select_by_sec_access"
on public.rawdata
for select
to authenticated
using (
  exists (
    select 1
    from public.user_access ua
    where lower(ua.email) = lower(auth.jwt() ->> 'email')
      and (lower(ua.sec) = 'all' or lower(ua.sec) = lower(coalesce(rawdata.sec, '')))
  )
);

drop policy if exists "employee_master_select_by_sec_access" on public.employee_master;
create policy "employee_master_select_by_sec_access"
on public.employee_master
for select
to authenticated
using (
  exists (
    select 1
    from public.user_access ua
    where lower(ua.email) = lower(auth.jwt() ->> 'email')
      and (lower(ua.sec) = 'all' or lower(ua.sec) = lower(coalesce(employee_master.sec, '')))
  )
);

drop policy if exists "user_access_select_own" on public.user_access;
create policy "user_access_select_own"
on public.user_access
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

create index if not exists rawdata_sec_idx on public.rawdata (sec);
create index if not exists rawdata_code_idx on public.rawdata (code);
create index if not exists rawdata_mo_idx on public.rawdata (mo);
create index if not exists employee_master_sec_idx on public.employee_master (sec);
