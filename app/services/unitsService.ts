import { supabase } from '../utils/supabaseClient';

export const unitsService = {
  async getAll() {
    return supabase.from('units').select('*');
  },
  async getById(id: string) {
    return supabase.from('units').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('units').insert([data]);
  },
  async update(id: string, data: any) {
    return supabase.from('units').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('units').delete().eq('id', id);
  },
}; 