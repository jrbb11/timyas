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
}; 