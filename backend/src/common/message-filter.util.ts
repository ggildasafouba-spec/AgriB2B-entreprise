/**
 * Message Filter Utility
 * Bloque l'échange de coordonnées personnelles entre utilisateurs.
 * Protège le modèle économique de la plateforme AgriB2B.
 */

export class MessageFilterUtil {
  // ── Numéros de téléphone ───────────────────────────────────────────────────
  private static readonly PHONE_PATTERNS = [
    /(\+?[\d\s\-().]{8,20})/g,                      // Format général (8+ chiffres)
    /\b0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, // 0X XX XX XX XX
    /\b\+?237[\s.-]?\d[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, // Cameroun
    /\b\+?225[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, // Côte d'Ivoire
    /\b\+?221[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g, // Sénégal
    /\b6[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,      // 6XX XX XX XX (mobile Afrique)
    /\b\d{3}[\s.-]\d{3}[\s.-]\d{3,4}\b/g,           // XXX-XXX-XXXX
  ];

  // ── Emails ─────────────────────────────────────────────────────────────────
  private static readonly EMAIL_PATTERNS = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/g,
    /[a-zA-Z0-9._%+-]+\s*\[\s*at\s*\]\s*[a-zA-Z0-9.-]+/gi,
    /[a-zA-Z0-9._%+-]+\s*arobase\s*[a-zA-Z0-9.-]+/gi,
    /[a-zA-Z0-9._%+-]+\s*chez\s*[a-zA-Z0-9.-]+\s*point\s*[a-zA-Z]+/gi,
  ];

  // ── Réseaux sociaux et messageries ─────────────────────────────────────────
  private static readonly SOCIAL_PATTERNS = [
    /\b(whatsapp|whats\s*app|watsap|whatssap|wa\.me|chat\.whatsapp)\b/gi,
    /\b(telegram|telgram|telegr|t\.me)\b/gi,
    /\b(facebook|fb\.me|fb|face\s*book|messenger)\b/gi,
    /\b(instagram|insta|ig)\b/gi,
    /\b(twitter|x\.com)\b/gi,
    /\b(tiktok|tik\s*tok)\b/gi,
    /\b(snapchat|snap)\b/gi,
    /\b(viber|signal|signal\.me|imo)\b/gi,
    /\b(linkedin|linked\s*in)\b/gi,
    /\b(skype|zoom|teams|discord)\b/gi,
    /\b(wechat|weixin)\b/gi,
  ];

  // ── URLs et liens ──────────────────────────────────────────────────────────
  private static readonly URL_PATTERNS = [
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /\b[a-zA-Z0-9-]+\.(com|fr|cm|net|org|io|app|co|me|link)\b/gi,
  ];

  // ── Tentatives d'obfuscation ───────────────────────────────────────────────
  private static readonly OBFUSCATION_PATTERNS = [
    // Chiffres écrits en lettres (français)
    /\b(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\s+(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\s+(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)\s+(zero|un|deux|trois|quatre|cinq|six|sept|huit|neuf)/gi,
    // Invitation à contacter hors plateforme
    /\b(appel|appelle|appelez|contacte|contactez|joindre|joignez|ecri|ecris|ecrivez)\s*(moi|nous|le)?\s*(au|sur|via|par|en)?\s*(prive|pv|dm|mp|message\s*prive)?\b/gi,
    // Mention explicite de coordonnées
    /\b(mon|notre|le|voici|voila)\s*(num|numero|tel|telephone|phone|contact|mail|email|adresse|compte|profil|id)\b/gi,
    // "Hors plateforme" / "en dehors"
    /\b(hors|dehors|en\s*dehors|ailleurs|autre\s*part)\s*(de)?\s*(la)?\s*(plateforme|appli|application|site)?\b/gi,
    // Chiffres séparés par des espaces/points excessifs
    /\d[\s.,-]{1,3}\d[\s.,-]{1,3}\d[\s.,-]{1,3}\d[\s.,-]{1,3}\d[\s.,-]{1,3}\d[\s.,-]{1,3}\d[\s.,-]{1,3}\d/g,
  ];

  /**
   * Vérifie si un message contient des informations de contact interdites.
   */
  static isContactInfoBlocked(content: string): { blocked: boolean; reason?: string } {
    if (!content || content.trim().length === 0) {
      return { blocked: false };
    }

    const text = content.trim();
    const lowerText = text.toLowerCase();

    // Vérifier les numéros de téléphone
    for (const pattern of this.PHONE_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match && this.isLikelyPhone(match[0])) {
        return {
          blocked: true,
          reason: 'Les numéros de téléphone ne sont pas autorisés dans les messages. Toutes les communications doivent passer par la messagerie AgriB2B.',
        };
      }
    }

    // Vérifier les emails
    for (const pattern of this.EMAIL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return {
          blocked: true,
          reason: 'Les adresses email ne sont pas autorisées. Utilisez la messagerie AgriB2B pour communiquer.',
        };
      }
    }

    // Vérifier les réseaux sociaux
    for (const pattern of this.SOCIAL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(lowerText)) {
        return {
          blocked: true,
          reason: 'Les références aux réseaux sociaux et messageries externes (WhatsApp, Telegram, etc.) ne sont pas autorisées. Utilisez AgriB2B.',
        };
      }
    }

    // Vérifier les URLs
    for (const pattern of this.URL_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return {
          blocked: true,
          reason: 'Les liens externes ne sont pas autorisés dans les messages.',
        };
      }
    }

    // Vérifier les tentatives d'obfuscation
    for (const pattern of this.OBFUSCATION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(lowerText)) {
        return {
          blocked: true,
          reason: 'Le partage de coordonnées personnelles n\'est pas autorisé. Toutes les communications passent par AgriB2B pour votre sécurité.',
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Vérifie qu'une séquence ressemble vraiment à un numéro de téléphone
   * (au moins 8 chiffres, pas juste un prix ou une quantité)
   */
  private static isLikelyPhone(match: string): boolean {
    const digitsOnly = match.replace(/\D/g, '');
    // Un numéro de téléphone a au moins 8 chiffres
    // On exclut les nombres qui ressemblent à des prix (ex: 1500, 25000)
    if (digitsOnly.length < 8) return false;
    if (digitsOnly.length > 15) return false;
    return true;
  }
}
