import { supabase } from '../utils/supabaseClient';

export const accountsService = {
  async getAll() {
    return await supabase.from('accounts').select('*');
  }
}; 