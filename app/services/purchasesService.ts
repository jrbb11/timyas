import { supabase } from '../utils/supabaseClient';

export const purchasesService = {
  async getAll() {
    return supabase.from('purchases').select('*');
  },
  async getById(id: string) {
    return supabase.from('purchases').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('purchases').insert([data]).select();
  },
  async update(id: string, data: any) {
    return supabase.from('purchases').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('purchases').delete().eq('id', id);
  },
}; 