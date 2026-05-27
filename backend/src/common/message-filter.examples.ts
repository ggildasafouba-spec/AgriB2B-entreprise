/**
 * Test: Message Filter Examples
 * Exemples de messages bloqués et autorisés
 */

import { MessageFilterUtil } from './message-filter.util';

export class MessageFilterExamples {
  static runTests() {
    console.log('\n📋 ===== MESSAGE FILTER TEST RESULTS =====\n');

    const testCases = [
      // ❌ BLOCKED - Phone Numbers
      { message: 'Appelle-moi au +33612345678', shouldBlock: true },
      { message: 'Mon tel: 06 12 34 56 78', shouldBlock: true },
      { message: 'Voici mon numéro: 0033612345678', shouldBlock: true },
      
      // ❌ BLOCKED - Email
      { message: 'Contacte-moi: john@gmail.com', shouldBlock: true },
      { message: 'Mon email professionnel: company@business.fr', shouldBlock: true },
      
      // ❌ BLOCKED - Messaging Apps
      { message: 'Message moi sur WhatsApp', shouldBlock: true },
      { message: 'Trouvez moi sur telegram @username', shouldBlock: true },
      { message: 'Connectez-moi sur fb.me/john', shouldBlock: true },
      { message: 'Skype: john_doe', shouldBlock: true },
      { message: 'WeChat: john123', shouldBlock: true },
      { message: 'Signal @john', shouldBlock: true },
      
      // ❌ BLOCKED - URLs
      { message: 'Visitez mon site: https://exemple.com', shouldBlock: true },
      { message: 'Allez sur www.google.com', shouldBlock: true },
      { message: 'Plus d\'infos: http://example.fr/products', shouldBlock: true },
      
      // ✅ ALLOWED - Normal Messages
      { message: 'Bonjour, je suis intéressé par ce produit', shouldBlock: false },
      { message: 'Quel est le prix de cet article?', shouldBlock: false },
      { message: 'Quand pouvez-vous livrer?', shouldBlock: false },
      { message: 'J\'accepte votre offre, procédons', shouldBlock: false },
      { message: 'Peux-tu m\'envoyer plus de photos?', shouldBlock: false },
      { message: 'Quel est le délai de livraison estimé?', shouldBlock: false },
      { message: 'Je veux passer commande pour 5 unités', shouldBlock: false },
      { message: 'Merci pour la livraison rapide!', shouldBlock: false },
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach(({ message, shouldBlock }, index) => {
      const result = MessageFilterUtil.isContactInfoBlocked(message);
      const correct = result.blocked === shouldBlock;

      const status = correct ? '✅ PASS' : '❌ FAIL';
      const action = shouldBlock ? '🔒 BLOCKED' : '✅ ALLOWED';
      
      console.log(`${status} Test ${index + 1}: ${action}`);
      console.log(`   Message: "${message}"`);
      if (result.blocked) {
        console.log(`   Raison: ${result.reason}`);
      }
      console.log();

      if (correct) passed++;
      else failed++;
    });

    console.log(`\n📊 RÉSULTATS: ${passed} réussi(s), ${failed} échoué(s) / ${testCases.length} total\n`);
    return { passed, failed, total: testCases.length };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  MessageFilterExamples.runTests();
}
