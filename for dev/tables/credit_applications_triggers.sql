-- Trigger to refresh invoice status when a credit is applied
CREATE TRIGGER trg_on_credit_application_change
AFTER INSERT OR UPDATE OR DELETE ON public.credit_applications
FOR EACH ROW
EXECUTE FUNCTION update_franchisee_invoice_payment_status();
