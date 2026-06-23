'use client';
import { useEffect, useState } from 'react';
import { ordersApi, productsApi, deliveryApi, transportApi, installmentsApi, reviewsApi, invoicesApi, paymentsApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { ShoppingCart, Info, Truck, MapPin, CreditCard, Download, Edit2, Smartphone } from 'lucide-react';
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
  const [payModal, setPayModal] = useState<any>(null);
  const [payForm, setPayForm] = useState({ provider: 'MTN_MOMO', phone: '' });
  const [paying, setPaying] = useState(false);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<any>(null);

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
      await ordersApi.create({
        items: cart,
        deliveryOption: selectedDeliveryOption ? JSON.stringify(selectedDeliveryOption) : undefined,
      });
      toast.success('Commande passée avec succès');
      setCart([]);
      setSelectedDeliveryOption(null);
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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal) return;
    setPaying(true);
    try {
      const res = await paymentsApi.initiate(payModal.id, payForm.provider, payForm.phone);
      if (res.data.paymentUrl) {
        toast.success('Redirection vers la page de paiement...');
        window.location.href = res.data.paymentUrl;
        return;
      }
      toast.success(`✅ ${res.data.message}`);
      setPayModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de paiement');
    } finally {
      setPaying(false);
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

      {/* Formulaire nouvelle commande — layout 2 colonnes */}
      {showForm && (
        <div className="mb-6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

            {/* ── Colonne gauche : catalogue produits ── */}
            <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-900">Sélectionner des produits</h3>
                <span className="text-xs text-gray-400">{products.length} produit(s) disponible(s)</span>
              </div>
              <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto">
                {products.map(p => {
                  const inCart = cart.find(i => i.productId === p.id);
                  return (
                    <div key={p.id} className={`border-2 rounded-xl p-3 transition ${
                      inCart ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
                    }`}>
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                      )}
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-sm text-green-700 font-medium">{fmt(p.price)}/{p.unit}</p>
                      <p className="text-xs text-gray-400">Stock: {p.stock?.quantity ?? '—'} {p.unit}</p>
                      {p.minOrderQty > 1 && (
                        <p className="text-xs text-amber-600">Min: {p.minOrderQty} {p.unit}</p>
                      )}
                      {inCart ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCart(prev => prev.map(i =>
                                i.productId === p.id
                                  ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                                  : i
                              ))}
                              className="w-7 h-7 rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200 flex items-center justify-center text-base"
                            >−</button>
                            <span className="w-8 text-center text-sm font-semibold">{inCart.quantity}</span>
                            <button
                              onClick={() => addToCart(p.id)}
                              className="w-7 h-7 rounded-lg bg-green-100 text-green-700 font-bold hover:bg-green-200 flex items-center justify-center text-base"
                            >+</button>
                          </div>
                          <button
                            onClick={() => removeFromCart(p.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-1"
                          >✕ Retirer</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(p.id)}
                          className="mt-2 w-full px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                        >+ Ajouter</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Colonne droite : panier ── */}
            <div style={{ position: 'sticky', top: '1rem' }}>
              <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-green-600" /> Mon panier
                  </h3>
                  {cart.length > 0 && (
                    <span className="text-xs bg-green-600 text-white rounded-full px-2 py-0.5 font-semibold">
                      {cart.length} article{cart.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="px-5 py-10 text-center text-gray-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Panier vide</p>
                    <p className="text-xs mt-1">Ajoutez des produits depuis le catalogue</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {/* Articles du panier */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {cart.map(item => {
                        const p = products.find(x => x.id === item.productId);
                        return (
                          <div key={item.productId} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{p?.name}</p>
                              <p className="text-xs text-gray-400">{item.quantity} {p?.unit} × {fmt(p?.price || 0)}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-green-700 font-semibold text-xs whitespace-nowrap">
                                {fmt((p?.price || 0) * item.quantity)}
                              </span>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-400 hover:text-red-600 text-xs leading-none"
                              >✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Options de livraison */}
                    {(() => {
                      const firstProduct = products.find(x => x.id === cart[0]?.productId);
                      const deliveryOpts = (firstProduct?.deliveryOptions || []).map((o: string) => {
                        try { return JSON.parse(o); } catch { return null; }
                      }).filter(Boolean);
                      if (deliveryOpts.length === 0) return null;
                      return (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1.5">🚚 Livraison</p>
                          <div className="space-y-1.5">
                            <button type="button"
                              onClick={() => setSelectedDeliveryOption(null)}
                              className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition ${
                                !selectedDeliveryOption ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                              }`}>
                              🚫 Retrait sur place
                              <span className="float-right font-bold">Gratuit</span>
                            </button>
                            {deliveryOpts.map((opt: any, i: number) => (
                              <button key={i} type="button"
                                onClick={() => setSelectedDeliveryOption(opt)}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition ${
                                  selectedDeliveryOption?.label === opt.label ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}>
                                {opt.type === 'DOMICILE' ? '🏠' : '📍'} {opt.label}
                                <span className="float-right font-bold">{opt.price === 0 ? 'Gratuit' : `+${opt.price.toLocaleString('fr-FR')} FCFA`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Récapitulatif financier */}
                    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm border border-gray-100">
                      <div className="flex justify-between text-gray-500">
                        <span>Sous-total</span>
                        <span className="font-medium text-gray-700">{fmt(cartTotal)}</span>
                      </div>
                      {selectedDeliveryOption?.price > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Livraison</span>
                          <span className="font-medium text-gray-700">+{fmt(selectedDeliveryOption.price)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-green-700">{fmt(cartTotal + (selectedDeliveryOption?.price || 0))}</span>
                      </div>
                    </div>

                    {/* Bouton confirmer */}
                    <button
                      onClick={handleOrder}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 text-sm transition"
                    >
                      ✅ Confirmer — {fmt(cartTotal + (selectedDeliveryOption?.price || 0))}
                    </button>

                    {/* Vider le panier */}
                    <button
                      onClick={() => { setCart([]); setSelectedDeliveryOption(null); }}
                      className="w-full py-2 text-xs text-gray-400 hover:text-red-500 transition"
                    >
                      Vider le panier
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
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
                      {order.payment?.status === 'SUCCESS' ? (
                        <>
                          <p className="text-sm font-medium text-green-700 mb-2">✅ Commande payée ! Préparez le colis :</p>
                          <div className="flex gap-2">
                            <button onClick={() => updateStatus(order.id, 'CONFIRMED')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium">
                              ✅ Accepter et préparer
                            </button>
                            <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                              ❌ Refuser
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-amber-700 mb-2">⏳ En attente du paiement de l'acheteur...</p>
                          <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                            ❌ Refuser la commande
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {order.status === 'PENDING' && order.buyerId === user?.id && (
                    <div>
                      <p className="text-sm text-amber-700 flex items-center gap-2 mb-2">⏳ En attente de confirmation du vendeur...</p>
                      <div className="flex gap-2 flex-wrap">
                        {(!order.payment || order.payment.status !== 'SUCCESS') && (
                          <button
                            onClick={() => { setPayModal(order); setPayForm({ provider: 'MTN_MOMO', phone: (user as any)?.phone || '' }); }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            <Smartphone className="w-4 h-4" /> Payer maintenant
                          </button>
                        )}
                        {order.payment?.status === 'SUCCESS' && (
                          <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">✅ Payé</span>
                        )}
                        <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
                          ❌ Annuler ma commande
                        </button>
                        <Link href={`/dashboard/orders/${order.id}/edit`}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center gap-1">
                          <Edit2 className="w-3 h-3" /> Modifier
                        </Link>
                      </div>
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
                    <div>
                      <p className="text-sm text-blue-700 flex items-center gap-2 mb-2">✅ Commande confirmée par le vendeur.</p>
                      {(!order.payment || order.payment.status !== 'SUCCESS') && (
                        <button
                          onClick={() => { setPayModal(order); setPayForm({ provider: 'MTN_MOMO', phone: (user as any)?.phone || '' }); }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          <Smartphone className="w-4 h-4" /> Payer la commande
                        </button>
                      )}
                      {order.payment?.status === 'SUCCESS' && (
                        <p className="text-sm text-green-600 font-medium">✅ Paiement effectué</p>
                      )}
                    </div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-red-600 flex items-center gap-2">❌ Commande annulée.</p>
                      <button
                        onClick={async () => {
                          if (!confirm('Supprimer définitivement cette commande ?')) return;
                          try {
                            await ordersApi.delete(order.id);
                            toast.success('Commande supprimée');
                            load();
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Erreur');
                          }
                        }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
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
                      <DeliveryOptionsInline orderId={order.id} onDeliveryCreated={load} />
                    )
                  )
                )}

                {/* Paiement échelonné (entreprises uniquement) */}
                {user?.role === 'BUYER' && user?.accountType === 'COMPANY' && order.status !== 'CANCELLED' && (
                  <InstallmentButton orderId={order.id} totalPrice={order.totalPrice} onCreated={load} />
                )}

                {/* Télécharger facture ou bon de commande */}
                {order.status !== 'CANCELLED' && (() => {
                  const isInvoice = order.payment?.status === 'SUCCESS' && order.status !== 'PENDING';
                  return (
                    <button
                      onClick={async () => {
                        try {
                          const res = await invoicesApi.download(order.id);
                          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                          const a = document.createElement('a');
                          a.href = url;
                          const prefix = isInvoice ? 'facture' : 'bon-commande';
                          a.download = `${prefix}-AGM-${order.id.slice(0, 8).toUpperCase()}.pdf`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                          toast.success(isInvoice ? 'Facture téléchargée' : 'Bon de commande téléchargé');
                        } catch (err: any) {
                          if (err.response?.data instanceof Blob) {
                            const text = await err.response.data.text();
                            try { const j = JSON.parse(text); toast.error(j.message || 'Erreur PDF'); } catch { toast.error('Erreur lors du téléchargement'); }
                          } else {
                            toast.error(err.response?.data?.message || 'Erreur lors du téléchargement');
                          }
                        }
                      }}
                      className="mt-3 flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition w-fit"
                    >
                      <Download className="w-4 h-4" />
                      {isInvoice ? 'Télécharger la facture PDF' : 'Télécharger le bon de commande'}
                    </button>
                  );
                })()}
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

      {/* ── Modal paiement ── */}
      {payModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-1">💳 Paiement</h3>
            <p className="text-gray-500 text-sm mb-5">
              Commande #{payModal.id.slice(0, 8).toUpperCase()} — <span className="font-bold text-green-700">{fmt(payModal.totalPrice)}</span>
            </p>

            {/* Étape choix livraison — uniquement si pas de livraison choisie */}
            {!payModal.delivery && !payModal.deliveryCostIncluded && !payModal.deliveryOption?.includes('PICKUP') ? (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-orange-800 mb-1">📦 Comment souhaitez-vous recevoir votre commande ?</p>
                  <p className="text-xs text-orange-600">Choisissez avant de payer pour que le total soit complet.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await ordersApi.markAsPickup(payModal.id);
                      toast.success('Retrait sur place confirmé');
                      setPayModal(null);
                      load();
                      // Réouvrir le modal après rafraîchissement
                      setTimeout(() => {
                        const updated = orders.find((o: any) => o.id === payModal.id);
                        if (updated) {
                          setPayModal({ ...payModal, deliveryOption: JSON.stringify({ type: 'PICKUP' }) });
                        }
                      }, 500);
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Erreur');
                    }
                  }}
                  className="w-full text-left px-4 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Retrait sur place</p>
                      <p className="text-xs text-gray-500">Je viens chercher ma commande chez le vendeur</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => { setPayModal(null); }}
                  className="w-full text-left px-4 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚗</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Je veux une livraison</p>
                      <p className="text-xs text-gray-500">Choisissez une option de livraison sur la commande, puis revenez payer</p>
                    </div>
                  </div>
                </button>
                <button type="button" onClick={() => setPayModal(null)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
              </div>
            ) : (
              /* Étape paiement — livraison déjà choisie ou retrait confirmé */
              <form onSubmit={handlePay} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moyen de paiement</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'MTN_MOMO', label: 'MTN MoMo', logo: '🟡' },
                      { value: 'ORANGE_MONEY', label: 'Orange Money', logo: '🟠' },
                      { value: 'MANUAL', label: 'Virement', logo: '🏦' },
                    ].map(p => (
                      <button key={p.value} type="button"
                        onClick={() => setPayForm(f => ({ ...f, provider: p.value }))}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition ${
                          payForm.provider === p.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <span className="text-2xl">{p.logo}</span>
                        <span className="text-xs font-medium text-center">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {payForm.provider === 'MANUAL' ? 'Référence de virement' : 'Numéro Mobile Money'}
                  </label>
                  <input type="text" value={payForm.phone}
                    onChange={e => setPayForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder={payForm.provider === 'MANUAL' ? 'Référence ou numéro de reçu' : '+237 6XX XXX XXX'}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                    required />
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
                  {payModal.deliveryCostIncluded > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Produits</span>
                        <span className="font-medium text-gray-700">{fmt(payModal.totalPrice - payModal.deliveryCostIncluded)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Livraison (dont 3% frais service)</span>
                        <span className="font-medium text-gray-700">{fmt(payModal.deliveryCostIncluded)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="text-gray-700 font-semibold">Total à payer</span>
                        <span className="font-bold text-green-700">{fmt(payModal.totalPrice)}</span>
                      </div>
                    </>
                  )}
                  {!payModal.deliveryCostIncluded && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Montant à payer</span>
                      <span className="font-bold text-green-700">{fmt(payModal.totalPrice)}</span>
                    </div>
                  )}
                  {payModal.deliveryOption?.includes('PICKUP') && !payModal.deliveryCostIncluded && (
                    <p className="text-xs text-green-600 mt-1">🏪 Retrait sur place — pas de frais de livraison</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={paying}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
                    {paying ? 'Traitement...' : 'Confirmer le paiement'}
                  </button>
                  <button type="button" onClick={() => setPayModal(null)}
                    className="px-4 py-3 border rounded-xl hover:bg-gray-50">Annuler</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant options livraison inline ────────────────────────────────────────
const DELIVERY_TARIFFS = [
  { type: 'DOMICILE', label: '🏠 Livraison à domicile (moins de 10 km)', price: 500 },
  { type: 'DOMICILE', label: '🏠 Livraison à domicile (10-15 km)', price: 1000 },
  { type: 'DOMICILE', label: '🏠 Livraison à domicile (plus de 15 km)', price: 2000 },
  { type: 'POINT', label: '📍 Point relais / Point de rencontre', price: 300 },
];

function DeliveryOptionsInline({ orderId, onDeliveryCreated }: { orderId: string; onDeliveryCreated: () => void }) {
  const [showOptions, setShowOptions] = useState(false);
  const [mode, setMode] = useState<'tarif' | 'livreur'>('tarif');
  const [selected, setSelected] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [proposedPrice, setProposedPrice] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const estimatedPrice = distanceKm > 0 ? Math.max(Math.round(distanceKm * 100), 500) : 500;

  const handleSubmitTarif = async () => {
    if (!selected) return toast.error('Choisissez une option de livraison');
    if (!address) return toast.error('Indiquez l\'adresse de livraison');
    if (!phone) return toast.error('Indiquez le téléphone du destinataire');
    setSubmitting(true);
    try {
      await deliveryApi.createSimple({
        orderId,
        deliveryAddress: address,
        recipientPhone: phone,
        deliveryCost: selected.price,
        label: selected.label,
      });
      toast.success(`Livraison commandée — +${selected.price.toLocaleString('fr-FR')} FCFA`);
      setShowOptions(false);
      onDeliveryCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLivreur = async () => {
    if (!pickupAddress) return toast.error('Indiquez l\'adresse de récupération');
    if (!address) return toast.error('Indiquez l\'adresse de livraison');
    setSubmitting(true);
    try {
      await deliveryApi.createRequest({
        orderId,
        pickupAddress,
        deliveryAddress: address,
        distanceKm: distanceKm || undefined,
        proposedPrice: proposedPrice ? parseInt(proposedPrice) : undefined,
        description: description || undefined,
      });
      toast.success('Demande de livraison envoyée aux transporteurs !');
      setShowOptions(false);
      onDeliveryCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showOptions) {
    return (
      <div className="mt-3 flex gap-2 flex-wrap">
        <button onClick={() => { setShowOptions(true); setMode('tarif'); }}
          className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition">
          <Truck className="w-4 h-4" /> Options de livraison
        </button>
        <button onClick={() => { setShowOptions(true); setMode('livreur'); }}
          className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 transition">
          🚗 Demander un livreur
        </button>
        <Link href={`/dashboard/orders/${orderId}/delivery`}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition">
          <MapPin className="w-4 h-4" /> Transporteur longue distance
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
      {/* Tabs mode */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode('tarif')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${mode === 'tarif' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700'}`}>
          📦 Tarif fixe
        </button>
        <button onClick={() => setMode('livreur')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${mode === 'livreur' ? 'bg-orange-600 text-white' : 'bg-white text-orange-700'}`}>
          🚗 Demander un livreur
        </button>
      </div>

      {mode === 'tarif' && (
        <>
          <h4 className="font-semibold text-sm text-purple-800 mb-3">Choisissez un tarif de livraison</h4>
          <div className="space-y-2 mb-4">
            {DELIVERY_TARIFFS.map((opt, i) => (
              <button key={i} type="button" onClick={() => setSelected(opt)}
                className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm transition ${
                  selected === opt ? 'border-purple-500 bg-purple-100' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <span className="font-medium">{opt.label}</span>
                <span className="float-right font-bold text-green-700">{opt.price.toLocaleString('fr-FR')} FCFA</span>
              </button>
            ))}
          </div>
          {selected && (
            <div className="space-y-3">
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Adresse de livraison" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="Téléphone destinataire" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={handleSubmitTarif} disabled={submitting}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {submitting ? 'Commande...' : `Confirmer — +${selected.price.toLocaleString('fr-FR')} FCFA`}
                </button>
                <button onClick={() => setShowOptions(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Annuler</button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'livreur' && (
        <>
          <h4 className="font-semibold text-sm text-orange-800 mb-3">🚗 Demander un livreur (type Yango)</h4>
          <p className="text-xs text-gray-500 mb-3">Un transporteur inscrit sur la plateforme prendra en charge votre livraison</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Adresse de récupération (chez le vendeur)</label>
              <input type="text" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)}
                placeholder="Ex: Marché Mokolo, Yaoundé" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Adresse de livraison (chez vous)</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Ex: Quartier Bastos, Yaoundé" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Distance estimée (km) — optionnel</label>
              <input type="number" value={distanceKm || ''} onChange={e => setDistanceKm(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 8" min="0" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              {distanceKm > 0 && (
                <p className="text-xs text-green-600 mt-1">💡 Prix estimé : {estimatedPrice.toLocaleString('fr-FR')} FCFA (100 FCFA/km)</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Votre prix proposé (FCFA) — optionnel</label>
              <input type="number" value={proposedPrice} onChange={e => setProposedPrice(e.target.value)}
                placeholder={`Ex: ${estimatedPrice}`} min="0" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le prix estimé. Le transporteur peut négocier.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Description (optionnel)</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Colis fragile, 2 sacs de 10kg" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmitLivreur} disabled={submitting}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                {submitting ? 'Envoi...' : 'Publier la demande aux transporteurs'}
              </button>
              <button onClick={() => setShowOptions(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Annuler</button>
            </div>
          </div>
        </>
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
