create view public.deposits_view as
select
  d.id,
  d.date,
  dc.name as category,
  a.name as account,
  d.amount,
  d.description
from
  deposits d
  left join deposit_categories dc on dc.id = d.category_id
  left join accounts a on a.id = d.account_id
order by
  d.date desc;