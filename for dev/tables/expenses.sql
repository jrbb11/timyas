create table public.expenses (
  id serial not null,
  account_id integer not null,
  category_id integer not null,
  date date not null,
  amount numeric(14, 2) not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  constraint expenses_pkey primary key (id),
  constraint expenses_account_id_fkey foreign KEY (account_id) references accounts (id) on delete RESTRICT,
  constraint expenses_category_id_fkey foreign KEY (category_id) references expense_categories (id) on delete RESTRICT
) TABLESPACE pg_default;

create trigger expenses_audit_trigger
after INSERT
or DELETE
or
update on expenses for EACH row
execute FUNCTION audit_trigger_function ();

create trigger trg_expenses_bal
after INSERT
or DELETE on expenses for EACH row
execute FUNCTION _exp_update_balance ();