/**
 * Remettre la commande #c0cb6dd0 en état "à payer"
 * - Payment → PENDING
 * - Order → CONFIRMED (pour que le bouton payer apparaisse)
 * - Escrow → HELD (fonds bloqués, pas encore libérés)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { id: { startsWith: 'c0cb6dd0' } },
    include: { payment: true, escrow: true },
  });

  if (!order) { console.log('Commande introuvable'); return; }
  console.log('Commande:', order.id, '- Statut:', order.status, '- Payment:', order.payment?.status);

  // 1. Remettre le paiement en PENDING
  if (order.payment) {
    await prisma.payment.update({
      where: { orderId: order.id },
      data: { status: 'PENDING' },
    });
    console.log('  Payment -> PENDING');
  }

  // 2. Remettre la commande en CONFIRMED (acheteur peut payer)
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED' },
  });
  console.log('  Order -> CONFIRMED');

  // 3. Remettre l'escrow en HELD
  if (order.escrow) {
    await prisma.escrow.update({
      where: { orderId: order.id },
      data: { status: 'HELD' },
    });
    console.log('  Escrow -> HELD');
  }

  console.log('\n✅ Commande remise en attente de paiement.');
  console.log('   L\'acheteur verra le bouton "Payer la commande" sur sa page Commandes.');
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
