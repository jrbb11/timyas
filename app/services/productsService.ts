import { supabase } from '../utils/supabaseClient';

export const productsService = {
  async getAll() {
    return supabase
      .from('products')
      .select(`*, 
        brand:brands(name), 
        category:categories(id, name), 
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
  async update(id: string, data: any, userId?: string, oldData?: any) {
    const { error } = await supabase.from('products').update(data).eq('id', id);
    if (!error && userId && oldData) {
      const changes: Record<string, { from: any; to: any }> = {};
      for (const key in data) {
        if (data[key] !== oldData[key]) {
          changes[key] = { from: oldData[key], to: data[key] };
        }
      }
      if (Object.keys(changes).length > 0) {
        await this.logEdit(id, userId, changes);
      }
    }
    return { error };
  },
  async logEdit(productId: string, userId: string, changes: any) {
    return supabase.from('audit_logs').insert([
      {
        entity: 'product',
        entity_id: productId,
        user_id: userId,
        changes: JSON.stringify(changes),
        created_at: new Date().toISOString(),
      },
    ]);
  },
  async getAuditLogs(productId: string) {
    return supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', 'product')
      .eq('entity_id', productId)
      .order('created_at', { ascending: false });
  },
  async remove(id: string) {
    return supabase.from('products').delete().eq('id', id);
  },
  async getStockView() {
    return supabase.from('product_stock_view').select('*');
  },
}; 