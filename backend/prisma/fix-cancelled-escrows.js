/**
 * Script : remettre à 0 les commissions des commandes annulées
 * et supprimer les commandes annulées de la base
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Trouver toutes les commandes annulées
  const cancelledOrders = await prisma.order.findMany({
    where: { status: 'CANCELLED' },
    include: { escrow: true, delivery: true, items: true, payment: true },
  });

  console.log(`Commandes annulees trouvees: ${cancelledOrders.length}`);

  for (const order of cancelledOrders) {
    console.log(`\nSuppression commande ${order.id.slice(0, 8)} (${order.totalPrice} FCFA)...`);

    // Supprimer delivery tracking + delivery
    if (order.delivery) {
      await prisma.deliveryTracking.deleteMany({ where: { deliveryId: order.delivery.id } });
      await prisma.delivery.delete({ where: { id: order.delivery.id } }).catch(() => {});
    }

    // Supprimer delivery request
    await prisma.deliveryRequest.deleteMany({ where: { orderId: order.id } });

    // Supprimer escrow
    await prisma.escrow.deleteMany({ where: { orderId: order.id } });

    // Supprimer payment
    await prisma.payment.deleteMany({ where: { orderId: order.id } });

    // Supprimer messages
    await prisma.message.deleteMany({ where: { orderId: order.id } });

    // Supprimer order items
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });

    // Supprimer la commande
    await prisma.order.delete({ where: { id: order.id } });

    console.log(`  ✅ Supprimee`);
  }

  // 2. Verifier la commande confirmee restante
  const remaining = await prisma.order.findMany({
    include: { escrow: true },
  });

  console.log(`\n═══ Commandes restantes: ${remaining.length} ═══`);
  for (const o of remaining) {
    console.log(`  ${o.id.slice(0, 8)} - ${o.status} - ${o.totalPrice} FCFA - commission: ${o.escrow?.commission || 0}`);
  }

  const totalCommission = remaining.reduce((sum, o) => sum + (o.escrow?.commission || 0), 0);
  console.log(`\nTotal commissions: ${totalCommission} FCFA`);
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
