'use client';
import { useEffect, useState } from 'react';
import { adminApi, messagesApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { TrendingUp, Users, Package, ShoppingCart, Clock, Percent, MessageCircle, Phone } from 'lucide-react';

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

const STATUS_LABELS: any = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmée',
  SHIPPED:   'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  DISPUTED:  'Litige',
};

export default function AdminPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [dashboard, setDashboard]   = useState<any>(null);
  const [users, setUsers]           = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [tab, setTab]               = useState<'overview' | 'commissions' | 'users'>('overview');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getUsers(),
      adminApi.getCommissions(),
    ])
      .then(([d, u, c]) => {
        setDashboard(d.data);
        setUsers(u.data);
        setCommissions(c.data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const updateRole = async (id: string, role: string) => {
    try {
      await adminApi.updateUserRole(id, role);
      toast.success('Rôle mis à jour');
      const res = await adminApi.getUsers();
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${name} ? Cette action est irréversible.`)) return;
    try {
      await adminApi.deleteUser(id);
      toast.success(`Compte de ${name} supprimé`);
      const res = await adminApi.getUsers();
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  const s = dashboard?.stats;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Admin</h2>

      {/* KPIs */}
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiCard icon={<Users className="w-5 h-5" />}     label="Utilisateurs"       value={s.users}                          color="blue" />
          <KpiCard icon={<Package className="w-5 h-5" />}   label="Produits"            value={s.products}                       color="green" />
          <KpiCard icon={<ShoppingCart className="w-5 h-5"/>}label="Commandes"           value={s.orders}                         color="purple" />
          <KpiCard icon={<Clock className="w-5 h-5" />}     label="KYC en attente"      value={s.pendingKyc}                     color="yellow" />
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Volume livré"        value={fmt(s.totalRevenue)}              color="emerald" small />
          <KpiCard icon={<Percent className="w-5 h-5" />}   label={`Commissions (${s.commissionRate}%)`} value={fmt(s.totalAllCommissions || s.totalOrderCommissions || 0)} color="orange" small />
        </div>
      )}

      {/* Montant cumulé total des commissions */}
      {s && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Montant cumulé de toutes les commissions</p>
              <p className="text-4xl font-bold mt-2">{fmt(s.totalAllCommissions || 0)}</p>
              <div className="flex gap-6 mt-3 text-sm opacity-90">
                <div>
                  <p className="opacity-70">Commandes ({s.commissionRate}%)</p>
                  <p className="font-semibold">{fmt(s.totalOrderCommissions || 0)}</p>
                </div>
                <div>
                  <p className="opacity-70">Transport (3%)</p>
                  <p className="font-semibold">{fmt(s.totalTransportCommissions || 0)}</p>
                </div>
                <div>
                  <p className="opacity-70">Dont libérées</p>
                  <p className="font-semibold">{fmt(s.totalReleasedCommissions || 0)}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-10 h-10 opacity-60" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bandeau détail commissions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Commissions commandes (5% particuliers / 10% entreprises)</p>
            <p className="text-2xl font-bold mt-1">{fmt(s?.totalOrderCommissions || 0)}</p>
            <p className="text-sm opacity-75 mt-1">
              Vendeurs ont reçu {fmt(s?.totalSellerPayouts || 0)}
            </p>
          </div>
          <Percent className="w-12 h-12 opacity-20" />
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Commissions transport (3%)</p>
            <p className="text-2xl font-bold mt-1">{fmt(s?.totalTransportCommissions || 0)}</p>
            <p className="text-sm opacity-75 mt-1">
              {s?.transportRatesCount || 0} tarifs actifs
            </p>
          </div>
          <TrendingUp className="w-12 h-12 opacity-20" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {(['overview', 'commissions', 'users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'overview' ? 'Vue générale' : t === 'commissions' ? 'Commissions' : 'Utilisateurs'}
          </button>
        ))}
      </div>

      {/* ── Vue générale ── */}
      {tab === 'overview' && dashboard && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold mb-4">Commandes par statut</h3>
            <div className="space-y-2">
              {dashboard.ordersByStatus.map((s: any) => (
                <div key={s.status} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <span className="text-sm text-gray-600">{STATUS_LABELS[s.status] || s.status}</span>
                  <div className="text-right">
                    <span className="font-semibold text-sm">{s._count.id} commandes</span>
                    {s._sum?.totalPrice > 0 && (
                      <p className="text-xs text-gray-400">{fmt(s._sum.totalPrice)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="font-semibold mb-4">Dernières commandes</h3>
            <div className="space-y-2">
              {dashboard.recentOrders.map((o: any) => {
                const fallbackRate = o.seller?.accountType === 'COMPANY' ? 0.05 : 0.10;
                const commission = o.escrow?.commission ?? Math.round(o.totalPrice * fallbackRate * 100) / 100;
                return (
                  <div key={o.id} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">#{o.id.slice(0, 8)} — {o.buyer?.name}</p>
                      <p className="text-xs text-gray-400">{o.seller?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-700">{fmt(o.totalPrice)}</p>
                      <p className="text-xs text-amber-600">comm. {fmt(commission)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Commissions ── */}
      {tab === 'commissions' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Rapport des commissions</h3>
            <span className="text-sm text-gray-500">{commissions.length} transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Commande', 'Acheteur', 'Vendeur', 'Total', 'Commission', 'Vendeur reçoit', 'Statut', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((c: any) => (
                  <tr key={c.orderId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">#{c.orderId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.buyer}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.seller}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{fmt(c.total)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-amber-600">{fmt(c.commission)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">{fmt(c.sellerAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'RELEASED' ? 'bg-green-100 text-green-700' :
                        c.status === 'REFUNDED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {c.status === 'HELD' ? '🔒 Bloqué' : c.status === 'RELEASED' ? '✅ Libéré' : '↩️ Remboursé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(c.date).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Aucune transaction</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Utilisateurs ── */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">Gestion des utilisateurs ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Nom', 'Email', 'Téléphone', 'Type', 'Rôle', 'KYC', 'Pays / Région', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {u.phone ? (
                        <a href={`tel:${u.phone}`} className="flex items-center gap-1 text-green-700 hover:underline">
                          <Phone className="w-3 h-3" />{u.phone}
                        </a>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {u.accountType === 'COMPANY' ? '🏢 Entreprise' : '👤 Particulier'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN'  ? 'bg-red-100 text-red-700' :
                        u.role === 'SELLER' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'TRANSPORTER' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                        u.kycStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{u.kycStatus}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {[u.region, u.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={async () => {
                            try {
                              await messagesApi.createConversation(u.id, `Admin → ${u.name}`);
                              toast.success(`Conversation créée avec ${u.name}`);
                              window.location.href = '/dashboard/messages';
                            } catch (err: any) {
                              if (err.response?.status === 409) {
                                toast.success(`Conversation existante avec ${u.name}`);
                                window.location.href = '/dashboard/messages';
                              } else {
                                toast.error('Erreur lors de la création de la conversation');
                              }
                            }
                          }}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                          title={`Envoyer un message à ${u.name}`}
                        >
                          <MessageCircle className="w-3 h-3" /> Contacter
                        </button>
                        {u.role === 'ADMIN' ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">ADMIN</span>
                        ) : (
                          <select value={u.role} onChange={e => updateRole(u.id, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm">
                            <option value="BUYER">BUYER</option>
                            <option value="SELLER">SELLER</option>
                            <option value="TRANSPORTER">TRANSPORTER</option>
                          </select>
                        )}
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, color, small }: any) {
  const colors: any = {
    blue:    'bg-blue-50 text-blue-700',
    green:   'bg-green-50 text-green-700',
    purple:  'bg-purple-50 text-purple-700',
    yellow:  'bg-yellow-50 text-yellow-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    orange:  'bg-orange-50 text-orange-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 opacity-70 mb-1">{icon}<p className="text-xs font-medium">{label}</p></div>
      <p className={`font-bold ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
