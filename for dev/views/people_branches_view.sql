create view public.people_branches_view as
select
  pb.id,
  pb.person_id,
  p.name as person_name,
  pb.branch_id,
  b.name as branch_name,
  pb.assigned_at
from
  people_branches pb
  join people p on pb.person_id = p.id
  join branches b on pb.branch_id = b.id;