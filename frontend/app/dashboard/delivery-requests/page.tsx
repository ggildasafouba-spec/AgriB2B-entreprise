'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { deliveryApi } from '../../../lib/api';
import toast from 'react-hot-toast';
import { MapPin, Clock, CheckCircle, Truck, RefreshCw } from 'lucide-react';

interface DeliveryRequest {
  id: string;
  orderId: string;
  buyerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  distanceKm?: number;
  estimatedPrice: number;
  proposedPrice?: number;
  description?: string;
  status: string;
  acceptedById?: string;
  acceptedPrice?: number;
  createdAt: string;
}

export default function DeliveryRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await deliveryApi.getOpenRequests();
      setRequests(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request: DeliveryRequest) => {
    setAcceptingId(request.id);
    try {
      const customPrice = customPrices[request.id];
      const price = customPrice ? parseFloat(customPrice) : undefined;
      await deliveryApi.acceptRequest(request.id, price);
      toast.success('Livraison acceptée ! L\'acheteur sera notifié.');
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setAcceptingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR') + ' FCFA';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-500">Chargement des demandes...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚗 Demandes de livraison</h1>
          <p className="text-gray-500 text-sm mt-1">
            Demandes disponibles que vous pouvez accepter
          </p>
        </div>
        <button
          onClick={loadRequests}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Aucune demande disponible</h3>
          <p className="text-gray-400 text-sm mt-2">
            Les nouvelles demandes apparaîtront ici. Vous recevrez aussi une notification.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div key={request.id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
              {/* En-tête */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{timeAgo(request.createdAt)}</span>
                </div>
                {request.distanceKm && (
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                    {request.distanceKm} km
                  </span>
                )}
              </div>

              {/* Trajet */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="w-0.5 h-8 bg-gray-200"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Enlèvement</p>
                    <p className="text-sm font-medium text-gray-800">{request.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Livraison</p>
                    <p className="text-sm font-medium text-gray-800">{request.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {request.description && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                  {request.description}
                </p>
              )}

              {/* Prix */}
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-orange-50 rounded-lg px-4 py-2">
                  <p className="text-xs text-orange-600">Prix proposé</p>
                  <p className="text-lg font-bold text-orange-700">
                    {formatPrice(request.proposedPrice || request.estimatedPrice)}
                  </p>
                </div>
                {request.proposedPrice && request.estimatedPrice !== request.proposedPrice && (
                  <div className="text-xs text-gray-400">
                    Estimé : {formatPrice(request.estimatedPrice)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Votre prix (optionnel)"
                    value={customPrices[request.id] || ''}
                    onChange={e => setCustomPrices(prev => ({ ...prev, [request.id]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    min="0"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Laissez vide pour accepter le prix proposé
                  </p>
                </div>
                <button
                  onClick={() => handleAccept(request)}
                  disabled={acceptingId === request.id}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {acceptingId === request.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Accepter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
