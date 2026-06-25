/**
 * Annuler la commande #88c62654 et remettre les commissions à 0
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { id: { startsWith: '88c62654' } },
    include: { escrow: true, items: true, payment: true, delivery: true },
  });

  if (!order) { console.log('Commande introuvable'); return; }
  console.log('Commande:', order.id, '- Statut:', order.status, '- Total:', order.totalPrice);

  // 1. Annuler la commande
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
  });
  console.log('  Statut -> CANCELLED');

  // 2. Escrow: commission = 0, sellerAmount = 0, status = REFUNDED
  if (order.escrow) {
    await prisma.escrow.update({
      where: { orderId: order.id },
      data: { status: 'REFUNDED', commission: 0, sellerAmount: 0 },
    });
    console.log('  Escrow -> REFUNDED, commission=0, sellerAmount=0');
  }

  // 3. Paiement: marquer REFUNDED si deja paye
  if (order.payment && order.payment.status === 'SUCCESS') {
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { status: 'REFUNDED' },
    });
    console.log('  Payment -> REFUNDED');
  }

  // 4. Restituer le stock
  for (const item of order.items) {
    await prisma.stock.update({
      where: { productId: item.productId },
      data: { quantity: { increment: item.quantity } },
    }).catch(() => {});
  }
  console.log('  Stock restitue');

  // 5. Annuler la delivery request
  await prisma.deliveryRequest.updateMany({
    where: { orderId: order.id },
    data: { status: 'CANCELLED', paymentStatus: null },
  });

  // 6. Supprimer la delivery si elle existe
  if (order.delivery) {
    await prisma.deliveryTracking.deleteMany({ where: { deliveryId: order.delivery.id } });
    await prisma.delivery.delete({ where: { id: order.delivery.id } }).catch(() => {});
    console.log('  Delivery supprimee');
  }

  console.log('\n✅ Commande annulee. Commission = 0 FCFA. Stock restitue.');
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
