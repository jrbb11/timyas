import { supabase } from '../utils/supabaseClient';

export const adjustmentBatchesService = {
  async getAll() {
    return supabase
      .from('adjustment_batches')
      .select(`
        *,
        adjusted_by:people(name),
        warehouse:warehouses(name)
      `)
      .order('adjusted_at', { ascending: false });
  },
  async getById(id: string) {
    return supabase
      .from('adjustment_batches')
      .select(`
        *,
        adjusted_by:people(name),
        warehouse:warehouses(name)
      `)
      .eq('id', id)
      .single();
  },
  async create(data: any) {
    return supabase.from('adjustment_batches').insert([data]).select();
  },
  async update(id: string, data: any) {
    return supabase.from('adjustment_batches').update(data).eq('id', id);
  },
  async remove(id: string) {
    // Manually delete product_adjustments first to avoid calling trigger functions directly
    const delItems = await supabase.from('product_adjustments').delete().eq('adjustment_batch_id', id);
    if (delItems.error) return { error: delItems.error } as any;
    return supabase.from('adjustment_batches').delete().eq('id', id);
  },
}; 