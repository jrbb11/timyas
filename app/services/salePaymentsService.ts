import { supabase } from '../utils/supabaseClient';

const TABLE = 'sale_payments';

export const salePaymentsService = {
  async getAll() {
    return await supabase.from(TABLE).select('*').order('payment_date', { ascending: false });
  },
  async getBySaleId(saleId: string) {
    return await supabase.from(TABLE).select('*').eq('sale_id', saleId).order('payment_date', { ascending: false });
  },
  async create(payment: any) {
    return await supabase.from(TABLE).insert([payment]);
  },
  async delete(id: string) {
    return await supabase.from(TABLE).delete().eq('id', id);
  },
}; 