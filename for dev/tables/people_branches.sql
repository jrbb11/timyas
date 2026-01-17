create table public.people_branches (
  person_id uuid not null,
  branch_id uuid not null,
  assigned_at timestamp without time zone null default now(),
  id uuid not null default gen_random_uuid (),
  constraint people_branches_pkey primary key (id),
  constraint people_branches_branch_id_fkey foreign KEY (branch_id) references branches (id) on delete CASCADE,
  constraint people_branches_person_id_fkey foreign KEY (person_id) references people (id) on delete CASCADE
) TABLESPACE pg_default;