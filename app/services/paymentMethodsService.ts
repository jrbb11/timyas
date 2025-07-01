import { supabase } from '../utils/supabaseClient';

export const paymentMethodsService = {
  async getAll() {
    return await supabase.from('payment_methods').select('*');
  }
}; 