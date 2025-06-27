import { supabase } from '../utils/supabaseClient';

export const purchaseItemsService = {
  async getAll() {
    return supabase.from('purchase_items').select('*');
  },
  async getByPurchaseId(purchase_id: string) {
    return supabase.from('purchase_items').select('*').eq('purchase_id', purchase_id);
  },
  async create(items: any[]) {
    return supabase.from('purchase_items').insert(items);
  },
  async update(id: string, data: any) {
    return supabase.from('purchase_items').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('purchase_items').delete().eq('id', id);
  },
}; 