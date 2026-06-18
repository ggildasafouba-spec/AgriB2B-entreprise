'use client';
import { useAuth } from '../../lib/auth-context';
import { useEffect, useState } from 'react';
import { ordersApi, productsApi, notificationsApi } from '../../lib/api';
import Link from 'next/link';
import { ShoppingCart, Package, Truck } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, products: 0, unread: 0 });
  const [activeMode, setActiveMode] = useState<string | null>(null);

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

  // Si pas de mode sélectionné, afficher le choix
  if (!activeMode) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900"><img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-10 h-10 rounded-full inline mr-2 align-middle" />Bienvenue sur la plateforme AgriB2B</h1>
          <p className="text-green-700 mt-2 text-lg font-bold italic">&laquo; La terre produit, AgriB2B distribue &raquo;</p>
          <p className="text-gray-600 mt-3 text-sm max-w-xl mx-auto">
            Achetez, vendez et livrez des produits agricoles en toute confiance. Paiements sécurisés via Mobile Money, gestion des stocks en temps réel, logistique intégrée. +50 acteurs agricoles nous font déjà confiance.
          </p>
          <p className="text-gray-500 mt-4">Bonjour <span className="font-semibold text-green-700">{user?.name}</span>, que souhaitez-vous faire aujourd&apos;hui ?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <RoleCard
            icon={<ShoppingCart className="w-10 h-10" />}
            title="Acheter"
            description="Parcourir les produits agricoles, passer des commandes et suivre vos livraisons"
            color="bg-blue-50 border-blue-200 hover:border-blue-500"
            iconColor="text-blue-600"
            onClick={() => setActiveMode('buyer')}
          />
          <RoleCard
            icon={<Package className="w-10 h-10" />}
            title="Vendre"
            description="Publier vos produits, gérer votre stock et recevoir des commandes"
            color="bg-green-50 border-green-200 hover:border-green-500"
            iconColor="text-green-600"
            onClick={() => setActiveMode('seller')}
          />
          <RoleCard
            icon={<Truck className="w-10 h-10" />}
            title="Transporter"
            description="Proposer vos tarifs de transport et gérer vos livraisons"
            color="bg-orange-50 border-orange-200 hover:border-orange-500"
            iconColor="text-orange-600"
            onClick={() => setActiveMode('transporter')}
          />
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          <div className="text-center bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">{stats.orders}</p>
            <p className="text-xs text-gray-500">Commandes</p>
          </div>
          <div className="text-center bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-600">{stats.products}</p>
            <p className="text-xs text-gray-500">Produits</p>
          </div>
          <div className="text-center bg-white rounded-xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-yellow-600">{stats.unread}</p>
            <p className="text-xs text-gray-500">Notifications</p>
          </div>
        </div>
      </div>
    );
  }

  // Mode Acheteur
  if (activeMode === 'buyer') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🛒 Mode Acheteur</h2>
            <p className="text-gray-500 text-sm">Parcourez et commandez des produits agricoles</p>
          </div>
          <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
            ← Changer de mode
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <QuickAction href="/dashboard/products" title="Parcourir les produits" desc="Découvrez les produits agricoles disponibles" />
          <QuickAction href="/dashboard/orders" title="Mes commandes" desc="Suivez vos commandes en cours" />
          <QuickAction href="/dashboard/product-listings" title="Annonces des producteurs" desc="Voir les offres par producteur" />
          <QuickAction href="/dashboard/messages" title="Messages" desc="Communiquez avec les vendeurs" />
        </div>
      </div>
    );
  }

  // Mode Vendeur
  if (activeMode === 'seller') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🌱 Mode Vendeur</h2>
            <p className="text-gray-500 text-sm">Gérez vos produits et vos ventes</p>
          </div>
          <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
            ← Changer de mode
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <QuickAction href="/dashboard/products" title="Mes produits" desc="Ajoutez ou modifiez vos produits" />
          <QuickAction href="/dashboard/orders" title="Commandes reçues" desc="Gérez les commandes de vos clients" />
          <QuickAction href="/dashboard/stock" title="Gestion du stock" desc="Suivez vos inventaires en temps réel" />
          <QuickAction href="/dashboard/payments" title="Paiements" desc="Suivez vos revenus et paiements" />
        </div>
      </div>
    );
  }

  // Mode Transporteur
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚛 Mode Transporteur</h2>
          <p className="text-gray-500 text-sm">Gérez vos tarifs et vos livraisons</p>
        </div>
        <button onClick={() => setActiveMode(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
          ← Changer de mode
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <QuickAction href="/dashboard/transport" title="Mes tarifs" desc="Gérez vos grilles tarifaires de transport" />
        <QuickAction href="/dashboard/orders" title="Livraisons" desc="Suivez les livraisons en cours" />
        <QuickAction href="/dashboard/messages" title="Messages" desc="Communiquez avec les clients" />
        <QuickAction href="/dashboard/notifications" title="Notifications" desc="Alertes de nouvelles livraisons" />
      </div>
    </div>
  );
}

function RoleCard({ icon, title, description, color, iconColor, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 ${color} hover:shadow-lg`}
    >
      <div className={`mb-4 ${iconColor}`}>{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
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
