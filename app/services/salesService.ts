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
  async update(id: string, data: any) {
    return supabase.from('sales').update(data).eq('id', id);
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
}; 