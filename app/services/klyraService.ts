import { createClient } from '@supabase/supabase-js';

const klyraUrl = import.meta.env.VITE_KLYRA_URL as string;
const klyraAnonKey = import.meta.env.VITE_KLYRA_ANON_KEY as string;
const klyraClientId = import.meta.env.VITE_KLYRA_CLIENT_ID as string;

// Initialize a separate Supabase client for Klyra
const klyra = createClient(klyraUrl, klyraAnonKey);

export interface SubscriptionStatus {
  isExpired: boolean;
  expiryDate: string | null;
  serviceName: string | null;
}

export async function checkSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    if (!klyraUrl || !klyraAnonKey || !klyraClientId) {
      console.warn('Klyra configuration missing, skipping subscription check.');
      return { isExpired: false, expiryDate: null, serviceName: null };
    }

    const { data, error } = await klyra
      .from('services')
      .select('expiry_date, service_name')
      .eq('client_id', klyraClientId)
      .eq('service_type', 'domain-hosting')
      .single();

    if (error) {
      // PGRST116 means no rows found (client not in system or service missing)
      if (error.code === 'PGRST116') {
        console.warn(`No subscription record found for Client ID: ${klyraClientId}. Defaulting to NOT blocked.`);
        return { isExpired: false, expiryDate: null, serviceName: null };
      }
      
      console.error('Error checking Klyra subscription:', error);
      return { isExpired: false, expiryDate: null, serviceName: null };
    }

    if (!data || !data.expiry_date) {
      return { isExpired: false, expiryDate: null, serviceName: null };
    }

    const expiryDate = new Date(data.expiry_date);
    const now = new Date();

    return {
      isExpired: now > expiryDate,
      expiryDate: data.expiry_date,
      serviceName: data.service_name
    };
  } catch (err) {
    console.error('Unexpected error in checkSubscriptionStatus:', err);
    return { isExpired: false, expiryDate: null, serviceName: null };
  }
}
