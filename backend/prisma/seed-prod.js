const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AgriB2B database...');

  const adminPassword = await bcrypt.hash('Fanalya@1704', 10);
  await prisma.user.upsert({
    where: { email: 'ggildasafouba@gmail.com' },
    update: { isVerified: true, kycStatus: 'VERIFIED', role: 'ADMIN' },
    create: {
      email: 'ggildasafouba@gmail.com', password: adminPassword, name: 'AFOUBA Germain',
      role: 'ADMIN', accountType: 'COMPANY', phone: '+33609231509',
      country: 'France', region: 'Ile-de-France', kycStatus: 'VERIFIED', isVerified: true,
    },
  });

  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'vendeur@agrib2b.com' },
    update: { isVerified: true, kycStatus: 'VERIFIED' },
    create: {
      email: 'vendeur@agrib2b.com', password: sellerPassword, name: 'Jean Producteur',
      role: 'SELLER', accountType: 'INDIVIDUAL', phone: '+237699000001',
      country: 'Cameroun', region: 'Ouest', minOrderQty: 10, kycStatus: 'VERIFIED', isVerified: true,
    },
  });

  const buyerPassword = await bcrypt.hash('buyer123', 10);
  await prisma.user.upsert({
    where: { email: 'acheteur@agrib2b.com' },
    update: { isVerified: true },
    create: {
      email: 'acheteur@agrib2b.com', password: buyerPassword, name: 'Marie Acheteuse',
      role: 'BUYER', accountType: 'INDIVIDUAL', phone: '+237677000002',
      country: 'Cameroun', region: 'Littoral', kycStatus: 'VERIFIED', isVerified: true,
    },
  });

  const transporterPassword = await bcrypt.hash('transport123', 10);
  const transporter = await prisma.user.upsert({
    where: { email: 'transport@agrib2b.com' },
    update: { isVerified: true, kycStatus: 'VERIFIED' },
    create: {
      email: 'transport@agrib2b.com', password: transporterPassword, name: 'Paul Transporteur',
      role: 'TRANSPORTER', accountType: 'INDIVIDUAL', phone: '+237655000003',
      country: 'Cameroun', region: 'Littoral', kycStatus: 'VERIFIED', isVerified: true,
    },
  });

  // Transport rates
  const rates = [
    { origin: 'Douala', destination: 'Yaounde', productCategory: 'Legumes', pricePerKg: 50, vehicleType: 'Camion 10T', estimatedDays: 1 },
    { origin: 'Douala', destination: 'Bafoussam', productCategory: 'Legumes', pricePerKg: 75, vehicleType: 'Camion 10T', estimatedDays: 2 },
    { origin: 'Douala', destination: 'Garoua', productCategory: 'Cereales', pricePerKg: 120, vehicleType: 'Camion 20T', estimatedDays: 3 },
  ];
  for (const rate of rates) {
    const existing = await prisma.transportRate.findFirst({
      where: { transporterId: transporter.id, origin: rate.origin, destination: rate.destination },
    });
    if (!existing) await prisma.transportRate.create({ data: { ...rate, transporterId: transporter.id } });
  }

  // Products
  const products = [
    { name: 'Tomates Bio', description: 'Tomates biologiques fraiches', price: 1500, category: 'Legumes', unit: 'kg', minOrderQty: 10 },
    { name: 'Mais Sucre', description: 'Mais sucre recolte frais', price: 800, category: 'Cereales', unit: 'kg', minOrderQty: 50 },
  ];
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, sellerId: seller.id } });
    if (!existing) {
      await prisma.product.create({
        data: { ...p, images: [], transport: ['ROUTE'], sellerId: seller.id, stock: { create: { quantity: 500 } } },
      });
    }
  }

  console.log('Seed completed!');
  console.log('ADMIN: ggildasafouba@gmail.com / Fanalya@1704');
  console.log('SELLER: vendeur@agrib2b.com / seller123');
  console.log('BUYER: acheteur@agrib2b.com / buyer123');
  console.log('TRANSPORTER: transport@agrib2b.com / transport123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
