grant select, update on table public.profiles to service_role;
grant select on table public.comment_reports to service_role;

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

create or replace function public.admin_get_user_profiles_and_accounts(
  p_user_ids uuid[]
)
returns table (
  id uuid,
  first_name text,
  last_name text,
  role text,
  is_active boolean
)
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select
    requested_users.id,
    profiles.first_name,
    profiles.last_name,
    user_accounts.role::text,
    user_accounts.is_active
  from unnest(coalesce(p_user_ids, '{}'::uuid[])) as requested_users(id)
  left join public.profiles
    on profiles.id = requested_users.id
  left join private.user_accounts
    on user_accounts.user_id = requested_users.id;
$$;

create or replace function public.admin_get_user_account(
  p_target_user_id uuid
)
returns table (
  user_id uuid,
  role text,
  is_active boolean
)
language sql
security invoker
set search_path = private, pg_temp
as $$
  select
    user_accounts.user_id,
    user_accounts.role::text,
    user_accounts.is_active
  from private.user_accounts
  where user_accounts.user_id = p_target_user_id;
$$;

create or replace function public.admin_update_user(
  p_actor_user_id uuid,
  p_actor_role text,
  p_target_user_id uuid,
  p_first_name text default null,
  p_last_name text default null,
  p_role text default null,
  p_is_active boolean default null,
  p_changes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = public, private, pg_temp
as $$
begin
  if p_first_name is not null or p_last_name is not null then
    update public.profiles
    set
      first_name = coalesce(p_first_name, first_name),
      last_name = coalesce(p_last_name, last_name),
      updated_at = now()
    where id = p_target_user_id;
  end if;

  if p_role is not null or p_is_active is not null then
    insert into private.user_accounts (
      user_id,
      role,
      is_active,
      updated_by,
      updated_at
    )
    values (
      p_target_user_id,
      coalesce(p_role, 'user')::public.app_role,
      coalesce(p_is_active, true),
      p_actor_user_id,
      now()
    )
    on conflict (user_id) do update
    set
      role = coalesce(p_role::public.app_role, private.user_accounts.role),
      is_active = coalesce(p_is_active, private.user_accounts.is_active),
      updated_by = p_actor_user_id,
      updated_at = now();
  end if;

  insert into private.audit_log (
    actor_user_id,
    actor_role,
    action,
    resource,
    target_id,
    changes,
    result
  )
  values (
    p_actor_user_id,
    p_actor_role,
    'admin.users.update',
    'users',
    p_target_user_id::text,
    p_changes,
    'success'
  );
end;
$$;

create or replace function public.admin_get_role_permission_overrides()
returns table (
  role text,
  permissions text[],
  updated_at timestamptz
)
language sql
security invoker
set search_path = private, pg_temp
as $$
  select
    role_permission_overrides.role,
    role_permission_overrides.permissions,
    role_permission_overrides.updated_at
  from private.role_permission_overrides
  order by role_permission_overrides.role;
$$;

create or replace function public.admin_save_role_permission_override(
  p_actor_user_id uuid,
  p_actor_role text,
  p_role text,
  p_permissions text[],
  p_changes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = private, pg_temp
as $$
begin
  insert into private.role_permission_overrides (
    role,
    permissions,
    updated_by,
    updated_at
  )
  values (
    p_role,
    coalesce(p_permissions, '{}'::text[]),
    p_actor_user_id,
    now()
  )
  on conflict (role) do update
  set
    permissions = excluded.permissions,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into private.audit_log (
    actor_user_id,
    actor_role,
    action,
    resource,
    target_id,
    changes,
    result
  )
  values (
    p_actor_user_id,
    p_actor_role,
    'admin.roles.update',
    'roles',
    p_role,
    p_changes,
    'success'
  );
end;
$$;

create or replace function public.admin_list_feature_flags()
returns table (
  key text,
  label text,
  description text,
  enabled boolean,
  updated_at timestamptz
)
language sql
security invoker
set search_path = private, pg_temp
as $$
  select
    feature_flags.key,
    feature_flags.label,
    feature_flags.description,
    feature_flags.enabled,
    feature_flags.updated_at
  from private.feature_flags
  order by feature_flags.key;
$$;

create or replace function public.admin_save_feature_flag(
  p_actor_user_id uuid,
  p_actor_role text,
  p_key text,
  p_label text,
  p_description text,
  p_enabled boolean,
  p_changes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = private, pg_temp
as $$
begin
  insert into private.feature_flags (
    key,
    label,
    description,
    enabled,
    updated_by,
    updated_at
  )
  values (
    p_key,
    p_label,
    nullif(trim(coalesce(p_description, '')), ''),
    p_enabled,
    p_actor_user_id,
    now()
  )
  on conflict (key) do update
  set
    label = excluded.label,
    description = excluded.description,
    enabled = excluded.enabled,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into private.audit_log (
    actor_user_id,
    actor_role,
    action,
    resource,
    target_id,
    changes,
    result
  )
  values (
    p_actor_user_id,
    p_actor_role,
    'admin.feature_flags.update',
    'feature-flags',
    p_key,
    p_changes,
    'success'
  );
end;
$$;

create or replace function public.admin_get_maintenance_settings()
returns table (
  maintenance_enabled boolean,
  maintenance_message text,
  updated_at timestamptz
)
language sql
security invoker
set search_path = private, pg_temp
as $$
  select
    app_runtime_settings.maintenance_enabled,
    app_runtime_settings.maintenance_message,
    app_runtime_settings.updated_at
  from private.app_runtime_settings
  where app_runtime_settings.id = 'app';
$$;

create or replace function public.admin_save_maintenance_settings(
  p_actor_user_id uuid,
  p_actor_role text,
  p_enabled boolean,
  p_message text,
  p_changes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = private, pg_temp
as $$
begin
  insert into private.app_runtime_settings (
    id,
    maintenance_enabled,
    maintenance_message,
    updated_by,
    updated_at
  )
  values (
    'app',
    p_enabled,
    p_message,
    p_actor_user_id,
    now()
  )
  on conflict (id) do update
  set
    maintenance_enabled = excluded.maintenance_enabled,
    maintenance_message = excluded.maintenance_message,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  insert into private.audit_log (
    actor_user_id,
    actor_role,
    action,
    resource,
    target_id,
    changes,
    result
  )
  values (
    p_actor_user_id,
    p_actor_role,
    'admin.maintenance.update',
    'maintenance',
    'app',
    p_changes,
    'success'
  );
end;
$$;

create or replace function public.admin_get_audit_log(
  p_limit integer default 100
)
returns table (
  id uuid,
  actor_user_id uuid,
  actor_role text,
  action text,
  resource text,
  target_id text,
  changes jsonb,
  result text,
  created_at timestamptz
)
language sql
security invoker
set search_path = private, pg_temp
as $$
  select
    audit_log.id,
    audit_log.actor_user_id,
    audit_log.actor_role,
    audit_log.action,
    audit_log.resource,
    audit_log.target_id,
    audit_log.changes,
    audit_log.result,
    audit_log.created_at
  from private.audit_log
  order by audit_log.created_at desc
  limit greatest(0, least(coalesce(p_limit, 100), 500));
$$;

create or replace function public.admin_get_metrics()
returns table (
  users bigint,
  active_users bigint,
  comments bigint,
  open_reports bigint,
  feature_flags bigint,
  audit_events bigint
)
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select
    (select count(*) from private.user_accounts)::bigint as users,
    (select count(*) from private.user_accounts where is_active = true)::bigint as active_users,
    (select count(*) from public.news_comments)::bigint as comments,
    (select count(*) from public.comment_reports where status = 'open')::bigint as open_reports,
    (select count(*) from private.feature_flags)::bigint as feature_flags,
    (select count(*) from private.audit_log)::bigint as audit_events;
$$;

create or replace function public.admin_record_audit_log(
  p_actor_user_id uuid,
  p_actor_role text,
  p_action text,
  p_resource text,
  p_target_id text default null,
  p_changes jsonb default null,
  p_result text default 'success'
)
returns void
language sql
security invoker
set search_path = private, pg_temp
as $$
  insert into private.audit_log (
    actor_user_id,
    actor_role,
    action,
    resource,
    target_id,
    changes,
    result
  )
  values (
    p_actor_user_id,
    p_actor_role,
    p_action,
    p_resource,
    p_target_id,
    p_changes,
    coalesce(p_result, 'success')
  );
$$;

revoke execute on function public.admin_get_user_profiles_and_accounts(uuid[]) from public, anon, authenticated;
revoke execute on function public.admin_get_user_account(uuid) from public, anon, authenticated;
revoke execute on function public.admin_update_user(uuid, text, uuid, text, text, text, boolean, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_get_role_permission_overrides() from public, anon, authenticated;
revoke execute on function public.admin_save_role_permission_override(uuid, text, text, text[], jsonb) from public, anon, authenticated;
revoke execute on function public.admin_list_feature_flags() from public, anon, authenticated;
revoke execute on function public.admin_save_feature_flag(uuid, text, text, text, text, boolean, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_get_maintenance_settings() from public, anon, authenticated;
revoke execute on function public.admin_save_maintenance_settings(uuid, text, boolean, text, jsonb) from public, anon, authenticated;
revoke execute on function public.admin_get_audit_log(integer) from public, anon, authenticated;
revoke execute on function public.admin_get_metrics() from public, anon, authenticated;
revoke execute on function public.admin_record_audit_log(uuid, text, text, text, text, jsonb, text) from public, anon, authenticated;

grant execute on function public.admin_get_user_profiles_and_accounts(uuid[]) to service_role;
grant execute on function public.admin_get_user_account(uuid) to service_role;
grant execute on function public.admin_update_user(uuid, text, uuid, text, text, text, boolean, jsonb) to service_role;
grant execute on function public.admin_get_role_permission_overrides() to service_role;
grant execute on function public.admin_save_role_permission_override(uuid, text, text, text[], jsonb) to service_role;
grant execute on function public.admin_list_feature_flags() to service_role;
grant execute on function public.admin_save_feature_flag(uuid, text, text, text, text, boolean, jsonb) to service_role;
grant execute on function public.admin_get_maintenance_settings() to service_role;
grant execute on function public.admin_save_maintenance_settings(uuid, text, boolean, text, jsonb) to service_role;
grant execute on function public.admin_get_audit_log(integer) to service_role;
grant execute on function public.admin_get_metrics() to service_role;
grant execute on function public.admin_record_audit_log(uuid, text, text, text, text, jsonb, text) to service_role;

notify pgrst, 'reload schema';
