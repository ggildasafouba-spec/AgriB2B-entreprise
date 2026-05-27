import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AgriB2B database...');

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agrib2b.com' },
    update: {
      isVerified: true,
      kycStatus: 'VERIFIED',
      role: 'ADMIN',
    },
    create: {
      email: 'admin@agrib2b.com',
      password: adminPassword,
      name: 'Admin AgriB2B',
      role: 'ADMIN',
      accountType: 'COMPANY',
      phone: '+237600000000',
      country: 'Cameroun',
      region: 'Centre',
      kycStatus: 'VERIFIED',
      isVerified: true,
    },
  });

  // ── Vendeur ────────────────────────────────────────────────────────────────
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'vendeur@agrib2b.com' },
    update: {
      isVerified: true,
      kycStatus: 'VERIFIED',
    },
    create: {
      email: 'vendeur@agrib2b.com',
      password: sellerPassword,
      name: 'Jean Producteur',
      role: 'SELLER',
      accountType: 'INDIVIDUAL',
      phone: '+237699000001',
      country: 'Cameroun',
      region: 'Ouest',
      minOrderQty: 10,
      kycStatus: 'VERIFIED',
      isVerified: true,
    },
  });

  // ── Acheteur démo ──────────────────────────────────────────────────────────
  const buyerPassword = await bcrypt.hash('buyer123', 10);
  await prisma.user.upsert({
    where: { email: 'acheteur@agrib2b.com' },
    update: { isVerified: true },
    create: {
      email: 'acheteur@agrib2b.com',
      password: buyerPassword,
      name: 'Marie Acheteuse',
      role: 'BUYER',
      accountType: 'INDIVIDUAL',
      phone: '+237677000002',
      country: 'Cameroun',
      region: 'Littoral',
      kycStatus: 'VERIFIED',
      isVerified: true,
    },
  });

  // ── Transporteur démo ──────────────────────────────────────────────────────
  const transporterPassword = await bcrypt.hash('transport123', 10);
  const transporter = await prisma.user.upsert({
    where: { email: 'transport@agrib2b.com' },
    update: { isVerified: true, kycStatus: 'VERIFIED' },
    create: {
      email: 'transport@agrib2b.com',
      password: transporterPassword,
      name: 'Paul Transporteur',
      role: 'TRANSPORTER',
      accountType: 'INDIVIDUAL',
      phone: '+237655000003',
      country: 'Cameroun',
      region: 'Littoral',
      kycStatus: 'VERIFIED',
      isVerified: true,
    },
  });

  // ── Grilles tarifaires transport démo ──────────────────────────────────────
  const transportRates = [
    { origin: 'Douala', destination: 'Yaoundé', productCategory: 'Légumes', pricePerKg: 50, vehicleType: 'Camion 10T', estimatedDays: 1 },
    { origin: 'Douala', destination: 'Bafoussam', productCategory: 'Légumes', pricePerKg: 75, vehicleType: 'Camion 10T', estimatedDays: 2 },
    { origin: 'Douala', destination: 'Garoua', productCategory: 'Céréales', pricePerKg: 120, vehicleType: 'Camion 20T', estimatedDays: 3 },
    { origin: 'Yaoundé', destination: 'Douala', productCategory: 'Fruits', pricePerKg: 45, vehicleType: 'Pick-up', estimatedDays: 1 },
    { origin: 'Bafoussam', destination: 'Douala', productCategory: 'Légumes', pricePerKg: 60, vehicleType: 'Camion 5T', estimatedDays: 1 },
  ];

  for (const rate of transportRates) {
    const existing = await prisma.transportRate.findFirst({
      where: { transporterId: transporter.id, origin: rate.origin, destination: rate.destination, productCategory: rate.productCategory },
    });
    if (!existing) {
      await prisma.transportRate.create({
        data: { ...rate, transporterId: transporter.id },
      });
    }
  }

  // ── Produits démo ──────────────────────────────────────────────────────────
  const products = [
    { name: 'Tomates Bio', description: 'Tomates biologiques fraîches de la région Ouest', price: 1500, category: 'Légumes', unit: 'kg', stock: 500, productionZone: 'Région Ouest, Cameroun', transport: ['ROUTE', 'CHEMIN_DE_FER'], minOrderQty: 10 },
    { name: 'Maïs Sucré', description: 'Maïs sucré récolté frais, idéal pour la transformation', price: 800, category: 'Céréales', unit: 'kg', stock: 1000, productionZone: 'Région Nord, Cameroun', transport: ['ROUTE'], minOrderQty: 50 },
    { name: 'Carottes', description: 'Carottes bio croquantes cultivées sans pesticides', price: 1200, category: 'Légumes', unit: 'kg', stock: 300, productionZone: 'Région Centre, Cameroun', transport: ['ROUTE', 'MARITIME'], minOrderQty: 10 },
    { name: 'Laitue', description: 'Laitue fraîche et verte, livraison rapide', price: 500, category: 'Légumes', unit: 'pièce', stock: 200, productionZone: 'Région Littoral, Cameroun', transport: ['ROUTE', 'AERIEN'], minOrderQty: 20 },
    { name: 'Poivrons', description: 'Poivrons rouges, verts et jaunes de qualité export', price: 2000, category: 'Légumes', unit: 'kg', stock: 150, productionZone: 'Région Sud-Ouest, Cameroun', transport: ['ROUTE', 'MARITIME', 'AERIEN'], minOrderQty: 10 },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, sellerId: seller.id } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          unit: p.unit,
          productionZone: p.productionZone,
          transport: p.transport,
          minOrderQty: p.minOrderQty,
          images: [],
          sellerId: seller.id,
          stock: { create: { quantity: p.stock } },
        },
      });
    }
  }

  console.log('\n✅ Seed AgriB2B terminé avec succès !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 ADMIN        : admin@agrib2b.com      / admin123');
  console.log('🌱 VENDEUR      : vendeur@agrib2b.com    / seller123');
  console.log('🛒 ACHETEUR     : acheteur@agrib2b.com   / buyer123');
  console.log('🚛 TRANSPORTEUR : transport@agrib2b.com  / transport123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
