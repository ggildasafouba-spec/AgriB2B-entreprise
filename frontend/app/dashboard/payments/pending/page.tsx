'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi, paymentsApi } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Clock, XCircle, Smartphone } from 'lucide-react';

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function PendingPaymentsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    ordersApi.getAll()
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const pendingOrders = orders.filter(order => order.payment?.status === 'PENDING');

  const handleConfirmPayment = async (orderId: string, status: 'SUCCESS' | 'FAILED') => {
    setConfirming(orderId);
    try {
      await paymentsApi.confirm(orderId, status);
      toast.success(status === 'SUCCESS' ? 'Paiement confirmé' : 'Paiement rejeté');
      const updated = await ordersApi.getAll();
      setOrders(updated.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de confirmation');
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paiements en attente</h2>
          <p className="text-gray-500 mt-1">Liste des commandes dont le paiement est en attente de validation.</p>
        </div>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Retour aux paiements
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : pendingOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          <Clock className="mx-auto mb-3 w-10 h-10 text-yellow-500" />
          <p className="font-semibold">Aucun paiement en attente pour le moment.</p>
          <p className="mt-2 text-sm text-gray-500">Les paiements en attente apparaîtront ici après initiation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingOrders.map(order => (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-gray-900">Commande #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {user?.role === 'BUYER'
                      ? `Vendeur : ${order.seller?.name || '...'}`
                      : `Acheteur : ${order.buyer?.name || '...'}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-700">{fmt(order.totalPrice)}</p>
                  <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                    <Clock className="w-3.5 h-3.5" /> En attente
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">Moyen</p>
                  <p className="font-medium text-gray-900">{order.payment?.provider === 'MANUAL' ? 'Virement bancaire' : order.payment?.provider === 'MTN_MOMO' ? 'MTN Mobile Money' : 'Orange Money'}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">Référence / Téléphone</p>
                  <p className="font-medium text-gray-900">{order.payment?.phone || 'Non renseigné'}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-400">Statut</p>
                  <p className="font-medium text-gray-900">{order.payment?.status}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  <p>Commande initiée le {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>

                {(user?.role === 'SELLER' || user?.role === 'ADMIN') ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleConfirmPayment(order.id, 'SUCCESS')}
                      disabled={confirming === order.id}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {confirming === order.id ? 'Confirmation...' : 'Valider le paiement'}
                    </button>
                    <button
                      onClick={() => handleConfirmPayment(order.id, 'FAILED')}
                      disabled={confirming === order.id}
                      className="px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      {confirming === order.id ? 'Traitement...' : 'Rejeter le paiement'}
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="font-medium">Votre paiement est en attente de validation.</p>
                    <p className="mt-1">Il sera confirmé dès que le vendeur ou l'équipe aura vérifié la transaction.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
