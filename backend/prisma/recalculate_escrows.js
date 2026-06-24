const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Recalcul des escrows (commission sur produits uniquement, hors livraison)...');
  const escrows = await prisma.escrow.findMany({
    include: {
      order: {
        include: { seller: { select: { accountType: true } } },
      },
    },
  });

  let updated = 0;
  for (const e of escrows) {
    const totalPrice = e.order?.totalPrice || e.amount;
    const deliveryCost = e.order?.deliveryCostIncluded || 0;
    const productAmount = totalPrice - deliveryCost;
    const accountType = e.order?.seller?.accountType;
    const rate = accountType === 'COMPANY' ? 0.10 : 0.05;
    const commission = Math.round(productAmount * rate * 100) / 100;
    const sellerAmount = Math.round((productAmount - commission) * 100) / 100;

    if (e.commission !== commission || e.sellerAmount !== sellerAmount || e.amount !== totalPrice) {
      await prisma.escrow.update({
        where: { id: e.id },
        data: { amount: totalPrice, commission, sellerAmount },
      });
      updated++;
      console.log(`Updated escrow ${e.id}: total=${totalPrice}, deliveryCost=${deliveryCost}, produits=${productAmount}, commission=${commission} (${rate*100}%), sellerAmount=${sellerAmount}`);
    }
  }

  console.log(`\nTerminé. Traité ${escrows.length} escrows, mis à jour ${updated}.`);
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
