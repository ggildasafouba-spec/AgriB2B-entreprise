import { Injectable, Logger } from '@nestjs/common';

/**
 * Service d'envoi de SMS pour les codes OTP.
 * 
 * En développement : affiche le code dans la console.
 * En production : envoie un vrai SMS via Africa's Talking (ou Twilio).
 * 
 * Configuration requise en production :
 * - SMS_PROVIDER=africastalking (ou twilio)
 * - AFRICASTALKING_API_KEY, AFRICASTALKING_USERNAME
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider = process.env.SMS_PROVIDER || 'console';

  async sendOtp(phone: string, code: string, name: string): Promise<void> {
    const message = `AgriB2B: Votre code de vérification est ${code}. Il expire dans 15 minutes.`;

    switch (this.provider) {
      case 'africastalking':
        await this.sendViaAfricasTalking(phone, message);
        break;
      case 'twilio':
        await this.sendViaTwilio(phone, message);
        break;
      default:
        this.sendViaConsole(phone, code, name);
    }
  }

  // ── Mode développement ─────────────────────────────────────────────────────
  private sendViaConsole(phone: string, code: string, name: string) {
    this.logger.log(`\n📧 ===== CODE DE VÉRIFICATION =====`);
    this.logger.log(`   Destinataire : ${name} <${phone}>`);
    this.logger.log(`   Code OTP     : ${code}`);
    this.logger.log(`   Expire dans  : 15 minutes`);
    this.logger.log(`===================================\n`);
  }

  // ── Africa's Talking ───────────────────────────────────────────────────────
  private async sendViaAfricasTalking(phone: string, message: string): Promise<void> {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const senderId = process.env.AFRICASTALKING_SENDER_ID || 'AgriB2B';

    if (!apiKey || !username) {
      this.logger.warn('Africa\'s Talking non configuré — SMS non envoyé');
      return;
    }

    try {
      const url = username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

      const body = new URLSearchParams({
        username,
        to: phone,
        message,
        from: senderId,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apiKey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      const result = await response.json();
      
      if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
        this.logger.log(`SMS envoyé à ${phone}`);
      } else {
        this.logger.warn(`SMS échoué pour ${phone}: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(`Erreur envoi SMS Africa's Talking: ${error.message}`);
    }
  }

  // ── Twilio ─────────────────────────────────────────────────────────────────
  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn('Twilio non configuré — SMS non envoyé');
      return;
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: phone,
        From: fromNumber,
        Body: message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const result = await response.json();

      if (result.sid) {
        this.logger.log(`SMS envoyé à ${phone} via Twilio (SID: ${result.sid})`);
      } else {
        this.logger.warn(`SMS Twilio échoué: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(`Erreur envoi SMS Twilio: ${error.message}`);
    }
  }
}
