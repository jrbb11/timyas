CREATE OR REPLACE FUNCTION public._trf_update_balance()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Debit from account
        UPDATE accounts 
        SET balance = balance - NEW.amount 
        WHERE id = NEW.from_account_id;
        -- Credit to account
        UPDATE accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.to_account_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the transfer
        UPDATE accounts 
        SET balance = balance + OLD.amount 
        WHERE id = OLD.from_account_id;
        UPDATE accounts 
        SET balance = balance - OLD.amount 
        WHERE id = OLD.to_account_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
