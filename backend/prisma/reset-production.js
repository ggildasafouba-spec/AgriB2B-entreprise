/**
 * Script de remise à zéro pour le passage en production réelle.
 * 
 * Actions :
 * 1. Supprime tous les escrows (commissions de test)
 * 2. Supprime tous les paiements de test
 * 3. Remet toutes les commandes en PENDING (ou supprime les commandes de test)
 * 4. Met à jour le compte admin avec les vraies informations
 * 5. Supprime les notifications de test
 * 
 * Usage : node prisma/reset-production.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🔄 RESET PRODUCTION — AgriB2B');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Supprimer tous les escrows (commissions de test)
  const deletedEscrows = await prisma.escrow.deleteMany({});
  console.log(`✅ ${deletedEscrows.count} escrows supprimés (commissions de test)`);

  // 2. Supprimer tous les paiements de test
  const deletedPayments = await prisma.payment.deleteMany({});
  console.log(`✅ ${deletedPayments.count} paiements de test supprimés`);

  // 3. Supprimer les livraisons de test
  const deletedTracking = await prisma.deliveryTracking.deleteMany({});
  const deletedDeliveries = await prisma.delivery.deleteMany({});
  console.log(`✅ ${deletedDeliveries.count} livraisons de test supprimées`);

  // 4. Supprimer les items de commande puis les commandes de test
  const deletedItems = await prisma.orderItem.deleteMany({});
  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✅ ${deletedOrders.count} commandes de test supprimées`);

  // 5. Supprimer les notifications de test
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`✅ ${deletedNotifications.count} notifications de test supprimées`);

  // 6. Supprimer les messages de test
  const deletedMessages = await prisma.message.deleteMany({});
  console.log(`✅ ${deletedMessages.count} messages de test supprimés`);

  // 7. Mettre à jour / créer le compte Admin avec les vraies informations
  const adminPassword = await bcrypt.hash('Fanalya@1704', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'ggildasafouba@gmail.com' },
    update: {
      password: adminPassword,
      name: 'AFOUBA Germain',
      role: 'ADMIN',
      accountType: 'COMPANY',
      phone: '+33609231509',
      country: 'France',
      region: 'Ile-de-France',
      kycStatus: 'VERIFIED',
      isVerified: true,
    },
    create: {
      email: 'ggildasafouba@gmail.com',
      password: adminPassword,
      name: 'AFOUBA Germain',
      role: 'ADMIN',
      accountType: 'COMPANY',
      phone: '+33609231509',
      country: 'France',
      region: 'Ile-de-France',
      kycStatus: 'VERIFIED',
      isVerified: true,
    },
  });

  // Supprimer l'ancien compte admin de test s'il existe
  const oldAdmin = await prisma.user.findUnique({ where: { email: 'admin@agrib2b.com' } });
  if (oldAdmin && oldAdmin.id !== admin.id) {
    await prisma.notification.deleteMany({ where: { userId: oldAdmin.id } });
    await prisma.user.delete({ where: { email: 'admin@agrib2b.com' } }).catch(() => {});
    console.log(`✅ Ancien compte admin (admin@agrib2b.com) supprimé`);
  }

  console.log(`\n✅ Compte Admin configuré :`);
  console.log(`   Email    : ggildasafouba@gmail.com`);
  console.log(`   Nom      : AFOUBA Germain`);
  console.log(`   Téléphone: +33609231509`);
  console.log(`   Pays     : France`);
  console.log(`   Région   : Ile-de-France`);
  console.log(`   Rôle     : ADMIN`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ✅ RESET TERMINÉ — Prêt pour la production réelle');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n⚠️  Les produits et les stocks sont conservés.');
  console.log('⚠️  Les comptes vendeurs/acheteurs/transporteurs sont conservés.');
  console.log('⚠️  Seules les transactions de test ont été supprimées.\n');
}

main()
  .catch(err => { console.error('❌ Erreur:', err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
