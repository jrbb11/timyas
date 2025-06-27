import { supabase } from '../utils/supabaseClient';

export const brandsService = {
  async getAll() {
    return supabase.from('brands').select('*');
  },
  async getById(id: string) {
    return supabase.from('brands').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('brands').insert([data]);
  },
  async update(id: string, data: any) {
    return supabase.from('brands').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('brands').delete().eq('id', id);
  },
}; 