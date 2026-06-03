'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi, paymentsApi, invoicesApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { Smartphone, Download, CheckCircle, Clock, XCircle } from 'lucide-react';

const PROVIDERS = [
  { value: 'MTN_MOMO',      label: 'MTN Mobile Money',  color: 'bg-yellow-400', logo: '🟡' },
  { value: 'ORANGE_MONEY',  label: 'Orange Money',       color: 'bg-orange-500', logo: '🟠' },
  { value: 'MANUAL',        label: 'Virement bancaire',  color: 'bg-gray-500',   logo: '🏦' },
];

const BANK_INSTRUCTIONS = {
  account: '123 456 7890',
  bank: 'Banque Nationale',
  holder: 'Agromarket Enterprise',
  details: 'Après virement, indiquez la référence de transaction ou le numéro de reçu.',
};

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

export default function PaymentsPage() {
  const { user } = useAuth();
  const [orders, setOrders]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [payModal, setPayModal]     = useState<any>(null);
  const [payForm, setPayForm]       = useState({ provider: 'MTN_MOMO', phone: '' });
  const [paying, setPaying]         = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    ordersApi.getAll()
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal) return;
    setPaying(true);
    try {
      const res = await paymentsApi.initiate(payModal.id, payForm.provider, payForm.phone);
      toast.success(`✅ ${res.data.message}`);
      setPayModal(null);
      const updated = await ordersApi.getAll();
      setOrders(updated.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de paiement');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    setDownloading(orderId);
    try {
      const res = await invoicesApi.download(orderId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-AGM-${orderId.slice(0, 8).toUpperCase()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Facture téléchargée');
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloading(null);
    }
  };

  const handleConfirmPayment = async (orderId: string, status: 'SUCCESS' | 'FAILED') => {
    setConfirming(orderId);
    try {
      await paymentsApi.confirm(orderId, status);
      toast.success(status === 'SUCCESS' ? 'Paiement confirmé' : 'Paiement rejeté');
      const updated = await ordersApi.getAll();
      setOrders(updated.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setConfirming(null);
    }
  };

  const payableOrders = orders.filter(o =>
    user?.role === 'BUYER'
      ? ['PENDING', 'CONFIRMED'].includes(o.status)
      : true
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paiements & Factures</h2>
          <p className="text-gray-500 mt-1">Payez vos commandes via MTN, Orange ou par virement bancaire, puis téléchargez vos factures PDF.</p>
        </div>
        <Link
          href="/dashboard/payments/pending"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
        >
          Paiements en attente
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {payableOrders.map(order => {
            const payment = order.payment;
            const isPaid  = payment?.status === 'SUCCESS';

            return (
              <div key={order.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <p className="font-bold text-gray-900">Commande #{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">
                      {user?.role === 'BUYER' ? `Vendeur : ${order.seller?.name}` : `Acheteur : ${order.buyer?.name}`}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-700">{fmt(order.totalPrice)}</p>
                    <PaymentBadge payment={payment} />
                  </div>
                </div>

                {/* Détail paiement si existant */}
                {payment && (
                  <div className="mt-3 bg-gray-50 rounded-lg px-4 py-2 text-sm flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Moyen de paiement</p>
                      <p className="font-medium">{PROVIDERS.find(p => p.value === payment.provider)?.label}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{payment.provider === 'MANUAL' ? 'Référence' : 'Téléphone'}</p>
                      <p className="font-medium">{payment.phone}</p>
                    </div>
                    {payment.transactionId && (
                      <div>
                        <p className="text-xs text-gray-400">Référence</p>
                        <p className="font-mono text-xs font-medium">{payment.transactionId}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {/* Bouton payer */}
                  {user?.role === 'BUYER' && !isPaid && (
                    <button
                      onClick={() => { setPayModal(order); setPayForm({ provider: 'MTN_MOMO', phone: (user as any)?.phone || '' }); }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      <Smartphone className="w-4 h-4" /> Payer maintenant
                    </button>
                  )}

                  {/* Bouton confirmer paiement */}
                  {(user?.role === 'SELLER' || user?.role === 'ADMIN') && order.payment?.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleConfirmPayment(order.id, 'SUCCESS')}
                        disabled={confirming === order.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        {confirming === order.id ? 'Confirmation...' : 'Confirmer paiement'}
                      </button>
                      <button
                        onClick={() => handleConfirmPayment(order.id, 'FAILED')}
                        disabled={confirming === order.id}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        {confirming === order.id ? 'Traitement...' : 'Rejeter paiement'}
                      </button>
                    </>
                  )}

                  {/* Bouton facture */}
                  <button
                    onClick={() => handleDownloadInvoice(order.id)}
                    disabled={downloading === order.id}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {downloading === order.id ? 'Génération...' : 'Télécharger facture PDF'}
                  </button>
                </div>
              </div>
            );
          })}

          {payableOrders.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune commande</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modal paiement Mobile Money ── */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Paiement</h3>
            <p className="text-gray-500 text-sm mb-5">
              Commande #{payModal.id.slice(0, 8).toUpperCase()} —{' '}
              <span className="font-bold text-green-700">{fmt(payModal.totalPrice)}</span>
            </p>

            <form onSubmit={handlePay} className="space-y-4">
              {/* Choix opérateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opérateur</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPayForm(f => ({ ...f, provider: p.value }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                        payForm.provider === p.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{p.logo}</span>
                      <span className="text-xs font-medium text-center leading-tight">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Numéro de téléphone ou référence de virement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {payForm.provider === 'MANUAL' ? 'Référence de virement' : 'Numéro Mobile Money'}
                </label>
                <input
                  type="text"
                  value={payForm.phone}
                  onChange={e => setPayForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder={payForm.provider === 'MANUAL' ? 'Référence ou numéro de reçu' : '+237 6XX XXX XXX'}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </div>

              {payForm.provider === 'MANUAL' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                  <p className="font-semibold">Instructions de virement bancaire</p>
                  <p>Banque : {BANK_INSTRUCTIONS.bank}</p>
                  <p>Compte : {BANK_INSTRUCTIONS.account}</p>
                  <p>Titulaire : {BANK_INSTRUCTIONS.holder}</p>
                  <p className="mt-2 text-xs text-gray-500">{BANK_INSTRUCTIONS.details}</p>
                </div>
              )}

              {/* Récapitulatif */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Montant à payer</span>
                  <span className="font-bold text-green-700">{fmt(payModal.totalPrice)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={paying}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {paying
                    ? 'Traitement en cours...'
                    : payForm.provider === 'MANUAL'
                      ? 'Enregistrer le virement'
                      : 'Confirmer le paiement'}
                </button>
                <button
                  type="button"
                  onClick={() => setPayModal(null)}
                  className="px-4 py-3 border rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentBadge({ payment }: { payment: any }) {
  if (!payment) return <span className="text-xs text-gray-400 mt-1 block">Non payé</span>;
  if (payment.status === 'SUCCESS') return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
      <CheckCircle className="w-3.5 h-3.5" /> Payé
    </span>
  );
  if (payment.status === 'PENDING') return (
    <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium mt-1">
      <Clock className="w-3.5 h-3.5" /> En attente
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-red-600 font-medium mt-1">
      <XCircle className="w-3.5 h-3.5" /> Échoué
    </span>
  );
}
