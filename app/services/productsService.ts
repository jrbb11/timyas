import { supabase } from '../utils/supabaseClient';

export const productsService = {
  async getAll() {
    return supabase
      .from('products')
      .select(`*, 
        brand:brands(name), 
        category:categories(id, name), 
        product_unit:units!product_unit(name, short_name), 
        sale_unit:units!sale_unit(name, short_name), 
        purchase_unit:units!purchase_unit(name, short_name)
      `);
  },
  async getById(id: string) {
    return supabase.from('products').select('*').eq('id', id).single();
  },
  async create(data: any, userId?: string) {
    // Use the new function that sets user context and performs insert in same session
    if (userId) {
      console.log('Creating product with user context:', userId); // Debug log
      const { data: result, error } = await supabase.rpc('create_product_with_user_context', {
        p_user_id: userId,
        p_data: data
      });
      return { data: result, error };
    } else {
      // Fallback to regular insert if no user ID provided
      return supabase.from('products').insert([data]);
    }
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    // Use the new function that sets user context and performs update in same session
    if (userId) {
      console.log('Updating product with user context:', userId); // Debug log
      const { error } = await supabase.rpc('update_product_with_user_context', {
        p_product_id: id,
        p_user_id: userId,
        p_data: data
      });
      return { error };
    } else {
      // Fallback to regular update if no user ID provided
      const { error } = await supabase.from('products').update(data).eq('id', id);
      return { error };
    }
  },
  async logEdit(productId: string, userId: string, changes: any) {
    // Use the new audit system function
    return supabase.rpc('log_data_change', {
      p_user_id: userId,
      p_action: 'UPDATE',
      p_resource: 'products',
      p_resource_id: productId,
      p_resource_name: `Product ${productId}`,
      p_old_values: changes.old || null,
      p_new_values: changes.new || null
    });
  },
  async getAuditLogs(productId: string) {
    // Use the new audit system function
    return supabase.rpc('get_audit_trail', {
      p_resource: 'products',
      p_resource_id: productId,
      p_limit: 100,
      p_offset: 0
    });
  },
  async remove(id: string, userId?: string) {
    // Use the new function that sets user context and performs delete in same session
    if (userId) {
      console.log('Deleting product with user context:', userId); // Debug log
      const { error } = await supabase.rpc('delete_product_with_user_context', {
        p_product_id: id,
        p_user_id: userId
      });
      return { error };
    } else {
      // Fallback to regular delete if no user ID provided
      return supabase.from('products').delete().eq('id', id);
    }
  },
  async getStockView() {
    return supabase.from('product_stock_view').select('*');
  },
}; 