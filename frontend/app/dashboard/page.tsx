'use client';
import { useAuth } from '../../lib/auth-context';
import { useEffect, useState } from 'react';
import { ordersApi, productsApi, notificationsApi } from '../../lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, products: 0, unread: 0 });

  useEffect(() => {
    Promise.all([
      ordersApi.getAll().catch(() => ({ data: [] })),
      productsApi.getAll().catch(() => ({ data: [] })),
      notificationsApi.getUnreadCount().catch(() => ({ data: { count: 0 } })),
    ]).then(([orders, products, notifs]) => {
      setStats({
        orders: orders.data.length,
        products: products.data.length,
        unread: notifs.data.count,
      });
    });
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
      <p className="text-gray-500 mb-8">Bienvenue, {user?.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Mes commandes" value={stats.orders} color="blue" href="/dashboard/orders" />
        <StatCard label="Produits disponibles" value={stats.products} color="green" href="/dashboard/products" />
        <StatCard label="Notifications non lues" value={stats.unread} color="yellow" href="/dashboard/notifications" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <QuickAction href="/dashboard/products" title="Parcourir les produits" desc="Découvrez les produits agricoles disponibles" />
        <QuickAction href="/dashboard/product-listings" title="Annonces des producteurs" desc="Voir les producteurs et les stocks par producteur" />
        <QuickAction href="/dashboard/advance-orders" title="Commandes anticipées" desc="Gérer vos pré-commandes et offres futures" />
        {user?.role === 'SELLER' && (
          <QuickAction href="/dashboard/products" title="Gérer mes produits" desc="Ajoutez ou modifiez vos produits" />
        )}
        <QuickAction href="/dashboard/kyc" title="Vérification KYC" desc="Complétez votre vérification d'identité" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color, href }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };
  return (
    <Link href={href} className={`rounded-xl p-6 ${colors[color]} hover:shadow-md transition`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-4xl font-bold mt-1">{value}</p>
    </Link>
  );
}

function QuickAction({ href, title, desc }: any) {
  return (
    <Link href={href} className="bg-white rounded-xl shadow p-6 hover:shadow-md transition">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
      <span className="text-green-600 text-sm mt-2 inline-block">Accéder →</span>
    </Link>
  );
}
