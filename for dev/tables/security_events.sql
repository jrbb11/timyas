create table public.security_events (
  id uuid not null default gen_random_uuid (),
  event_type text not null,
  user_id uuid null,
  ip_address inet null,
  user_agent text null,
  severity text null default 'WARNING'::text,
  description text null,
  metadata jsonb null,
  resolved boolean null default false,
  resolved_by uuid null,
  resolved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint security_events_pkey primary key (id),
  constraint security_events_resolved_by_fkey foreign KEY (resolved_by) references auth.users (id) on delete set null,
  constraint security_events_user_fkey foreign KEY (user_id) references auth.users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_security_events_event_type on public.security_events using btree (event_type) TABLESPACE pg_default;

create index IF not exists idx_security_events_severity on public.security_events using btree (severity) TABLESPACE pg_default;

create index IF not exists idx_security_events_resolved on public.security_events using btree (resolved) TABLESPACE pg_default;

create index IF not exists idx_security_events_created_at on public.security_events using btree (created_at) TABLESPACE pg_default;