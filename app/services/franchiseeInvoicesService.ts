import { supabase } from '../utils/supabaseClient';

export interface FranchiseeInvoice {
  id: string;
  invoice_number: string;
  people_branches_id: string;
  branch_id: string;
  franchisee_id: string;
  invoice_date: string;
  period_start: string;
  period_end: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount: number;
  adjustment_amount: number;
  total_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  paid_amount: number;
  credit_amount: number;
  balance: number;
  status: 'draft' | 'sent' | 'approved' | 'cancelled';
  notes?: string;
  terms_conditions?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FranchiseeInvoiceItem {
  id: string;
  invoice_id: string;
  sale_id: string;
  description: string;
  sale_reference: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  shipping: number;
  line_total: number;
  created_at: string;
}

export interface FranchiseeInvoicePayment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method_id?: number;
  reference_number?: string;
  account_id: number;
  notes?: string;
  receipt_url?: string;
  created_by?: string;
  created_at: string;
}

export interface GenerateInvoiceParams {
  people_branches_id: string;
  period_start: string;
  period_end: string;
  due_days?: number;
  created_by?: string;
  notes?: string;
}

export interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
  overdue_amount: number;
  overdue_count: number;
}

export const franchiseeInvoicesService = {
  // ==================== INVOICES ====================

  /**
   * Get all franchisee invoices with optional filters
   */
  async getAll(filters?: {
    franchisee_id?: string;
    branch_id?: string;
    status?: string;
    payment_status?: string;
    from_date?: string;
    to_date?: string;
  }) {
    let query = supabase
      .from('franchisee_invoices')
      .select(`
        *,
        franchisee:people!franchisee_invoices_franchisee_fkey(id, name, email, phone),
        branch:branches!franchisee_invoices_branch_fkey(id, name, code, address)
      `)
      .order('invoice_date', { ascending: false });

    if (filters?.franchisee_id) {
      query = query.eq('franchisee_id', filters.franchisee_id);
    }
    if (filters?.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }
    if (filters?.from_date) {
      query = query.gte('invoice_date', filters.from_date);
    }
    if (filters?.to_date) {
      query = query.lte('invoice_date', filters.to_date);
    }

    return query;
  },

  /**
   * Get a single invoice by ID with all related data
   */
  async getById(id: string) {
    return supabase
      .from('franchisee_invoices')
      .select(`
        *,
        franchisee:people!franchisee_invoices_franchisee_fkey(id, name, email, phone, address, city, country),
        branch:branches!franchisee_invoices_branch_fkey(id, name, code, address, city, country),
        items:franchisee_invoice_items(*),
        payments:franchisee_invoice_payments(
          *,
          payment_method:payment_methods(id, name),
          account:accounts(id, name)
        )
      `)
      .eq('id', id)
      .single();
  },

  /**
   * Get invoice details view
   */
  async getInvoiceDetails(filters?: {
    franchisee_id?: string;
    branch_id?: string;
    payment_status?: string;
  }) {
    let query = supabase
      .from('v_franchisee_invoice_details')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (filters?.franchisee_id) {
      query = query.eq('franchisee_id', filters.franchisee_id);
    }
    if (filters?.branch_id) {
      query = query.eq('branch_id', filters.branch_id);
    }
    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    return query;
  },

  /**
   * Generate a new invoice for a franchisee based on sales
   */
  async generateInvoice(params: GenerateInvoiceParams) {
    const { data, error } = await supabase.rpc('generate_franchisee_invoice', {
      p_people_branches_id: params.people_branches_id,
      p_period_start: params.period_start,
      p_period_end: params.period_end,
      p_due_days: params.due_days || 30,
      p_created_by: params.created_by || null,
      p_notes: params.notes || null
    });

    return { data, error };
  },

  /**
   * Create a manual invoice
   */
  async create(data: Partial<FranchiseeInvoice>) {
    return supabase
      .from('franchisee_invoices')
      .insert([data])
      .select();
  },

  /**
   * Update an invoice
   */
  async update(id: string, data: Partial<FranchiseeInvoice>) {
    return supabase
      .from('franchisee_invoices')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();
  },

  /**
   * Change invoice status
   */
  async updateStatus(id: string, status: FranchiseeInvoice['status'], userId?: string) {
    const updates: Partial<FranchiseeInvoice> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved' && userId) {
      updates.approved_by = userId;
      updates.approved_at = new Date().toISOString();
    }

    return supabase
      .from('franchisee_invoices')
      .update(updates)
      .eq('id', id)
      .select();
  },

  /**
   * Delete/Cancel an invoice
   */
  async cancel(id: string) {
    return supabase
      .from('franchisee_invoices')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  /**
   * Delete an invoice (hard delete)
   */
  async delete(id: string) {
    return supabase
      .from('franchisee_invoices')
      .delete()
      .eq('id', id);
  },

  /**
   * Get invoice summary for a franchisee
   */
  async getFranchiseeSummary(franchiseeId: string): Promise<{ data: InvoiceSummary | null; error: any }> {
    const { data, error } = await supabase.rpc('get_franchisee_invoice_summary', {
      p_franchisee_id: franchiseeId
    });

    if (error) {
      return { data: null, error };
    }

    return { data: data?.[0] || null, error: null };
  },

  // ==================== INVOICE ITEMS ====================

  /**
   * Get items for an invoice
   */
  async getItems(invoiceId: string) {
    return supabase
      .from('franchisee_invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sale_date', { ascending: false });
  },

  /**
   * Add item to invoice
   */
  async addItem(data: Partial<FranchiseeInvoiceItem>) {
    return supabase
      .from('franchisee_invoice_items')
      .insert([data])
      .select();
  },

  /**
   * Update invoice item
   */
  async updateItem(id: string, data: Partial<FranchiseeInvoiceItem>) {
    return supabase
      .from('franchisee_invoice_items')
      .update(data)
      .eq('id', id)
      .select();
  },

  /**
   * Delete invoice item
   */
  async deleteItem(id: string) {
    return supabase
      .from('franchisee_invoice_items')
      .delete()
      .eq('id', id);
  },

  // ==================== INVOICE PAYMENTS ====================

  /**
   * Get payments for an invoice
   */
  async getPayments(invoiceId: string) {
    return supabase
      .from('franchisee_invoice_payments')
      .select(`
        *,
        payment_method:payment_methods(id, name),
        account:accounts(id, name),
        creator:people!franchisee_invoice_payments_created_by_fkey(id, name)
      `)
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });
  },

  /**
   * Record a payment for an invoice
   */
  async addPayment(data: Partial<FranchiseeInvoicePayment>) {
    return supabase
      .from('franchisee_invoice_payments')
      .insert([data])
      .select();
  },

  /**
   * Update a payment
   */
  async updatePayment(id: string, data: Partial<FranchiseeInvoicePayment>) {
    return supabase
      .from('franchisee_invoice_payments')
      .update(data)
      .eq('id', id)
      .select();
  },

  /**
   * Delete a payment
   */
  async deletePayment(id: string) {
    return supabase
      .from('franchisee_invoice_payments')
      .delete()
      .eq('id', id);
  },

  // ==================== REPORTS & ANALYTICS ====================

  /**
   * Get outstanding invoices
   */
  async getOutstandingInvoices(franchiseeId?: string) {
    let query = supabase
      .from('franchisee_invoices')
      .select(`
        *,
        franchisee:people!franchisee_invoices_franchisee_fkey(id, name, email, phone),
        branch:branches!franchisee_invoices_branch_fkey(id, name, code)
      `)
      .in('payment_status', ['unpaid', 'partial', 'overdue'])
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });

    if (franchiseeId) {
      query = query.eq('franchisee_id', franchiseeId);
    }

    return query;
  },

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(franchiseeId?: string) {
    let query = supabase
      .from('franchisee_invoices')
      .select(`
        *,
        franchisee:people!franchisee_invoices_franchisee_fkey(id, name, email, phone),
        branch:branches!franchisee_invoices_branch_fkey(id, name, code)
      `)
      .eq('payment_status', 'overdue')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });

    if (franchiseeId) {
      query = query.eq('franchisee_id', franchiseeId);
    }

    return query;
  },

  /**
   * Get invoices by period
   */
  async getInvoicesByPeriod(startDate: string, endDate: string, franchiseeId?: string) {
    let query = supabase
      .from('franchisee_invoices')
      .select(`
        *,
        franchisee:people!franchisee_invoices_franchisee_fkey(id, name),
        branch:branches!franchisee_invoices_branch_fkey(id, name)
      `)
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .neq('status', 'cancelled')
      .order('invoice_date', { ascending: false });

    if (franchiseeId) {
      query = query.eq('franchisee_id', franchiseeId);
    }

    return query;
  },

  /**
   * Get payment history
   */
  async getPaymentHistory(franchiseeId?: string, fromDate?: string, toDate?: string) {
    let query = supabase
      .from('franchisee_invoice_payments')
      .select(`
        *,
        invoice:franchisee_invoices(
          id,
          invoice_number,
          franchisee:people!franchisee_invoices_franchisee_fkey(id, name),
          branch:branches!franchisee_invoices_branch_fkey(id, name)
        ),
        payment_method:payment_methods(id, name),
        account:accounts(id, name)
      `)
      .order('payment_date', { ascending: false });

    if (franchiseeId) {
      query = query.eq('invoice.franchisee_id', franchiseeId);
    }
    if (fromDate) {
      query = query.gte('payment_date', fromDate);
    }
    if (toDate) {
      query = query.lte('payment_date', toDate);
    }

    return query;
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Generate invoices for all franchisees for a period
   */
  async generateBulkInvoices(periodStart: string, periodEnd: string, dueDays: number = 30, createdBy?: string) {
    // Get all active franchisees
    const { data: peopleBranches, error: pbError } = await supabase
      .from('people_branches')
      .select('id, person_id, branch_id');

    if (pbError || !peopleBranches) {
      return { data: null, error: pbError };
    }

    const results = [];
    for (const pb of peopleBranches) {
      const { data, error } = await this.generateInvoice({
        people_branches_id: pb.id,
        period_start: periodStart,
        period_end: periodEnd,
        due_days: dueDays,
        created_by: createdBy
      });

      results.push({ people_branches_id: pb.id, invoice_id: data, error });
    }

    return { data: results, error: null };
  },

  /**
   * Send invoice reminders for overdue invoices
   */
  async getInvoicesForReminders(daysBeforeDue: number = 3) {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + daysBeforeDue);

    return supabase
      .from('franchisee_invoices')
      .select(`
        *,
        franchisee:people!franchisee_invoices_franchisee_fkey(id, name, email, phone),
        branch:branches!franchisee_invoices_branch_fkey(id, name)
      `)
      .in('payment_status', ['unpaid', 'partial'])
      .lte('due_date', reminderDate.toISOString().split('T')[0])
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true });
  }
};
