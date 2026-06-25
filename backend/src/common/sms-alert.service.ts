import { Injectable, Logger } from '@nestjs/common';

/**
 * Service global d'alertes SMS pour les événements critiques.
 *
 * Utilise la même logique de provider que SmsService (africastalking/twilio/console).
 * En développement (SMS_PROVIDER non défini) : affiche dans la console.
 */
@Injectable()
export class SmsAlertService {
  private readonly logger = new Logger(SmsAlertService.name);
  private readonly provider = process.env.SMS_PROVIDER || 'console';

  /**
   * Envoie une alerte SMS à un numéro de téléphone.
   */
  async sendAlert(phone: string, message: string): Promise<void> {
    if (!phone) {
      this.logger.warn('SMS alert skipped — no phone number provided');
      return;
    }

    switch (this.provider) {
      case 'africastalking':
        await this.sendViaAfricasTalking(phone, message);
        break;
      case 'twilio':
        await this.sendViaTwilio(phone, message);
        break;
      default:
        this.sendViaConsole(phone, message);
    }
  }

  // ── Mode développement ─────────────────────────────────────────────────────
  private sendViaConsole(phone: string, message: string) {
    this.logger.log(`\n📱 ===== ALERTE SMS =====`);
    this.logger.log(`   Destinataire : ${phone}`);
    this.logger.log(`   Message      : ${message}`);
    this.logger.log(`========================\n`);
  }

  // ── Africa's Talking ───────────────────────────────────────────────────────
  private async sendViaAfricasTalking(phone: string, message: string): Promise<void> {
    const apiKey = process.env.AFRICASTALKING_API_KEY;
    const username = process.env.AFRICASTALKING_USERNAME;
    const senderId = process.env.AFRICASTALKING_SENDER_ID || 'AgriB2B';

    if (!apiKey || !username) {
      this.logger.warn('Africa\'s Talking non configuré — alerte SMS non envoyée');
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
        this.logger.log(`Alerte SMS envoyée à ${phone}`);
      } else {
        this.logger.warn(`Alerte SMS échouée pour ${phone}: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(`Erreur envoi alerte SMS Africa's Talking: ${error.message}`);
    }
  }

  // ── Twilio ─────────────────────────────────────────────────────────────────
  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      this.logger.warn('Twilio non configuré — alerte SMS non envoyée');
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
        this.logger.log(`Alerte SMS envoyée à ${phone} via Twilio (SID: ${result.sid})`);
      } else {
        this.logger.warn(`Alerte SMS Twilio échouée: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      this.logger.error(`Erreur envoi alerte SMS Twilio: ${error.message}`);
    }
  }
}
