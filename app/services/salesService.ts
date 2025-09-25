import { supabase } from '../utils/supabaseClient';

export const salesService = {
  async getAll() {
    return supabase.from('sales').select('*');
  },
  async getById(id: string) {
    return supabase.from('sales').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('sales').insert([data]).select();
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    const { error } = await supabase.from('sales').update(data).eq('id', id);
    if (!error && userId && oldData) {
      // Compute changes
      const changes = {};
      for (const key in data) {
        if (data[key] !== oldData[key]) {
          changes[key] = { from: oldData[key], to: data[key] };
        }
      }
      if (Object.keys(changes).length > 0) {
        await this.logEdit(id, userId, changes);
      }
    }
    return { error };
  },
  async remove(id: string) {
    return supabase.from('sales').delete().eq('id', id);
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
    return supabase.from('audit_logs').insert([
      {
        entity: 'sale',
        entity_id: saleId,
        user_id: userId,
        changes: JSON.stringify(changes),
        created_at: new Date().toISOString(),
      },
    ]);
  },
  async getAuditLogs(saleId: string) {
    return supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', 'sale')
      .eq('entity_id', saleId)
      .order('created_at', { ascending: false });
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