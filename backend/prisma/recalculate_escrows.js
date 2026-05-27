const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Chargement des escrows...');
  const escrows = await prisma.escrow.findMany({
    include: { order: { include: { seller: { select: { accountType: true } } } } },
  });

  let updated = 0;
  for (const e of escrows) {
    const amount = e.amount;
    const accountType = e.order?.seller?.accountType;
    const rate = accountType === 'COMPANY' ? 0.05 : 0.10;
    const commission = Math.round(amount * rate * 100) / 100;
    const sellerAmount = Math.round((amount - commission) * 100) / 100;

    if (e.commission !== commission || e.sellerAmount !== sellerAmount) {
      await prisma.escrow.update({
        where: { id: e.id },
        data: { commission, sellerAmount },
      });
      updated++;
      console.log(`Updated escrow ${e.id}: commission=${commission}, sellerAmount=${sellerAmount}`);
    }
  }

  console.log(`Terminé. Traité ${escrows.length} escrows, mis à jour ${updated}.`);
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
