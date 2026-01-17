CREATE OR REPLACE FUNCTION public.audit_trigger_function()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_old_values JSONB;
    v_new_values JSONB;
    v_user_email TEXT;
BEGIN
    -- Get the current user ID, use a valid user if none found
    v_user_id := COALESCE(
        current_setting('app.current_user_id', true)::UUID, 
        (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1)
    );
    
    -- Get user email
    BEGIN
        SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    EXCEPTION
        WHEN OTHERS THEN
            v_user_email := 'system@timyas.com';
    END;
    
    -- Determine action and values
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;
    
    -- Insert directly into audit_logs table
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        resource,
        resource_id,
        resource_name,
        old_values,
        new_values,
        severity,
        category,
        description
    ) VALUES (
        v_user_id,
        v_user_email,
        v_action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_TABLE_NAME || ' ' || COALESCE(NEW.id, OLD.id)::TEXT,
        v_old_values,
        v_new_values,
        'INFO',
        'DATA_CHANGE',
        v_action || ' operation on ' || TG_TABLE_NAME
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$
