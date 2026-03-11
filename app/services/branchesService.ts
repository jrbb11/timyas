import { supabase } from '../utils/supabaseClient';

export const branchesService = {
  async getAll() {
    return supabase.from('branches').select('*');
  },
  async create(data: any) {
    return supabase.from('branches').insert([data]).select();
  },
  async getById(id: string) {
    return supabase.from('branches').select('*').eq('id', id).single();
  },
  async update(id: string, data: any) {
    return supabase.from('branches').update(data).eq('id', id).select();
  },
  async remove(id: string) {
    return supabase.from('branches').delete().eq('id', id);
  },
};