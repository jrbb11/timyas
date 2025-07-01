import { supabase } from '../utils/supabaseClient';

export const purchasesService = {
  async getAll() {
    return supabase.from('purchases').select('*');
  },
  async getById(id: string) {
    return supabase.from('purchases').select('*').eq('id', id).single();
  },
  async create(data: any) {
    return supabase.from('purchases').insert([data]).select();
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    const { error } = await supabase.from('purchases').update(data).eq('id', id);
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
  async remove(id: string) {
    return supabase.from('purchases').delete().eq('id', id);
  },
  async logEdit(purchaseId: string, userId: string, changes: any) {
    return supabase.from('audit_logs').insert([
      {
        entity: 'purchase',
        entity_id: purchaseId,
        user_id: userId,
        changes: JSON.stringify(changes),
        created_at: new Date().toISOString(),
      },
    ]);
  },
  async getAuditLogs(purchaseId: string) {
    return supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', 'purchase')
      .eq('entity_id', purchaseId)
      .order('created_at', { ascending: false });
  },
}; 