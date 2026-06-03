'use client';
import { useEffect, useState } from 'react';
import { ordersApi, productsApi, deliveryApi, transportApi, installmentsApi, reviewsApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { ShoppingCart, Info, Truck, MapPin, CreditCard } from 'lucide-react';
import Link from 'next/link';

const COMPANY_COMMISSION = 0.10;
const INDIVIDUAL_COMMISSION = 0.05;

const STATUS_LABELS: any = {
  PENDING:   { label: 'En attente',  color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmée',   color: 'bg-blue-100 text-blue-700' },
  SHIPPED:   { label: 'Expédiée',    color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Livrée',      color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulée',     color: 'bg-red-100 text-red-700' },
  DISPUTED:  { label: 'Litige',      color: 'bg-orange-100 text-orange-700' },
};

function fmt(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders]   = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cart, setCart]       = useState<{ productId: string; quantity: number }[]>([]);

  const load = () => {
    Promise.all([ordersApi.getAll(), productsApi.getAll()])
      .then(([o, p]) => { setOrders(o.data); setProducts(p.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Panier ─────────────────────────────────────────────────────────────────
  const addToCart = (productId: string) => {
    setCart(prev => {
      const ex = prev.find(i => i.productId === productId);
      if (ex) return prev.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) =>
    setCart(prev => prev.filter(i => i.productId !== productId));

  const cartTotal = cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p?.price || 0) * item.quantity;
  }, 0);

  const cartCommission = Math.round(cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    const rate = p?.seller?.accountType === 'COMPANY' ? COMPANY_COMMISSION : INDIVIDUAL_COMMISSION;
    return sum + (p?.price || 0) * item.quantity * rate;
  }, 0) * 100) / 100;
  const cartSellerAmount = Math.round((cartTotal - cartCommission) * 100) / 100;

  const handleOrder = async () => {
    if (cart.length === 0) return toast.error('Panier vide');
    try {
      await ordersApi.create({ items: cart });
      toast.success('Commande passée avec succès');
      setCart([]);
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success('Statut mis à jour');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Commandes</h2>
        {/* Tous les utilisateurs peuvent passer une commande */}
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <ShoppingCart className="w-4 h-4" /> Nouvelle commande
        </button>
      </div>

      {/* Formulaire nouvelle commande */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-green-100">
          <h3 className="font-bold text-lg mb-4">Sélectionner des produits</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {products.map(p => (
              <div key={p.id} className="border rounded-xl p-3 hover:border-green-400 transition">
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-sm text-green-700 font-medium">{fmt(p.price)}/{p.unit}</p>
                <p className="text-xs text-gray-400">Stock: {p.stock?.quantity} {p.unit}</p>
                {p.minOrderQty > 1 && (
                  <p className="text-xs text-amber-600">Min: {p.minOrderQty} {p.unit}</p>
                )}
                <button onClick={() => addToCart(p.id)}
                  className="mt-2 w-full px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium">
                  + Ajouter
                </button>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Récapitulatif de commande</h4>
              <div className="space-y-2 mb-4">
                  {cart.map(item => {
                  const p = products.find(x => x.id === item.productId);
                  return (
                    <div key={item.productId} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-medium">{p?.name} × {item.quantity} {p?.unit}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-green-700 font-semibold">{fmt((p?.price || 0) * item.quantity)}</span>
                        <button onClick={() => removeFromCart(item.productId)}
                          className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Détail financier */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-medium">{fmt(cartTotal)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>Total à payer</span>
                  <span className="text-green-700">{fmt(cartTotal)}</span>
                </div>
              </div>

              <button onClick={handleOrder}
                className="mt-4 w-full px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">
                Confirmer la commande — {fmt(cartTotal)}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Liste des commandes */}
      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const fallbackRate = order.seller?.accountType === 'COMPANY' ? 0.05 : 0.10;
            const commission   = order.escrow?.commission ?? Math.round(order.totalPrice * fallbackRate * 100) / 100;
            const sellerAmount = order.escrow?.sellerAmount ?? Math.round((order.totalPrice - commission) * 100) / 100;

            return (
              <div key={order.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900">Commande #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {user?.role !== 'BUYER' ? `Acheteur : ${order.buyer?.name}` : `Vendeur : ${order.seller?.name}`}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[order.status]?.color}`}>
                      {STATUS_LABELS[order.status]?.label}
                    </span>
                    <p className="text-xl font-bold text-green-700 mt-1">{fmt(order.totalPrice)}</p>
                  </div>
                </div>

                {/* Articles */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {order.items?.map((item: any) => (
                    <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {item.product?.name} × {item.quantity}
                    </span>
                  ))}
                </div>

                {/* Détail financier */}
                <div className="mt-3 bg-gray-50 rounded-lg px-4 py-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Total transaction</p>
                    <p className="font-semibold text-gray-800">{fmt(order.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-amber-600">Commission</p>
                    <p className="font-semibold text-amber-700">{fmt(commission)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">
                      {user?.role === 'SELLER' ? 'Vous recevez' : 'Vendeur reçoit'}
                    </p>
                    <p className="font-semibold text-green-700">{fmt(sellerAmount)}</p>
                  </div>
                </div>

                {/* Escrow status */}
                {order.escrow && (
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <span>Escrow :</span>
                    <span className={`font-medium ${
                      order.escrow.status === 'RELEASED' ? 'text-green-600' :
                      order.escrow.status === 'REFUNDED' ? 'text-red-500' :
                      'text-yellow-600'
                    }`}>
                      {order.escrow.status === 'HELD'     ? '🔒 Fonds bloqués' :
                       order.escrow.status === 'RELEASED' ? '✅ Paiement libéré' :
                       order.escrow.status === 'REFUNDED' ? '↩️ Remboursé' : order.escrow.status}
                    </span>
                  </div>
                )}

                {/* Actions — Flux de validation */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  {/* Étape 1 : Vendeur accepte ou refuse */}
                  {order.status === 'PENDING' && order.sellerId === user?.id && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">⏳ En attente de votre validation :</p>
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(order.id, 'CONFIRMED')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium">
                          ✅ Accepter la commande
                        </button>
                        <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                          ❌ Refuser
                        </button>
                      </div>
                    </div>
                  )}
                  {order.status === 'PENDING' && order.buyerId === user?.id && (
                    <div>
                      <p className="text-sm text-amber-700 flex items-center gap-2 mb-2">⏳ En attente de confirmation du vendeur...</p>
                      <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                        ❌ Annuler ma commande
                      </button>
                    </div>
                  )}

                  {/* Étape 2 : Vendeur expédie */}
                  {order.status === 'CONFIRMED' && order.sellerId === user?.id && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">📦 Commande confirmée. Préparez le colis :</p>
                      <button onClick={() => updateStatus(order.id, 'SHIPPED')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 font-medium">
                        🚛 Colis expédié
                      </button>
                    </div>
                  )}
                  {order.status === 'CONFIRMED' && order.buyerId === user?.id && (
                    <p className="text-sm text-blue-700 flex items-center gap-2">✅ Commande confirmée par le vendeur. Préparation en cours...</p>
                  )}

                  {/* Étape 3 : Acheteur confirme réception */}
                  {order.status === 'SHIPPED' && order.buyerId === user?.id && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">🚛 Votre commande est en route. Avez-vous reçu ?</p>
                      <button onClick={() => updateStatus(order.id, 'DELIVERED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium">
                        ✅ J'ai bien reçu ma commande
                      </button>
                    </div>
                  )}
                  {order.status === 'SHIPPED' && order.sellerId === user?.id && (
                    <p className="text-sm text-purple-700 flex items-center gap-2">🚛 Colis expédié. En attente de confirmation de l'acheteur...</p>
                  )}

                  {/* Étape 4 : Livré + Avis */}
                  {order.status === 'DELIVERED' && (
                    <div>
                      <p className="text-sm text-green-700 font-medium flex items-center gap-2 mb-3">🎉 Commande livrée avec succès ! Paiement libéré au vendeur.</p>
                      <ReviewForm orderId={order.id} sellerId={order.sellerId} buyerId={order.buyerId} userId={user?.id} />
                    </div>
                  )}

                  {/* Annulée */}
                  {order.status === 'CANCELLED' && (
                    <p className="text-sm text-red-600 flex items-center gap-2">❌ Commande annulée.</p>
                  )}
                </div>

                {/* Livraison — masquer quand la commande est livrée */}
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  order.delivery ? (
                    <Link href={`/dashboard/orders/${order.id}/delivery`}
                      className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition w-fit">
                      <Truck className="w-4 h-4" />
                      Suivi livraison — {order.delivery.status === 'IN_TRANSIT' ? '🚛 En transit' : '📋 ' + order.delivery.status}
                    </Link>
                  ) : (
                    order.buyerId === user?.id && (
                      <Link href={`/dashboard/orders/${order.id}/delivery`}
                        className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition w-fit">
                        <Truck className="w-4 h-4" />
                        Commander une livraison
                      </Link>
                    )
                  )
                )}

                {/* Paiement échelonné (entreprises uniquement) */}
                {user?.role === 'BUYER' && user?.accountType === 'COMPANY' && order.status !== 'CANCELLED' && (
                  <InstallmentButton orderId={order.id} totalPrice={order.totalPrice} onCreated={load} />
                )}
              </div>
            );
          })}
          {orders.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune commande</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composant bouton paiement échelonné ──────────────────────────────────────
function InstallmentButton({ orderId, totalPrice, onCreated }: { orderId: string; totalPrice: number; onCreated: () => void }) {
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);

  const createPlan = async (installments: number) => {
    setLoading(true);
    try {
      await installmentsApi.create(orderId, installments);
      toast.success(`Plan de paiement en ${installments} tranches créé !`);
      setShowOptions(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (!showOptions) {
    return (
      <button
        onClick={() => setShowOptions(true)}
        className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm hover:bg-amber-100 transition w-fit"
      >
        <CreditCard className="w-4 h-4" />
        Payer en plusieurs fois
      </button>
    );
  }

  return (
    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="font-semibold text-amber-800 text-sm mb-3">💳 Choisir le mode de paiement échelonné</p>
      <div className="space-y-2">
        <button
          onClick={() => createPlan(2)}
          disabled={loading}
          className="w-full text-left px-4 py-3 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition disabled:opacity-50"
        >
          <p className="font-medium text-gray-900 text-sm">Payer en 2 fois</p>
          <p className="text-xs text-gray-500 mt-0.5">
            1ère tranche : <span className="font-semibold">{fmt(Math.round(totalPrice * 0.6))}</span> (60% maintenant)
            — 2ème tranche : <span className="font-semibold">{fmt(Math.round(totalPrice * 0.4))}</span> (40% à la livraison)
          </p>
        </button>
        <button
          onClick={() => createPlan(3)}
          disabled={loading}
          className="w-full text-left px-4 py-3 bg-white border border-amber-200 rounded-lg hover:border-amber-400 transition disabled:opacity-50"
        >
          <p className="font-medium text-gray-900 text-sm">Payer en 3 fois</p>
          <p className="text-xs text-gray-500 mt-0.5">
            1ère : <span className="font-semibold">{fmt(Math.round(totalPrice * 0.5))}</span> (50%) 
            — 2ème : <span className="font-semibold">{fmt(Math.round(totalPrice * 0.25))}</span> (25% à l'expédition)
            — 3ème : <span className="font-semibold">{fmt(Math.round(totalPrice * 0.25))}</span> (25% à la livraison)
          </p>
        </button>
      </div>
      <button onClick={() => setShowOptions(false)} className="mt-2 text-xs text-gray-500 hover:text-gray-700">
        Annuler
      </button>
    </div>
  );
}

// ── Composant statut paiement échelonné ──────────────────────────────────────
function InstallmentStatus({ plan }: { plan: any }) {
  return (
    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="font-semibold text-amber-800 text-sm mb-2">
        💳 Paiement en {plan.installments} tranches
        {plan.status === 'COMPLETED' && <span className="ml-2 text-green-600">✅ Terminé</span>}
      </p>
      <div className="space-y-1.5">
        {plan.payments?.map((p: any, i: number) => (
          <div key={p.id || i} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{p.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{fmt(p.amount)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                p.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {p.status === 'SUCCESS' ? '✅ Payé' : '⏳ En attente'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Composant formulaire d'avis ──────────────────────────────────────────────
function ReviewForm({ orderId, sellerId, buyerId, userId }: { orderId: string; sellerId: string; buyerId: string; userId?: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Vérifier si un avis a déjà été donné
  useEffect(() => {
    reviewsApi.getOrderReviews(orderId).then(res => {
      const existing = res.data.find((r: any) => r.reviewerId === userId);
      if (existing) setSubmitted(true);
    }).catch(() => {}).finally(() => setChecking(false));
  }, [orderId, userId]);

  if (checking) return null;

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
        ⭐ Merci pour votre avis !
      </div>
    );
  }

  const targetId = userId === buyerId ? sellerId : buyerId;
  const targetLabel = userId === buyerId ? 'le vendeur' : 'l\'acheteur';
  const reviewType = userId === buyerId ? 'SELLER' : 'BUYER';

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Sélectionnez une note');
    setLoading(true);
    try {
      await reviewsApi.create({ orderId, targetId, rating, comment, type: reviewType });
      toast.success('Avis envoyé !');
      setSubmitted(true);
    } catch (err: any) {
      if (err.response?.data?.message?.includes('déjà noté')) {
        setSubmitted(true);
      } else {
        toast.error(err.response?.data?.message || 'Erreur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-2">
      <p className="text-sm font-medium text-gray-800 mb-2">⭐ Notez {targetLabel} :</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-2xl transition ${star <= rating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400`}
          >
            ★
          </button>
        ))}
        {rating > 0 && <span className="text-sm text-gray-500 ml-2 self-center">{rating}/5</span>}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Laissez un commentaire (optionnel)..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 resize-none"
        rows={2}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
      >
        {loading ? 'Envoi...' : 'Envoyer mon avis'}
      </button>
    </div>
  );
}
