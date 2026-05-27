/**
 * Test: Commission Service Examples
 * Exemples de calcul de commission par type de compte
 */

import { CommissionService } from './commission.service';

export class CommissionServiceExamples {
  static runTests() {
    const service = new CommissionService();
    
    console.log('\n💰 ===== COMMISSION CALCULATION TEST RESULTS =====\n');

    const testCases = [
      {
        name: 'INDIVIDUAL (Particulier)',
        amount: 10000,
        accountType: 'INDIVIDUAL' as const,
        role: 'SELLER',
        expectedRate: 0.05,
      },
      {
        name: 'COMPANY (Entreprise)',
        amount: 10000,
        accountType: 'COMPANY' as const,
        role: 'SELLER',
        expectedRate: 0.10,
      },
      {
        name: 'TRANSPORTER',
        amount: 10000,
        accountType: 'INDIVIDUAL' as const,
        role: 'TRANSPORTER',
        expectedRate: 0.03,
      },
      {
        name: 'Montant plus élevé - COMPANY',
        amount: 50000,
        accountType: 'COMPANY' as const,
        role: 'SELLER',
        expectedRate: 0.10,
      },
      {
        name: 'Montant faible - INDIVIDUAL',
        amount: 1000,
        accountType: 'INDIVIDUAL' as const,
        role: 'SELLER',
        expectedRate: 0.05,
      },
    ];

    testCases.forEach((testCase, index) => {
      console.log(`📦 Test ${index + 1}: ${testCase.name}`);
      console.log(`   Montant Total: ${testCase.amount.toLocaleString('fr-FR')} FCFA`);

      const details = service.getCommissionDetails(
        testCase.amount,
        testCase.accountType,
        testCase.role,
      );

      console.log(`   Taux Commission: ${details.rate}`);
      console.log(`   Montant Commission (Plateforme): ${details.commission.toLocaleString('fr-FR')} FCFA`);
      console.log(`   Montant Vendeur (Après Commission): ${details.sellerAmount.toLocaleString('fr-FR')} FCFA`);

      // Validation
      const commissionCorrect = details.commission === testCase.amount * testCase.expectedRate;
      const sellerCorrect = details.sellerAmount === testCase.amount * (1 - testCase.expectedRate);
      const rateCorrect = details.rateDecimal === testCase.expectedRate;

      if (commissionCorrect && sellerCorrect && rateCorrect) {
        console.log(`   ✅ PASS\n`);
      } else {
        console.log(`   ❌ FAIL - Valeurs incorrectes\n`);
      }
    });

    // Summary
    console.log('\n📊 RÉSUMÉ DES TAUX');
    console.log(`   • Particuliers (INDIVIDUAL): ${(service.getCommissionRate('INDIVIDUAL') * 100).toFixed(1)}%`);
    console.log(`   • Entreprises (COMPANY): ${(service.getCommissionRate('COMPANY') * 100).toFixed(1)}%`);
    console.log(`   • Transporteurs (TRANSPORTER): ${(service.getCommissionRate('INDIVIDUAL', 'TRANSPORTER') * 100).toFixed(1)}%\n`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  CommissionServiceExamples.runTests();
}
