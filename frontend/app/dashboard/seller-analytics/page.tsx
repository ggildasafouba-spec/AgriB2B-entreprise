'use client';
import { useEffect, useState } from 'react';
import { ordersApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { BarChart3, TrendingUp, Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

interface OrderItem {
  quantity: number;
  product?: { name?: string };
}

interface Order {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
  buyer?: { id?: string; name?: string };
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  quantity: number;
}

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getAll().then((res) => {
      setOrders(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-16 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Cette page est réservée aux vendeurs et administrateurs.</p>
      </div>
    );
  }

  // Calculations
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / deliveredOrders.length) || 0 : 0;

  // Most sold products
  const productMap: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items || []) {
      const name = item.product?.name || 'Produit inconnu';
      productMap[name] = (productMap[name] || 0) + item.quantity;
    }
  }
  const topProducts: TopProduct[] = Object.entries(productMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Monthly revenue (last 6 months)
  const monthlyMap: Record<string, number> = {};
  for (const order of deliveredOrders) {
    const date = new Date(order.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + order.totalPrice;
  }
  const monthlyRevenue: MonthlyRevenue[] = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, revenue]) => ({ month, revenue }));
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  // Regular customers (buyers who ordered more than once)
  const buyerCounts: Record<string, number> = {};
  for (const order of orders) {
    const buyerId = order.buyer?.id;
    if (buyerId) buyerCounts[buyerId] = (buyerCounts[buyerId] || 0) + 1;
  }
  const regularCustomers = Object.values(buyerCounts).filter(c => c > 1).length;

  const monthLabel = (m: string) => {
    const [year, month] = m.split('-');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          Analytiques Vendeur
        </h1>
        <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble de vos performances de vente</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">Revenu total (FCFA)</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-500">Commandes totales</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{averageOrderValue.toLocaleString('fr-FR')}</p>
          <p className="text-xs text-gray-500">Panier moyen (FCFA)</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{regularCustomers}</p>
          <p className="text-xs text-gray-500">Clients réguliers</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Revenus mensuels
          </h3>
          {monthlyRevenue.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Pas encore de données</p>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {monthlyRevenue.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-xs text-gray-500 mb-1">
                    {(m.revenue / 1000).toFixed(0)}k
                  </span>
                  <div
                    className="w-full bg-green-500 rounded-t-lg min-h-[4px] transition-all"
                    style={{ height: `${(m.revenue / maxMonthlyRevenue) * 100}%` }}
                  />
                  <span className="text-xs text-gray-400 mt-1">{monthLabel(m.month)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            Produits les plus vendus
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Pas encore de ventes</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{p.quantity} vendus</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
