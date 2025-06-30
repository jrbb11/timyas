import { supabase } from '../utils/supabaseClient';

export const warehouseStockService = {
  async getAll() {
    return supabase
      .from('warehouse_stock')
      .select(`
        *,
        product:products(name, code, product_cost, product_price),
        warehouse:warehouses(name, code)
      `);
  },
  async getByWarehouse(warehouseId: string) {
    return supabase
      .from('warehouse_stock')
      .select(`
        *,
        product:products(name, code, product_cost, product_price)
      `)
      .eq('warehouse_id', warehouseId);
  },
  async getByProduct(productId: string) {
    return supabase
      .from('warehouse_stock')
      .select(`
        *,
        warehouse:warehouses(name, code)
      `)
      .eq('product_id', productId);
  },
  async getStockMovement(productId: string, warehouseId: string) {
    // This would need a stock_movement_history table or view
    // For now, we'll return current stock
    return supabase
      .from('warehouse_stock')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .single();
  },
  async updateStock(warehouseId: string, productId: string, newStock: number) {
    return supabase
      .from('warehouse_stock')
      .upsert({
        warehouse_id: warehouseId,
        product_id: productId,
        stock: newStock
      });
  },
}; 