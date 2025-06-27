import { supabase } from '../utils/supabaseClient';

export const warehousesService = {
  async getAll() {
    return supabase.from('warehouses').select('*');
  },
  async getById(id: string) {
    return supabase.from('warehouses').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('warehouses').insert([data]);
  },
  async update(id: string, data: any) {
    return supabase.from('warehouses').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('warehouses').delete().eq('id', id);
  },
}; 