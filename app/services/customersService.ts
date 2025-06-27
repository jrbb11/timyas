import { supabase } from '../utils/supabaseClient';

export const customersService = {
  async getAll() {
    return supabase.from('people').select('*').eq('type', 'customer');
  },
  async getById(id: string) {
    return supabase.from('people').select('*').eq('id', id).eq('type', 'customer').single();
  },
  async create(data: any) {
    // Ensure type is set to 'customer' when creating
    return supabase.from('people').insert([{ ...data, type: 'customer' }]);
  },
  async update(id: string, data: any) {
    return supabase.from('people').update(data).eq('id', id).eq('type', 'customer');
  },
  async remove(id: string) {
    return supabase.from('people').delete().eq('id', id).eq('type', 'customer');
  },
}; 