'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ordersApi, productsApi } from '../../../../../lib/api';
import { useAuth } from '../../../../../lib/auth-context';
import toast from 'react-hot-toast';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

export default function EditOrderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      ordersApi.getOne(id as string),
      productsApi.getAll(),
    ]).then(([orderRes, productsRes]) => {
      const o = orderRes.data;
      setOrder(o);
      setProducts(productsRes.data);
      setItems(o.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })));
    }).catch(() => {
      toast.error('Commande introuvable');
      router.push('/dashboard/orders');
    }).finally(() => setLoading(false));
  }, [id]);

  const updateQuantity = (productId: string, delta: number) => {
    setItems(prev => prev.map(i =>
      i.productId === productId
        ? { ...i, quantity: Math.max(1, i.quantity + delta) }
        : i
    ));
  };

  const removeItem = (productId: string) => {
    if (items.length <= 1) {
      toast.error('La commande doit contenir au moins un produit');
      return;
    }
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);

  const total = items.reduce((sum, item) => {
    const p = getProduct(item.productId);
    return sum + (p?.price || 0) * item.quantity;
  }, 0);

  const handleSave = async () => {
    if (items.length === 0) return toast.error('Ajoutez au moins un produit');
    setSaving(true);
    try {
      await ordersApi.update(id as string, { items });
      toast.success('Commande modifiée avec succès');
      router.push('/dashboard/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-12 text-gray-500">Chargement...</p>;

  if (!order) return null;

  if (order.status !== 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-600 font-medium">Cette commande ne peut plus être modifiée (statut: {order.status})</p>
        <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline mt-4 block">Retour aux commandes</Link>
      </div>
    );
  }

  if (order.buyerId !== user?.id) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-600 font-medium">Vous ne pouvez modifier que vos propres commandes</p>
        <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline mt-4 block">Retour aux commandes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour aux commandes
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">✏️ Modifier la commande</h1>
        <p className="text-sm text-gray-500 mb-6">Commande #{(id as string).slice(0, 8).toUpperCase()} — Vendeur : {order.seller?.name}</p>

        {/* Liste des produits */}
        <div className="space-y-3 mb-6">
          {items.map(item => {
            const product = getProduct(item.productId);
            if (!product) return null;
            return (
              <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{fmt(product.price)} / {product.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.productId, -1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="font-bold text-green-700 w-28 text-right">{fmt(product.price * item.quantity)}</p>
                <button onClick={() => removeItem(item.productId)}
                  className="text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="bg-green-50 rounded-xl p-4 mb-6 flex justify-between items-center">
          <span className="font-medium text-gray-700">Nouveau total</span>
          <span className="text-2xl font-bold text-green-700">{fmt(total)}</span>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
          <Link href="/dashboard/orders"
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 text-center">
            Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}
