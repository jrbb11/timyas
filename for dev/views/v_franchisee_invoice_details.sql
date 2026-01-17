create view public.v_franchisee_invoice_details as
select
  fi.id,
  fi.invoice_number,
  fi.invoice_date,
  fi.period_start,
  fi.period_end,
  fi.due_date,
  fi.status,
  fi.payment_status,
  fi.total_amount,
  fi.paid_amount,
  fi.balance,
  fi.previous_balance,
  p.id as franchisee_id,
  p.name as franchisee_name,
  p.email as franchisee_email,
  p.phone as franchisee_phone,
  p.address as franchisee_address,
  b.id as branch_id,
  b.name as branch_name,
  b.code as branch_code,
  b.address as branch_address,
  (
    select
      count(*) as count
    from
      franchisee_invoice_items
    where
      franchisee_invoice_items.invoice_id = fi.id
  ) as item_count,
  (
    select
      count(*) as count
    from
      franchisee_invoice_payments
    where
      franchisee_invoice_payments.invoice_id = fi.id
  ) as payment_count,
  case
    when (
      fi.payment_status = any (array['overdue'::text, 'partial'::text])
    )
    and CURRENT_DATE > fi.due_date then CURRENT_DATE - fi.due_date
    else 0
  end as days_overdue,
  fi.created_at,
  fi.updated_at
from
  franchisee_invoices fi
  join people p on fi.franchisee_id = p.id
  join branches b on fi.branch_id = b.id;