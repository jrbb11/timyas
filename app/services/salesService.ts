import { supabase } from '../utils/supabaseClient';

export const salesService = {
  async getAll() {
    return supabase.from('sales').select('*');
  },
  async getById(id: string) {
    return supabase.from('sales').select('*').eq('id', id).single();
  },
  async create(data: any, userId?: string) {
    // Use the new function that sets user context and performs insert in same session
    if (userId) {
      console.log('Creating sale with user context:', userId); // Debug log
      const { data: result, error } = await supabase.rpc('create_sale_with_user_context', {
        p_user_id: userId,
        p_data: data
      });
      return { data: result, error };
    } else {
      // Fallback to regular insert if no user ID provided
      return supabase.from('sales').insert([data]).select();
    }
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    // Use the new function that sets user context and performs update in same session
    if (userId) {
      console.log('Updating sale with user context:', userId); // Debug log
      const { error } = await supabase.rpc('update_sale_with_user_context', {
        p_sale_id: id,
        p_user_id: userId,
        p_data: data
      });
      return { error };
    } else {
      // Fallback to regular update if no user ID provided
      const { error } = await supabase.from('sales').update(data).eq('id', id);
      return { error };
    }
  },
  async remove(id: string, userId?: string) {
    // Use the new function that sets user context and performs delete in same session
    if (userId) {
      console.log('Deleting sale with user context:', userId); // Debug log
      const { error } = await supabase.rpc('delete_sale_with_user_context', {
        p_sale_id: id,
        p_user_id: userId
      });
      return { error };
    } else {
      // Fallback to regular delete if no user ID provided
      return supabase.from('sales').delete().eq('id', id);
    }
  },
  async getView() {
    return supabase.from('sales_view').select('*');
  },
  async getByInvoiceNumber(invoice_number: string) {
    return supabase.from('sales').select('*').eq('invoice_number', invoice_number);
  },
  async getViewById(id: string) {
    return supabase.from('sales_view').select('*').eq('id', id);
  },
  async logEdit(saleId: string, userId: string, changes: any) {
    // Use the new audit system function
    return supabase.rpc('log_data_change', {
      p_user_id: userId,
      p_action: 'UPDATE',
      p_resource: 'sales',
      p_resource_id: saleId,
      p_resource_name: `Sale ${saleId}`,
      p_old_values: changes.old || null,
      p_new_values: changes.new || null
    });
  },
  async getAuditLogs(saleId: string) {
    // Use the same RPC function that works in AuditTrailViewer
    console.log('Querying audit_logs for saleId:', saleId); // Debug log
    const result = await supabase.rpc('get_audit_trail', {
      p_resource: 'sales',
      p_resource_id: saleId,
      p_user_id: null,
      p_action: null,
      p_start_date: null,
      p_end_date: null,
      p_limit: 100,
      p_offset: 0
    });
    
    console.log('RPC query result:', result); // Debug log
    return result;
  },
  async getBranchById(id: string) {
    return supabase.from('branches').select('id, name').eq('id', id).single();
  },
};

export interface SalesByCustomer {
  customer: string;
  total_sales: number;
  total_paid: number;
  total_due: number;
}

export async function getSalesByCustomer(): Promise<SalesByCustomer[]> {
  const { data, error } = await supabase
    .from('sales_view')
    .select('customer, total_amount, paid, due')
    .neq('customer', null);

  if (error) throw error;

  const grouped: { [key: string]: SalesByCustomer } = {};
  (data || []).forEach((row: any) => {
    if (!grouped[row.customer]) {
      grouped[row.customer] = { customer: row.customer, total_sales: 0, total_paid: 0, total_due: 0 };
    }
    const totalAmount = row.total_amount || 0;
    const shipping = row.shipping || 0;
    grouped[row.customer].total_sales += (totalAmount - shipping);
    grouped[row.customer].total_paid += row.paid || 0;
    grouped[row.customer].total_due += row.due || 0;
  });
  return Object.values(grouped);
} 