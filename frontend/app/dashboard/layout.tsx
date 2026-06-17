'use client';
import { useAuth } from '../../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { messagesApi, notificationsApi, ordersApi } from '../../lib/api';
import { LanguageSwitcher } from '../../lib/i18n';
import {
  Home, Package, ShoppingCart, Bell, Shield,
  BarChart3, LogOut, Boxes, MessageSquare, CreditCard, Truck, UserCircle,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [unreadMsg,  setUnreadMsg]  = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  // Badges non-lus
  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      messagesApi.getUnreadCount().then(r => setUnreadMsg(r.data.count)).catch(() => {});
      notificationsApi.getUnreadCount().then(r => setUnreadNotif(r.data.count)).catch(() => {});
      // Compter les paiements en attente pour vendeurs et admins
      if (user.role === 'SELLER' || user.role === 'ADMIN') {
        ordersApi.getAll().then(r => {
          console.log('📋 Commandes reçues:', r.data);
          const pending = r.data.filter((order: any) => {
            console.log(`  Commande ${order.id}: payment=${JSON.stringify(order.payment)}`);
            return order.payment?.status === 'PENDING';
          }).length;
          console.log(`✅ Paiements en attente: ${pending}`);
          setPendingPayments(pending);
        }).catch(err => {
          console.error('❌ Erreur lors de la récupération des commandes:', err);
        });
      }
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Chargement...</p>
      </div>
    </div>
  );
  if (!user) return null;

  const navItems = [
    { href: '/dashboard',               label: 'Accueil',       icon: <Home className="w-5 h-5" /> },
    { href: '/dashboard/products',      label: 'Produits',      icon: <Package className="w-5 h-5" /> },
    { href: '/dashboard/product-listings', label: 'Annonces',    icon: <Boxes className="w-5 h-5" /> },
    { href: '/dashboard/orders',        label: 'Commandes',     icon: <ShoppingCart className="w-5 h-5" /> },
    { href: '/dashboard/payments',      label: 'Paiements',     icon: <CreditCard className="w-5 h-5" />, badge: pendingPayments },
    { href: '/dashboard/stock',         label: 'Stock',         icon: <Boxes className="w-5 h-5" /> },
    { href: '/dashboard/messages',      label: 'Messages',      icon: <MessageSquare className="w-5 h-5" />, badge: unreadMsg },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadNotif },
    { href: '/dashboard/kyc',           label: 'KYC',           icon: <Shield className="w-5 h-5" /> },
    { href: '/dashboard/transport',     label: 'Transport',     icon: <Truck className="w-5 h-5" /> },
    { href: '/dashboard/profile',       label: 'Mon Profil',    icon: <UserCircle className="w-5 h-5" /> },
    ...(user.role === 'ADMIN' ? [{ href: '/dashboard/admin', label: 'Admin', icon: <BarChart3 className="w-5 h-5" /> }] : []),
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6 border-b">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-10 h-10 rounded-full" />
            <div>
              <h1 className="text-lg font-bold text-green-700">AgriB2B</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Plateforme Agricole B2B</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-1 font-medium">{user.name}</p>
          <div className="flex gap-1 mt-1">
            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">{user.role}</span>
            {user.accountType && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                {user.accountType === 'COMPANY' ? 'Entreprise' : 'Particulier'}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`min-w-5 h-5 px-1 rounded-full text-xs font-bold flex items-center justify-center ${
                    active ? 'bg-white text-green-700' : 'bg-green-500 text-white'
                  }`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t space-y-2">
          <div className="flex justify-center">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-600 hover:bg-red-50 transition text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-green-700"><img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-8 h-8 rounded-full inline mr-2" />AgriB2B</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
