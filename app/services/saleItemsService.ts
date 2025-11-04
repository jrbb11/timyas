import { supabase } from '../utils/supabaseClient';

export const saleItemsService = {
  async getAll() {
    return supabase.from('sale_items').select('*', { count: 'exact' }).limit(10000);
  },
  async getBySaleId(sale_id: string) {
    return supabase.from('sale_items').select('*').eq('sale_id', sale_id);
  },
  async create(items: any[]) {
    return supabase.from('sale_items').insert(items);
  },
  async update(id: string, data: any) {
    return supabase.from('sale_items').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('sale_items').delete().eq('id', id);
  },
}; 