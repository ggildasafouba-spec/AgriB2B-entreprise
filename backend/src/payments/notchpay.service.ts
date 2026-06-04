import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class NotchPayService {
  private readonly logger = new Logger(NotchPayService.name);
  private readonly apiUrl = 'https://api.notchpay.co';
  private readonly publicKey: string;
  private readonly hashKey: string;

  constructor() {
    this.publicKey = process.env.NOTCHPAY_PUBLIC_KEY || '';
    this.hashKey = process.env.NOTCHPAY_HASH_KEY || '';
    if (!this.publicKey) {
      this.logger.warn('NOTCHPAY_PUBLIC_KEY not configured - payments will be simulated');
    }
  }

  /**
   * Initialise un paiement via NotchPay
   * Retourne l'URL de paiement et la référence NotchPay
   */
  async initializePayment(params: {
    amount: number;
    currency?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    description: string;
    reference: string;
    callbackUrl: string;
  }) {
    if (!this.publicKey) {
      this.logger.log(`[SIMULATION] Payment initialized: ${params.amount} ${params.currency || 'XAF'}`);
      return {
        reference: params.reference,
        notchpayReference: null,
        authorization_url: null,
        status: 'pending',
        simulated: true,
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': this.publicKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency || 'XAF',
          email: params.customerEmail || undefined,
          phone: params.customerPhone,
          customer: {
            name: params.customerName,
            email: params.customerEmail,
            phone: params.customerPhone,
          },
          description: params.description,
          reference: params.reference,
          callback: params.callbackUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`NotchPay init error [${response.status}]: ${JSON.stringify(data)}`);
        throw new Error(data.message || `Erreur NotchPay (${response.status})`);
      }

      const notchpayRef = data.transaction?.reference || null;
      this.logger.log(`Payment initialized: ${params.reference} -> NotchPay ref: ${notchpayRef}`);

      return {
        reference: params.reference,
        notchpayReference: notchpayRef,
        authorization_url: data.authorization_url || null,
        status: data.transaction?.status || 'pending',
        simulated: false,
      };
    } catch (error: any) {
      this.logger.error(`NotchPay initializePayment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Charge direct — envoie un prompt USSD au téléphone du client
   * Utilisé pour MTN MoMo (cm.mtn) et Orange Money (cm.orange)
   */
  async directCharge(notchpayReference: string, params: {
    channel: string;
    phone: string;
  }) {
    if (!this.publicKey) {
      this.logger.log(`[SIMULATION] Direct charge: ${params.channel} -> ${params.phone}`);
      return { status: 'processing', simulated: true };
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments/${notchpayReference}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.publicKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: params.channel,
          data: {
            phone: params.phone,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`NotchPay direct charge error [${response.status}]: ${JSON.stringify(data)}`);
        throw new Error(data.message || `Erreur lors du paiement direct (${response.status})`);
      }

      this.logger.log(`Direct charge initiated: ${notchpayReference} via ${params.channel}`);

      return {
        status: data.transaction?.status || 'processing',
        reference: data.transaction?.reference || notchpayReference,
        simulated: false,
      };
    } catch (error: any) {
      this.logger.error(`NotchPay directCharge failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie le statut d'un paiement via son référence NotchPay
   */
  async verifyPayment(reference: string) {
    if (!this.publicKey) {
      return { status: 'complete', simulated: true };
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments/${reference}`, {
        headers: {
          'Authorization': this.publicKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`NotchPay verify error [${response.status}]: ${JSON.stringify(data)}`);
        throw new Error(data.message || 'Erreur de vérification du paiement');
      }

      return {
        status: data.transaction?.status || 'pending',
        amount: data.transaction?.amount,
        currency: data.transaction?.currency,
        reference: data.transaction?.reference,
        trxref: data.transaction?.trxref,
        completedAt: data.transaction?.completed_at,
        simulated: false,
      };
    } catch (error: any) {
      this.logger.error(`NotchPay verifyPayment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie la signature du webhook NotchPay
   * Utilise le hash key configuré dans le dashboard NotchPay
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.hashKey) {
      this.logger.warn('NOTCHPAY_HASH_KEY not set — skipping webhook signature verification');
      return true; // Pas de vérification si pas de clé
    }

    const computedHash = crypto
      .createHmac('sha256', this.hashKey)
      .update(payload)
      .digest('hex');

    return computedHash === signature;
  }

  /**
   * Retourne le channel NotchPay correspondant au provider
   */
  getChannelForProvider(provider: string): string {
    const channels: Record<string, string> = {
      MTN_MOMO: 'cm.mtn',
      ORANGE_MONEY: 'cm.orange',
    };
    return channels[provider] || 'cm.mtn';
  }
}
