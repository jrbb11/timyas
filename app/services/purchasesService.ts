import { supabase } from '../utils/supabaseClient';

export const purchasesService = {
  async getAll() {
    return supabase.from('purchases').select('*');
  },
  async getById(id: string) {
    return supabase.from('purchases').select('*').eq('id', id).single();
  },
  async create(data: any, userId?: string) {
    // Use the new function that sets user context and performs insert in same session
    if (userId) {
      console.log('Creating purchase with user context:', userId); // Debug log
      const { data: result, error } = await supabase.rpc('create_purchase_with_user_context', {
        p_user_id: userId,
        p_data: data
      });
      return { data: result, error };
    } else {
      // Fallback to regular insert if no user ID provided
      return supabase.from('purchases').insert([data]).select();
    }
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    // Use the new function that sets user context and performs update in same session
    if (userId) {
      console.log('Updating purchase with user context:', userId); // Debug log
      const { error } = await supabase.rpc('update_purchase_with_user_context', {
        p_purchase_id: id,
        p_user_id: userId,
        p_data: data
      });
      return { error };
    } else {
      // Fallback to regular update if no user ID provided
      const { error } = await supabase.from('purchases').update(data).eq('id', id);
      return { error };
    }
  },
  async remove(id: string, userId?: string) {
    // Use the new function that sets user context and performs delete in same session
    if (userId) {
      console.log('Deleting purchase with user context:', userId); // Debug log
      const { error } = await supabase.rpc('delete_purchase_with_user_context', {
        p_purchase_id: id,
        p_user_id: userId
      });
      return { error };
    } else {
      // Fallback to regular delete if no user ID provided
      return supabase.from('purchases').delete().eq('id', id);
    }
  },
  async logEdit(purchaseId: string, userId: string, changes: any) {
    // Use the new audit system function
    return supabase.rpc('log_data_change', {
      p_user_id: userId,
      p_action: 'UPDATE',
      p_resource: 'purchases',
      p_resource_id: purchaseId,
      p_resource_name: `Purchase ${purchaseId}`,
      p_old_values: changes.old || null,
      p_new_values: changes.new || null
    });
  },
  async getAuditLogs(purchaseId: string) {
    // Use the new audit system function
    return supabase.rpc('get_audit_trail', {
      p_resource: 'purchases',
      p_resource_id: purchaseId,
      p_limit: 100,
      p_offset: 0
    });
  },
}; 