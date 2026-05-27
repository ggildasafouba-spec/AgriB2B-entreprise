'use client';
import React, { useEffect, useState } from 'react';
import { advanceOrdersApi, productListingsApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { Calendar, ClipboardList, Send } from 'lucide-react';

export default function AdvanceOrdersPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    productListingId: '', requestedQuantity: '', requiredDate: '', notes: '',
  });

  const loadList = async () => {
    const [listingsRes, ordersRes] = await Promise.all([
      productListingsApi.getAll(),
      user?.role === 'SELLER'
        ? advanceOrdersApi.getSellerOrders()
        : advanceOrdersApi.getBuyerOrders(),
    ]);
    setListings(listingsRes.data);
    setOrders(ordersRes.data);
  };

  useEffect(() => {
    if (!user) return;
    loadList().finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.productListingId || !form.requestedQuantity || !form.requiredDate) {
      return toast.error('Veuillez remplir tous les champs requis');
    }
    try {
      await advanceOrdersApi.create({
        productListingId: form.productListingId,
        requestedQuantity: parseFloat(form.requestedQuantity),
        requiredDate: new Date(form.requiredDate),
        notes: form.notes,
      });
      toast.success('Demande créée');
      setForm({ productListingId: '', requestedQuantity: '', requiredDate: '', notes: '' });
      loadList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la demande');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await advanceOrdersApi.updateStatus(orderId, status);
      toast.success(`Commande ${status.toLowerCase()}`);
      loadList();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impossible de mettre à jour');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Commandes anticipées</h2>
          <p className="text-gray-500 mt-1">Offrez et consultez les commandes futures directement depuis la marketplace.</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-5 h-5 text-green-600" />
          {user?.role === 'SELLER' ? 'Vue vendeur' : 'Vue acheteur'}
        </div>
      </div>

      {user?.role !== 'SELLER' && (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <ClipboardList className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-xl font-semibold">Demander une commande anticipée</h3>
              <p className="text-sm text-gray-500">Sélectionnez une annonce et demandez une livraison future.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annonce</label>
              <select
                value={form.productListingId}
                onChange={e => setForm(prev => ({ ...prev, productListingId: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              >
                <option value="">Sélectionnez une annonce</option>
                {listings.map(listing => (
                  <option key={listing.id} value={listing.id}>
                    {listing.seller.name} — {listing.product.name} ({listing.currentStock} {listing.product.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité demandée</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.requestedQuantity}
                onChange={e => setForm(prev => ({ ...prev, requestedQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date requise</label>
              <input
                type="date"
                value={form.requiredDate}
                onChange={e => setForm(prev => ({ ...prev, requiredDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 min-h-[130px]"
                placeholder="Précisez vos besoins ou contraintes"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">
                <Send className="w-4 h-4" /> Envoyer la demande
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-semibold">Commandes anticipées</h3>
            <p className="text-sm text-gray-500">Liste des demandes et de leur statut.</p>
          </div>
          <span className="text-sm text-gray-500">{orders.length} commandes</span>
        </div>

        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">Aucune commande anticipée pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="rounded-3xl border border-gray-100 p-5 bg-gray-50">
                <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">{order.productListing.product.name}</p>
                    <p className="text-sm text-gray-500">{order.productListing.seller.name} · {order.productListing.currentStock} {order.productListing.product.unit}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.requiredDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 border border-gray-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Quantité demandée</p>
                    <p className="mt-2 font-semibold text-gray-900">{order.requestedQuantity} {order.productListing.product.unit}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-gray-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Statut</p>
                    <p className="mt-2 font-semibold text-gray-900">{order.status}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-gray-100">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Créé le</p>
                    <p className="mt-2 font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                {user?.role === 'SELLER' && order.status === 'PENDING' && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                    >Confirmer</button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100"
                    >Refuser</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
