// PayStack Payment Service for ScholarTrack
// All Paystack calls are proxied through a Supabase Edge Function
// (supabase/functions/paystack-proxy) so the secret key never reaches the client.

import { supabase } from './services/supabase';

const EDGE_FUNCTION_NAME = 'paystack-proxy';

interface ProxyOptions {
  action: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
}

async function callPaystackProxy<T>({ action, method = 'POST', body }: ProxyOptions): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(EDGE_FUNCTION_NAME, {
    body: { action, ...body },
  });

  if (error) {
    throw new Error(error.message || 'Paystack proxy call failed');
  }
  return data as T;
}

export interface PayStackTransaction {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  customer: {
    id: number;
    email: string;
    phone: string;
  };
  created_at: string;
}

export interface InitializePaymentParams {
  email: string;
  amount: number; // Amount in kobo (R100 = 10000 kobo)
  reference?: string;
  callback_url?: string;
  paymentType?: string;
  metadata?: Record<string, unknown>;
}

export interface CardBinInfo {
  bin: string;
  brand: string;
  sub_brand: string;
  country_code: string;
  country_name: string;
  card_type: string;
  bank: string;
}

export const payStackService = {
  // Initialize a payment transaction
  async initializePayment(params: InitializePaymentParams): Promise<{ authorization_url: string; reference: string }> {
    const reference = params.reference || `scholartrack_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const data = await callPaystackProxy<{ status: boolean; message: string; data: { authorization_url: string; reference: string } }>({
      action: 'initialize',
      method: 'POST',
      body: {
        email: params.email,
        amount: params.amount,
        reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
      },
    });
    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize payment');
    }
    return {
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    };
  },

  // Verify a payment transaction
  async verifyTransaction(reference: string): Promise<PayStackTransaction> {
    const data = await callPaystackProxy<{ status: boolean; message: string; data: PayStackTransaction }>({
      action: 'verify',
      method: 'POST',
      body: { id: reference },
    });
    if (!data.status) {
      throw new Error(data.message || 'Failed to verify transaction');
    }
    return data.data;
  },

  // Get card bin information
  async getCardBin(bin: string): Promise<CardBinInfo> {
    const data = await callPaystackProxy<{ status: boolean; message: string; data: CardBinInfo }>({
      action: 'bin',
      method: 'POST',
      body: { id: bin },
    });
    if (!data.status) {
      throw new Error(data.message || 'Failed to get bin info');
    }
    return data.data;
  },

  // Charge a customer (for saved cards)
  async chargeAuthorization(
    email: string,
    amount: number,
    authorizationCode: string,
    reference?: string
  ): Promise<PayStackTransaction> {
    const data = await callPaystackProxy<{ status: boolean; message: string; data: PayStackTransaction }>({
      action: 'charge',
      method: 'POST',
      body: {
        email,
        amount,
        authorization_code: authorizationCode,
        reference: reference || `scholartrack_${Date.now()}`,
      },
    });
    if (!data.status) {
      throw new Error(data.message || 'Failed to charge card');
    }
    return data.data;
  },

  // Create a customer
  async createCustomer(
    email: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ): Promise<{ id: number; customer_code: string }> {
    const data = await callPaystackProxy<{ status: boolean; message: string; data: { id: number; customer_code: string } }>({
      action: 'customer',
      method: 'POST',
      body: { email, first_name: firstName, last_name: lastName, phone },
    });
    if (!data.status) {
      throw new Error(data.message || 'Failed to create customer');
    }
    return { id: data.data.id, customer_code: data.data.customer_code };
  },

  // List customer's transactions
  async getCustomerTransactions(customerEmail: string): Promise<PayStackTransaction[]> {
    const data = await callPaystackProxy<{ status: boolean; message: string; data: PayStackTransaction[] }>({
      action: 'transactions',
      method: 'POST',
      body: { customer: customerEmail, per_page: 50 },
    });
    if (!data.status) {
      throw new Error(data.message || 'Failed to get transactions');
    }
    return data.data;
  },

  // Refund a transaction
  async refundTransaction(transactionId: number, amount?: number): Promise<{ status: boolean; message: string }> {
    const data = await callPaystackProxy<{ status: boolean; message: string }>({
      action: 'refund',
      method: 'POST',
      body: { transaction: transactionId, ...(amount && { amount }) },
    });
    return { status: data.status, message: data.message };
  },
};

// Helper functions for ScholarTrack
export const paymentHelper = {
  // Convert rand to kobo
  randToKobo(rand: number): number {
    return Math.round(rand * 100);
  },
  // Convert kobo to rand
  koboToRand(kobo: number): number {
    return kobo / 100;
  },
  // Format amount for display
  formatRand(amount: number): string {
    return `R${amount.toFixed(2)}`;
  },
  // Validate email
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  // Generate payment reference
  generateReference(prefix: string = 'scholartrack'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  },
  // Calculate platform fee
  calculatePlatformFee(amount: number, feePercentage: number = 0.029): number {
    return Math.round(amount * feePercentage);
  },
  // Check if amount is valid
  isValidAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount);
  },
  // Persist a payment record to Supabase.
  // Statuses: 'paid' | 'failed' | 'pending'.
  async savePaymentRecord(
    userId: string,
    amount: number,
    reference: string,
    status: 'paid' | 'failed' | 'pending',
    paymentType: string,
    childId?: string
  ): Promise<void> {
    const { error } = await supabase.from('payments').insert({
      user_id: userId,
      amount,
      reference,
      status,
      payment_type: paymentType,
      child_id: childId ?? null,
    });
    if (error) {
      // Don't throw to caller; payment verification already happened.
      // Surface as console warning so the issue is visible.
      // eslint-disable-next-line no-console
      console.warn('savePaymentRecord failed:', error.message);
    }
  },
};
