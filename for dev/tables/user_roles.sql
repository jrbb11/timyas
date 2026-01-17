create table public.user_roles (
  id uuid not null default gen_random_uuid (),
  app_user_id uuid not null,
  role text not null,
  created_at timestamp with time zone not null default now(),
  role_id uuid null,
  assigned_by uuid null,
  assigned_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint user_roles_pkey primary key (id),
  constraint user_roles_unique unique (app_user_id, role),
  constraint user_roles_app_user_id_fkey foreign KEY (app_user_id) references app_users (id) on delete CASCADE,
  constraint user_roles_assigned_by_fkey foreign KEY (assigned_by) references app_users (id),
  constraint user_roles_role_id_fkey foreign KEY (role_id) references roles (id)
) TABLESPACE pg_default;

create index IF not exists user_roles_role_id_idx on public.user_roles using btree (role_id) TABLESPACE pg_default;

create index IF not exists user_roles_app_user_active_idx on public.user_roles using btree (app_user_id, is_active) TABLESPACE pg_default;

create trigger user_roles_audit_trigger
after INSERT
or DELETE
or
update on user_roles for EACH row
execute FUNCTION audit_trigger_function ();