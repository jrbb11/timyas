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
}; 