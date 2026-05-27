'use client';
import React, { useEffect, useState } from 'react';
import { productsApi, productListingsApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp, Building2, Plus } from 'lucide-react';

export default function ProductListingsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [listings, setListings] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: '', currentStock: '', availabilityDate: '', estimatedEndDate: '',
  });

  useEffect(() => {
    productsApi.getAll().then(res => setProducts(res.data)).finally(() => setLoading(false));
  }, []);

  const toggleProduct = async (productId: string) => {
    if (!expanded[productId]) {
      if (!listings[productId]) {
        try {
          const res = await productListingsApi.getForProduct(productId);
          setListings(prev => ({ ...prev, [productId]: res.data }));
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Impossible de charger les annonces');
          return;
        }
      }
    }
    setExpanded(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const refreshProductListings = async (productId: string) => {
    const res = await productListingsApi.getForProduct(productId);
    setListings(prev => ({ ...prev, [productId]: res.data }));
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.currentStock || !form.availabilityDate) {
      return toast.error('Veuillez remplir tous les champs');
    }
    try {
      await productListingsApi.create({
        productId: form.productId,
        currentStock: parseFloat(form.currentStock),
        availabilityDate: new Date(form.availabilityDate),
        estimatedEndDate: form.estimatedEndDate ? new Date(form.estimatedEndDate) : undefined,
      });
      toast.success('Annonce créée');
      setForm({ productId: '', currentStock: '', availabilityDate: '', estimatedEndDate: '' });
      setShowForm(false);
      refreshProductListings(form.productId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Annonces par producteur</h2>
          <p className="text-gray-500 mt-1">Voir les stocks individuel par producteur et les dates de disponibilité.</p>
        </div>
        {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setShowForm(prev => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> Créer une annonce
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreateListing} className="bg-white rounded-2xl shadow p-6 mb-8 border border-green-100">
          <h3 className="text-xl font-semibold mb-4">Publier une annonce</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
              <select
                value={form.productId}
                onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              >
                <option value="">Sélectionnez un produit</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité disponible</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.currentStock}
                onChange={e => setForm(prev => ({ ...prev, currentStock: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                placeholder="Ex: 150"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de disponibilité</label>
              <input
                type="date"
                value={form.availabilityDate}
                onChange={e => setForm(prev => ({ ...prev, availabilityDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date estimée de fin</label>
              <input
                type="date"
                value={form.estimatedEndDate}
                onChange={e => setForm(prev => ({ ...prev, estimatedEndDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="submit" className="px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">Publier</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-3 border rounded-xl">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid gap-6">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{product.category || 'Sans catégorie'}</p>
                  <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                </div>
                <button
                  onClick={() => toggleProduct(product.id)}
                  className="inline-flex items-center gap-2 text-green-600 border border-green-100 rounded-full px-4 py-2 text-sm hover:bg-green-50"
                >
                  {expanded[product.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {expanded[product.id] ? 'Masquer les producteurs' : 'Voir les producteurs'}
                </button>
              </div>

              {expanded[product.id] && (
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  {listings[product.id]?.length ? (
                    <div className="grid gap-4">
                      {listings[product.id].map(listing => (
                        <div key={listing.id} className="rounded-3xl bg-white p-5 border border-gray-100 shadow-sm">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div>
                              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                                <Building2 className="w-4 h-4" />
                                Producteur : {listing.seller.name}
                              </div>
                              <div className="mt-3 text-sm text-gray-600 space-y-1">
                                <p>Stock disponible : <strong>{listing.currentStock} {product.unit}</strong></p>
                                <p>Statut : <strong>{listing.listingStatus}</strong></p>
                                <p>Disponible le : <strong>{new Date(listing.availabilityDate).toLocaleDateString()}</strong></p>
                                {listing.estimatedEndDate && (
                                  <p>Date de fin estimée : <strong>{new Date(listing.estimatedEndDate).toLocaleDateString()}</strong></p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-700">
                                {product.price.toLocaleString()} FCFA / {product.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune annonce trouvée pour ce produit.</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
