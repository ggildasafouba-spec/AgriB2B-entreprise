import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotchPayService {
  private readonly logger = new Logger(NotchPayService.name);
  private readonly apiUrl = 'https://api.notchpay.co';
  private readonly publicKey: string;

  constructor() {
    this.publicKey = process.env.NOTCHPAY_PUBLIC_KEY || '';
    if (!this.publicKey) {
      this.logger.warn('NOTCHPAY_PUBLIC_KEY not configured - payments will be simulated');
    }
  }

  /**
   * Initialise un paiement via NotchPay
   * Retourne l'URL de paiement et la référence
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
      // Mode simulation si pas de clé configurée
      this.logger.log(`[SIMULATION] Payment initialized: ${params.amount} ${params.currency || 'XAF'}`);
      return {
        reference: params.reference,
        authorization_url: null,
        status: 'pending',
        simulated: true,
      };
    }

    const response = await fetch(`${this.apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': this.publicKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'XAF',
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
      this.logger.error(`NotchPay error: ${JSON.stringify(data)}`);
      throw new Error(data.message || 'Erreur lors de l\'initialisation du paiement');
    }

    this.logger.log(`Payment initialized: ${params.reference} -> ${data.authorization_url}`);

    return {
      reference: data.transaction?.reference || params.reference,
      authorization_url: data.authorization_url,
      status: data.transaction?.status || 'pending',
      simulated: false,
    };
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async verifyPayment(reference: string) {
    if (!this.publicKey) {
      return { status: 'complete', simulated: true };
    }

    const response = await fetch(`${this.apiUrl}/payments/${reference}`, {
      headers: {
        'Authorization': this.publicKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(`NotchPay verify error: ${JSON.stringify(data)}`);
      throw new Error(data.message || 'Erreur de vérification du paiement');
    }

    return {
      status: data.transaction?.status || 'pending',
      amount: data.transaction?.amount,
      currency: data.transaction?.currency,
      reference: data.transaction?.reference,
      simulated: false,
    };
  }
}
