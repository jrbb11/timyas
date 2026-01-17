-- Trigger to automatically waterfall credits to old unpaid invoices
DROP TRIGGER IF EXISTS trg_auto_waterfall_credits ON public.franchisee_credits;
CREATE TRIGGER trg_auto_waterfall_credits
AFTER INSERT OR UPDATE OF remaining_amount ON public.franchisee_credits
FOR EACH ROW
WHEN (NEW.remaining_amount > 0)
EXECUTE FUNCTION auto_apply_credits_to_branch_unpaid();
