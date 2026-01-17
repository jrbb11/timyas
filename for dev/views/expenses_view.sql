create view public.expenses_view as
select
  e.id,
  e.date,
  c.name as category,
  a.name as account,
  e.amount,
  e.description
from
  expenses e
  left join expense_categories c on e.category_id = c.id
  left join accounts a on e.account_id = a.id
order by
  e.date desc;