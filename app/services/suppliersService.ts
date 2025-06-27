import { supabase } from '../utils/supabaseClient';

export const suppliersService = {
  async getAll() {
    return supabase.from('people').select('*').eq('type', 'supplier');
  },
  async getById(id: string) {
    return supabase.from('people').select('*').eq('id', id).eq('type', 'supplier').single();
  },
  async create(data: any) {
    // Ensure type is set to 'supplier' when creating
    return supabase.from('people').insert([{ ...data, type: 'supplier' }]);
  },
  async update(id: string, data: any) {
    return supabase.from('people').update(data).eq('id', id).eq('type', 'supplier');
  },
  async remove(id: string) {
    return supabase.from('people').delete().eq('id', id).eq('type', 'supplier');
  },
}; 