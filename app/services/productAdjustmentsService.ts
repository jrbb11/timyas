import { supabase } from '../utils/supabaseClient';

export const productAdjustmentsService = {
  async getAll() {
    return supabase
      .from('product_adjustments')
      .select(`
        *,
        product:products(name, code),
        adjusted_by:people(name),
        adjustment_batch:adjustment_batches(reference_code)
      `)
      .order('adjusted_at', { ascending: false });
  },
  async getByBatchId(batchId: string) {
    return supabase
      .from('product_adjustments')
      .select(`
        *,
        product:products(name, code, product_cost, product_price)
      `)
      .eq('adjustment_batch_id', batchId);
  },
  async getById(id: string) {
    return supabase
      .from('product_adjustments')
      .select(`
        *,
        product:products(name, code),
        adjusted_by:people(name),
        adjustment_batch:adjustment_batches(reference_code)
      `)
      .eq('id', id)
      .single();
  },
  async create(data: any) {
    return supabase.from('product_adjustments').insert([data]);
  },
  async createMany(data: any[]) {
    return supabase.from('product_adjustments').insert(data);
  },
  async removeByBatchId(batchId: string) {
    return supabase.from('product_adjustments').delete().eq('adjustment_batch_id', batchId);
  },
  async update(id: string, data: any) {
    return supabase.from('product_adjustments').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('product_adjustments').delete().eq('id', id);
  },
}; 