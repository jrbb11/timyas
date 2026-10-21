import { supabase } from '../utils/supabaseClient';

export interface SupplierPayload {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  note?: string | null;
  is_active?: boolean;
}

export const suppliersService = {
  async getAll() {
    return supabase.from('people').select('*').eq('type', 'supplier').order('name', { ascending: true });
  },
  async getById(id: string) {
    return supabase.from('people').select('*').eq('id', id).eq('type', 'supplier').single();
  },
  async create(data: SupplierPayload) {
    const payload = {
      name: data.name?.trim(),
      company: data.company?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      note: data.note?.trim() || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      type: 'supplier',
    };
    return supabase.from('people').insert([payload]).select().single();
  },
  async update(id: string, data: Partial<SupplierPayload>) {
    const payload = {
      name: data.name?.trim(),
      company: data.company?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      note: data.note?.trim() || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
    };
    return supabase.from('people').update(payload).eq('id', id).eq('type', 'supplier').select().single();
  },
  async remove(id: string) {
    return supabase.from('people').delete().eq('id', id).eq('type', 'supplier');
  },
  async getPurchasesBySupplier(supplierId: string) {
    return supabase
      .from('purchases')
      .select('id, date, reference, status, payment_status, total_amount, created_at')
      .eq('supplier', supplierId)
      .order('date', { ascending: false });
  },
  async getAllPurchasesSummary() {
    return supabase
      .from('purchases')
      .select('supplier, total_amount, payment_status');
  }
};
 