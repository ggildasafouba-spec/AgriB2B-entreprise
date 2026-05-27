'use client';
import { useEffect, useState } from 'react';
import { productsApi, stockApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';

export default function StockPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    productsApi.getAll()
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (productId: string) => {
    const qty = parseFloat(editing[productId]);
    if (isNaN(qty) || qty < 0) return toast.error('Quantité invalide');
    try {
      await stockApi.update(productId, qty);
      toast.success('Stock mis à jour');
      setEditing(prev => { const n = { ...prev }; delete n[productId]; return n; });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const myProducts = user?.role === 'ADMIN'
    ? products
    : products.filter(p => p.sellerId === user?.id);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestion des stocks</h2>
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock actuel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modifier</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500">{p.category}</td>
                  <td className="px-6 py-4 text-gray-900">{p.stock?.quantity ?? 0} {p.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (p.stock?.quantity ?? 0) <= 0
                        ? 'bg-red-100 text-red-700'
                        : (p.stock?.quantity ?? 0) <= 10
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {(p.stock?.quantity ?? 0) <= 0 ? 'Rupture' : (p.stock?.quantity ?? 0) <= 10 ? 'Faible' : 'OK'}
                    </span>
                  </td>
                  {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editing[p.id] ?? ''}
                          onChange={e => setEditing(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="Nouvelle quantité"
                          className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                          min="0"
                        />
                        <button
                          onClick={() => handleUpdate(p.id)}
                          disabled={!editing[p.id]}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-40"
                        >
                          Sauver
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {myProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Aucun produit
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
