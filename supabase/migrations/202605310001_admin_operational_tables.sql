create schema if not exists private;

do $$
begin
  create type public.app_role as enum (
    'user',
    'team_member',
    'editor',
    'moderator',
    'admin'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists private.user_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user'::public.app_role,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_accounts_role_check check (
    role in ('user', 'team_member', 'editor', 'moderator', 'admin')
  )
);

alter table private.user_accounts
  add column if not exists role public.app_role not null default 'user'::public.app_role,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table private.user_accounts enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'private'
      and tablename = 'user_accounts'
      and policyname = 'Users can read their own account'
  ) then
    create policy "Users can read their own account"
      on private.user_accounts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists user_accounts_role_idx
  on private.user_accounts (role);

create index if not exists user_accounts_is_active_idx
  on private.user_accounts (is_active);

create table if not exists private.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  actor_role text not null,
  action text not null,
  resource text not null,
  target_id text,
  changes jsonb,
  result text not null default 'success' check (result in ('success', 'failure')),
  created_at timestamptz not null default now()
);

alter table private.audit_log enable row level security;

create index if not exists audit_log_created_at_idx
  on private.audit_log (created_at desc);

create index if not exists audit_log_resource_created_at_idx
  on private.audit_log (resource, created_at desc);

create table if not exists private.role_permission_overrides (
  role text primary key,
  permissions text[] not null default '{}',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table private.role_permission_overrides enable row level security;

create table if not exists private.feature_flags (
  key text primary key,
  label text not null,
  description text,
  enabled boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint feature_flags_key_format check (key ~ '^[a-z0-9_.-]+$')
);

alter table private.feature_flags enable row level security;

create index if not exists feature_flags_enabled_idx
  on private.feature_flags (enabled)
  where enabled = true;

create table if not exists private.app_runtime_settings (
  id text primary key default 'app' check (id = 'app'),
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'Estamos realizando mantenimiento. Volve a intentar en unos minutos.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table private.app_runtime_settings enable row level security;

insert into private.app_runtime_settings (id)
values ('app')
on conflict (id) do nothing;

revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated;
grant usage on schema private to service_role;

revoke all on table
  private.audit_log,
  private.role_permission_overrides,
  private.feature_flags,
  private.app_runtime_settings
from anon, authenticated;

revoke all on table private.user_accounts from anon;
grant select on table private.user_accounts to authenticated;

grant select, insert, update, delete on table
  private.user_accounts,
  private.audit_log,
  private.role_permission_overrides,
  private.feature_flags,
  private.app_runtime_settings
to service_role;
