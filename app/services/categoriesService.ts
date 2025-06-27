import { supabase } from '../utils/supabaseClient';

export const categoriesService = {
  async getAll() {
    return supabase.from('categories').select('*');
  },
  async getById(id: string) {
    return supabase.from('categories').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('categories').insert([data]);
  },
  async update(id: string, data: any) {
    return supabase.from('categories').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('categories').delete().eq('id', id);
  },
}; 