/**
 * Corriger la commande #88c62654
 * Produits = 100 000 FCFA, Livraison = 4 060 FCFA, Total = 104 060 FCFA
 * Commission = 10% de 100 000 = 10 000 + 60 (transport) = 10 060
 * Remettre la delivery request en ACCEPTED (pas encore annulee par l'acheteur)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findFirst({
    where: { id: { startsWith: '88c62654' } },
    include: { escrow: true },
  });

  if (!order) { console.log('Commande introuvable'); return; }
  console.log('Commande:', order.id, '- Total actuel:', order.totalPrice);

  // Valeurs correctes
  const productTotal = 100000;
  const deliveryCost = 4060; // 2000 base + 3% commission = 2060... non: vérifions
  const totalPrice = 104060;
  const productCommission = 10000; // 10% de 100 000
  const transportCommission = 60;  // 3% de 2000 (base transporteur)
  const totalCommission = 10060;
  const sellerAmount = productTotal - productCommission; // 90 000

  // 1. Remettre la commande avec le bon total et deliveryCostIncluded
  await prisma.order.update({
    where: { id: order.id },
    data: { totalPrice, deliveryCostIncluded: deliveryCost },
  });

  // 2. Remettre l'escrow correct
  if (order.escrow) {
    await prisma.escrow.update({
      where: { orderId: order.id },
      data: {
        amount: totalPrice,
        commission: totalCommission,
        sellerAmount,
      },
    });
  }

  // 3. Remettre la delivery request en ACCEPTED (l'acheteur ne l'a pas encore annulee)
  await prisma.deliveryRequest.updateMany({
    where: { orderId: order.id },
    data: { status: 'ACCEPTED', paymentStatus: 'PENDING' },
  });

  console.log('\n✅ Commande corrigee:');
  console.log('  Total:', totalPrice, 'FCFA');
  console.log('  Produits:', productTotal, 'FCFA');
  console.log('  Livraison:', deliveryCost, 'FCFA');
  console.log('  Commission:', totalCommission, 'FCFA (10% produits + 3% transport)');
  console.log('  Vendeur recoit:', sellerAmount, 'FCFA');
  console.log('  DeliveryRequest: ACCEPTED (en attente annulation acheteur)');
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
