import { supabase } from '../utils/supabaseClient';

export const customersService = {
  async getAll() {
    return supabase.from('people').select('*').eq('type', 'customer');
  },
  async getById(id: string) {
    return supabase.from('people').select('*').eq('id', id).eq('type', 'customer').single();
  },
  async create(data: any) {
    // Ensure type is set to 'customer' when creating
    return supabase.from('people').insert([{ ...data, type: 'customer' }]);
  },
  async update(id: string, data: any, userId?: string, oldData?: any) {
    const { error } = await supabase.from('people').update(data).eq('id', id);
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
  async logEdit(customerId: string, userId: string, changes: any) {
    return supabase.from('audit_logs').insert([
      {
        entity: 'customer',
        entity_id: customerId,
        user_id: userId,
        changes: JSON.stringify(changes),
        created_at: new Date().toISOString(),
      },
    ]);
  },
  async getAuditLogs(customerId: string) {
    return supabase
      .from('audit_logs')
      .select('*')
      .eq('entity', 'customer')
      .eq('entity_id', customerId)
      .order('created_at', { ascending: false });
  },
  async remove(id: string) {
    return supabase.from('people').delete().eq('id', id).eq('type', 'customer');
  },
  async getUsersByIds(userIds: string[]): Promise<any[]> {
    if (!userIds.length) return [];
    const { data, error } = await supabase.from('people').select('user_id, name, email').in('user_id', userIds);
    return data || [];
  },
}; 