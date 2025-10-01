import { supabase } from '../utils/supabaseClient';

export const stockMovementService = {
  async getMovementHistory(productId?: string, warehouseId?: string, dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('product_adjustments')
      .select(`
        *,
        product:products(name, code),
        adjusted_by:people(name),
        adjustment_batch:adjustment_batches(reference_code, warehouse:warehouses(name))
      `)
      .order('adjusted_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (warehouseId) {
      query = query.eq('adjustment_batch.warehouse', warehouseId);
    }

    if (dateFrom) {
      query = query.gte('adjusted_at', `${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      query = query.lte('adjusted_at', `${dateTo} 23:59:59`);
    }

    return query;
  },

  async getPurchaseMovements(productId?: string, warehouseId?: string, dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('purchase_items')
      .select(`
        *,
        product:products(name, code),
        purchase:purchases(date, reference, warehouse:warehouses(name))
      `)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (warehouseId) {
      query = query.eq('purchase.warehouse', warehouseId);
    }

    if (dateFrom) {
      query = query.gte('purchase.date', `${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      query = query.lte('purchase.date', `${dateTo} 23:59:59`);
    }

    return query;
  },

  async getSaleMovements(productId?: string, warehouseId?: string, dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('sale_items')
      .select(`
        *,
        product:products(name, code),
        sale:sales(date, reference, warehouse:warehouses(name))
      `)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (warehouseId) {
      query = query.eq('sale.warehouse', warehouseId);
    }

    if (dateFrom) {
      query = query.gte('sale.date', `${dateFrom} 00:00:00`);
    }

    if (dateTo) {
      query = query.lte('sale.date', `${dateTo} 23:59:59`);
    }

    return query;
  },

  async getCurrentStock(productId?: string, warehouseId?: string) {
    let query = supabase
      .from('warehouse_stock')
      .select(`
        *,
        product:products(name, code, product_cost, product_price),
        warehouse:warehouses(name, code)
      `);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    return query;
  },
}; 