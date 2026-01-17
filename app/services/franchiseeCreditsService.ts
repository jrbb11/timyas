import { supabase } from '../utils/supabaseClient';

// ==================== TYPES ====================

export type CreditSource = 'overpayment' | 'return' | 'adjustment';
export type AdjustmentType = 'reversal' | 'correction';

export interface FranchiseeCredit {
    id: string;
    franchisee_id: string;
    people_branches_id: string;
    amount: number;
    source_type: CreditSource;
    source_invoice_id?: string;
    used_amount: number;
    remaining_amount: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreditApplication {
    id: string;
    credit_id: string;
    invoice_id: string;
    amount_applied: number;
    applied_at: string;
}

export interface PaymentAdjustment {
    id: string;
    payment_id: string;
    adjustment_type: AdjustmentType;
    original_amount: number;
    adjusted_amount: number;
    difference: number;
    reason: string;
    adjusted_by: string;
    adjusted_at: string;
}

export interface CreditWithInvoice extends FranchiseeCredit {
    source_invoice?: {
        invoice_number: string;
        invoice_date: string;
    };
    applications?: Array<{
        invoice_id: string;
        amount_applied: number;
        applied_at: string;
        invoice?: {
            invoice_number: string;
        };
    }>;
}

// ==================== SERVICE ====================

export const franchiseeCreditsService = {

    // ==================== CREDIT MANAGEMENT ====================

    /**
     * Get all credits for a franchisee
     */
    async getFranchiseeCredits(franchiseeId: string, peopleBranchesId?: string, includeUsed: boolean = false) {
        let query = supabase
            .from('franchisee_credits')
            .select(`
        *,
        source_invoice:franchisee_invoices!source_invoice_id(invoice_number, invoice_date),
        applications:credit_applications(
          invoice_id,
          amount_applied,
          applied_at,
          invoice:franchisee_invoices(invoice_number)
        )
      `)
            .eq('franchisee_id', franchiseeId)
            .order('created_at', { ascending: false });

        if (peopleBranchesId) {
            query = query.eq('people_branches_id', peopleBranchesId);
        }

        if (!includeUsed) {
            query = query.gt('remaining_amount', 0);
        }

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Get a single credit by ID
     */
    async getCreditById(creditId: string) {
        const { data, error } = await supabase
            .from('franchisee_credits')
            .select(`
        *,
        source_invoice:invoices!source_invoice_id(invoice_number, invoice_date),
        applications:credit_applications(
          invoice_id,
          amount_applied,
          applied_at,
          invoice:invoices(invoice_number)
        )
      `)
            .eq('id', creditId)
            .single();

        return { data, error };
    },

    /**
     * Get available credit balance for a franchisee
     */
    async getAvailableCreditBalance(peopleBranchesId: string): Promise<{ balance: number; error: any }> {
        const { data, error } = await supabase
            .rpc('get_franchisee_available_credit', { p_people_branches_id: peopleBranchesId });

        if (error) {
            console.error('Error getting credit balance:', error);
            return { balance: 0, error };
        }

        return { balance: data || 0, error: null };
    },

    /**
     * Create a credit from overpayment
     */
    async createCreditFromOverpayment(data: {
        franchisee_id: string;
        amount: number;
        source_invoice_id: string;
        notes?: string;
    }) {
        const { data: credit, error } = await supabase
            .from('franchisee_credits')
            .insert({
                franchisee_id: data.franchisee_id,
                amount: data.amount,
                source_type: 'overpayment',
                source_invoice_id: data.source_invoice_id,
                used_amount: 0,
                remaining_amount: data.amount,
                notes: data.notes || 'Credit from overpayment',
            })
            .select()
            .single();

        return { data: credit, error };
    },

    /**
     * Create a manual credit adjustment
     */
    async createManualCredit(data: {
        franchisee_id: string;
        amount: number;
        source_type: CreditSource;
        source_invoice_id?: string;
        notes: string;
    }) {
        const { data: credit, error } = await supabase
            .from('franchisee_credits')
            .insert({
                ...data,
                used_amount: 0,
                remaining_amount: data.amount,
            })
            .select()
            .single();

        return { data: credit, error };
    },

    /**
     * Apply credit to an invoice (using database function)
     */
    async applyCreditToInvoice(creditId: string, invoiceId: string, amount: number) {
        const { data, error } = await supabase
            .rpc('apply_credit_to_invoice', {
                p_credit_id: creditId,
                p_invoice_id: invoiceId,
                p_amount: amount,
            });

        return { data, error };
    },

    /**
     * Auto-apply available credits to an invoice
     */
    async autoApplyCreditsToInvoice(invoiceId: string) {
        const { data, error } = await supabase
            .rpc('auto_apply_credits_to_invoice', {
                p_invoice_id: invoiceId,
            });

        return { data: data || 0, error };
    },

    /**
     * Get credit application history for an invoice
     */
    async getInvoiceCreditApplications(invoiceId: string) {
        const { data, error } = await supabase
            .from('credit_applications')
            .select(`
        *,
        credit:franchisee_credits(
          amount,
          source_type,
          notes
        )
      `)
            .eq('invoice_id', invoiceId)
            .order('applied_at', { ascending: false });

        return { data, error };
    },

    /**
     * Get credit summary for a franchisee
     */
    async getCreditSummary(franchiseeId: string) {
        const { data: credits, error } = await supabase
            .from('franchisee_credits')
            .select('amount, used_amount, remaining_amount')
            .eq('franchisee_id', franchiseeId);

        if (error) {
            return {
                summary: {
                    total_credits: 0,
                    total_used: 0,
                    total_remaining: 0,
                },
                error
            };
        }

        const summary = credits.reduce(
            (acc, credit) => ({
                total_credits: acc.total_credits + credit.amount,
                total_used: acc.total_used + credit.used_amount,
                total_remaining: acc.total_remaining + credit.remaining_amount,
            }),
            { total_credits: 0, total_used: 0, total_remaining: 0 }
        );

        return { summary, error: null };
    },

    // ==================== PAYMENT ADJUSTMENTS ====================

    /**
     * Create a payment adjustment
     */
    async createPaymentAdjustment(data: {
        payment_id: string;
        adjustment_type: AdjustmentType;
        original_amount: number;
        adjusted_amount: number;
        reason: string;
        adjusted_by: string;
    }) {
        const difference = data.adjusted_amount - data.original_amount;

        // Insert into payment_adjustments table
        const { data: adjustment, error: adjustmentError } = await supabase
            .from('payment_adjustments')
            .insert({
                payment_id: data.payment_id,
                adjustment_type: data.adjustment_type,
                original_amount: data.original_amount,
                adjusted_amount: data.adjusted_amount,
                difference,
                reason: data.reason,
                adjusted_by: data.adjusted_by,
            })
            .select()
            .single();

        if (adjustmentError) {
            return { data: null, error: adjustmentError };
        }

        // Update the payment record
        const { error: updateError } = await supabase
            .from('franchisee_invoice_payments')
            .update({
                amount: data.adjusted_amount,
                adjustment_type: data.adjustment_type,
                adjustment_reason: data.reason,
            })
            .eq('id', data.payment_id);

        if (updateError) {
            return { data: null, error: updateError };
        }

        return { data: adjustment, error: null };
    },

    /**
     * Get adjustment history for a payment
     */
    async getPaymentAdjustments(paymentId: string) {
        const { data, error } = await supabase
            .from('payment_adjustments')
            .select('*')
            .eq('payment_id', paymentId)
            .order('adjusted_at', { ascending: false });

        return { data, error };
    },

    /**
     * Get all adjustments for a franchisee
     */
    async getFranchiseeAdjustments(franchiseeId: string, fromDate?: string, toDate?: string) {
        let query = supabase
            .from('payment_adjustments')
            .select(`
        *,
        payment:franchisee_invoice_payments!payment_id(
          invoice_id,
          payment_date,
          reference_number
        )
      `)
            .order('adjusted_at', { ascending: false });

        // Note: We need to join through payments to filter by franchisee
        // This would require a more complex query or view

        const { data, error } = await query;
        return { data, error };
    },

    /**
     * Validate adjustment business rules
     */
    validateAdjustment(adjustmentData: {
        original_amount: number;
        adjusted_amount: number;
        reason: string;
    }): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check if adjusted amount is negative
        if (adjustmentData.adjusted_amount < 0) {
            errors.push('Adjusted amount cannot be negative');
        }

        // Check if reason is provided and sufficient
        if (!adjustmentData.reason || adjustmentData.reason.trim().length < 10) {
            errors.push('Adjustment reason must be at least 10 characters');
        }

        // Check if there's actually a change
        if (adjustmentData.original_amount === adjustmentData.adjusted_amount) {
            errors.push('Adjusted amount is the same as original amount');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    },
};

export default franchiseeCreditsService;
