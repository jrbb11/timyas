import { supabase } from '../utils/supabaseClient';

export const productsService = {
  async getAll() {
    return supabase
      .from('products')
      .select(`*, 
        brand:brands(name), 
        category:categories(name), 
        product_unit:units!product_unit(name, short_name), 
        sale_unit:units!sale_unit(name, short_name), 
        purchase_unit:units!purchase_unit(name, short_name)
      `);
  },
  async getById(id: string) {
    return supabase.from('products').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('products').insert([data]);
  },
  async update(id: string, data: any) {
    return supabase.from('products').update(data).eq('id', id);
  },
  async remove(id: string) {
    return supabase.from('products').delete().eq('id', id);
  },
  async getStockView() {
    return supabase.from('product_stock_view').select('*');
  },
}; 