/**
 * Script one-shot : corriger la commande #88c62654
 * - Enlever les frais de livraison du total
 * - Recalculer la commission sur les produits seuls (10% entreprise)
 * - Annuler la delivery request
 * - Supprimer la delivery si elle existe
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Trouver la commande
  const order = await prisma.order.findFirst({
    where: { id: { startsWith: '88c62654' } },
    include: { seller: true, delivery: true, escrow: true },
  });

  if (!order) {
    console.log('Commande introuvable');
    return;
  }

  console.log('Commande trouvee:', order.id);
  console.log('  Total actuel:', order.totalPrice);
  console.log('  Livraison incluse:', order.deliveryCostIncluded);
  console.log('  Escrow commission:', order.escrow?.commission);
  console.log('  Delivery:', order.delivery?.id || 'aucune');

  // Calculer le montant produits
  const deliveryCost = order.deliveryCostIncluded || 0;
  const productTotal = Math.round((order.totalPrice - deliveryCost) * 100) / 100;
  const rate = order.seller?.accountType === 'COMPANY' ? 0.10 : 0.05;
  const commission = Math.round(productTotal * rate * 100) / 100;
  const sellerAmount = Math.round((productTotal - commission) * 100) / 100;

  console.log('\nCorrection:');
  console.log('  Produits:', productTotal, 'FCFA');
  console.log('  Commission (' + (rate * 100) + '%):', commission, 'FCFA');
  console.log('  Vendeur recoit:', sellerAmount, 'FCFA');

  // 1. Mettre a jour la commande
  await prisma.order.update({
    where: { id: order.id },
    data: { totalPrice: productTotal, deliveryCostIncluded: 0 },
  });

  // 2. Mettre a jour l'escrow
  if (order.escrow) {
    await prisma.escrow.update({
      where: { orderId: order.id },
      data: { amount: productTotal, commission, sellerAmount },
    });
  }

  // 3. Supprimer la delivery si elle existe
  if (order.delivery) {
    await prisma.deliveryTracking.deleteMany({ where: { deliveryId: order.delivery.id } });
    await prisma.delivery.delete({ where: { id: order.delivery.id } });
    console.log('  Delivery supprimee');
  }

  // 4. Annuler la delivery request
  await prisma.deliveryRequest.updateMany({
    where: { orderId: order.id },
    data: { status: 'CANCELLED', paymentStatus: null },
  });
  console.log('  DeliveryRequest annulee');

  console.log('\n✅ Commande corrigee : total=' + productTotal + ', commission=' + commission + ', sellerAmount=' + sellerAmount);
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
