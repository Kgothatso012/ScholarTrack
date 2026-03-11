// PayStack Payment Service for ScholarTrack
// Handles card payments for South African market

import { supabase } from './supabase';

const PAYSTACK_SECRET_KEY = process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

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
  paymentType?: 'monthly' | 'one-time' | 'deposit';
  metadata?: {
    user_id: string;
    child_id?: string;
    payment_type: 'monthly' | 'one-time' | 'deposit';
    description: string;
  };
}

export interface CardBinInfo {
  bin: string;
  brand: string;
  sub_brand: string;
  country_code: string;
  card_type: string;
  bank: string;
}

export const payStackService = {
  // Initialize a payment transaction
  async initializePayment(params: InitializePaymentParams): Promise<{ authorization_url: string; reference: string }> {
    const reference = params.reference || `scholartrack_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
      }),
    });

    const data = await response.json();

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
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to verify transaction');
    }

    return data.data;
  },

  // Get card bin information
  async getCardBin(bin: string): Promise<CardBinInfo> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/decision/bin/${bin}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to get bin info');
    }

    return data.data;
  },

  // Charge a customer (for saved cards)
  async chargeAuthorization(email: string, amount: number, authorizationCode: string, reference?: string): Promise<PayStackTransaction> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/charge_authorization`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        authorization_code: authorizationCode,
        reference: reference || `scholartrack_${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to charge card');
    }

    return data.data;
  },

  // Create a customer
  async createCustomer(email: string, firstName?: string, lastName?: string, phone?: string): Promise<{ id: number; customer_code: string }> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to create customer');
    }

    return {
      id: data.data.id,
      customer_code: data.data.customer_code,
    };
  },

  // List customer's transactions
  async getCustomerTransactions(customerEmail: string): Promise<PayStackTransaction[]> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction?customer=${customerEmail}&per_page=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to get transactions');
    }

    return data.data;
  },

  // Refund a transaction
  async refundTransaction(transactionId: number, amount?: number): Promise<{ status: boolean; message: string }> {
    const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction: transactionId,
        ...(amount && { amount }),
      }),
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to process refund');
    }

    return {
      status: data.status,
      message: data.message,
    };
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

  // Generate payment reference
  generateReference(type: string): string {
    return `st_${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  },

  // Save payment record to database
  async savePaymentRecord(
    userId: string,
    amount: number,
    reference: string,
    status: 'pending' | 'success' | 'failed',
    paymentType: string,
    childId?: string
  ) {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        parent_id: userId,
        amount,
        reference,
        status,
        payment_type: paymentType,
        child_id: childId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
