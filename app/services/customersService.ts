import { supabase } from '../utils/supabaseClient';

export const customersService = {
  async getAll() {
    return supabase.from('people').select('*').eq('type', 'customer');
  },
  async getById(id: string) {
    return supabase.from('people').select('*').eq('id', id).eq('type', 'customer').single();
  },
  async create(data: any, userId?: string) {
    // Use the new function that sets user context and performs insert in same session
    if (userId) {
      console.log('Creating customer with user context:', userId); // Debug log
      const { data: result, error } = await supabase.rpc('create_customer_with_user_context', {
        p_user_id: userId,
        p_data: data
      });
      return { data: result, error };
    } else {
      // Fallback to regular insert if no user ID provided
      return supabase.from('people').insert([{ ...data, type: 'customer' }]);
    }
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    // Use the new function that sets user context and performs update in same session
    if (userId) {
      console.log('Updating customer with user context:', userId); // Debug log
      const { error } = await supabase.rpc('update_customer_with_user_context', {
        p_customer_id: id,
        p_user_id: userId,
        p_data: data
      });
      return { error };
    } else {
      // Fallback to regular update if no user ID provided
      const { error } = await supabase.from('people').update(data).eq('id', id);
      return { error };
    }
  },
  async logEdit(customerId: string, userId: string, changes: any) {
    // Use the new audit system function
    return supabase.rpc('log_data_change', {
      p_user_id: userId,
      p_action: 'UPDATE',
      p_resource: 'people',
      p_resource_id: customerId,
      p_resource_name: `Customer ${customerId}`,
      p_old_values: changes.old || null,
      p_new_values: changes.new || null
    });
  },
  async getAuditLogs(customerId: string) {
    // Use the new audit system function
    return supabase.rpc('get_audit_trail', {
      p_resource: 'people',
      p_resource_id: customerId,
      p_limit: 100,
      p_offset: 0
    });
  },
  async remove(id: string, userId?: string) {
    // Use the new function that sets user context and performs delete in same session
    if (userId) {
      console.log('Deleting customer with user context:', userId); // Debug log
      const { error } = await supabase.rpc('delete_customer_with_user_context', {
        p_customer_id: id,
        p_user_id: userId
      });
      return { error };
    } else {
      // Fallback to regular delete if no user ID provided
      return supabase.from('people').delete().eq('id', id).eq('type', 'customer');
    }
  },
  async getUsersByIds(userIds: string[]): Promise<any[]> {
    if (!userIds.length) return [];
    const { data, error } = await supabase.from('people').select('user_id, name, email').in('user_id', userIds);
    return data || [];
  },
}; 