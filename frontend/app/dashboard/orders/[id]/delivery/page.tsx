'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { deliveryApi, transportApi, ordersApi } from '../../../../../lib/api';
import { useAuth } from '../../../../../lib/auth-context';
import toast from 'react-hot-toast';
import { Truck, Package, MapPin, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'En attente', icon: '📋' },
  { key: 'ACCEPTED', label: 'Acceptée', icon: '✅' },
  { key: 'PICKED_UP', label: 'Récupéré', icon: '📦' },
  { key: 'IN_TRANSIT', label: 'En transit', icon: '🚛' },
  { key: 'ARRIVED_CITY', label: 'Arrivé en ville', icon: '🏙️' },
  { key: 'OUT_FOR_DELIVERY', label: 'En livraison', icon: '🏃' },
  { key: 'DELIVERED', label: 'Livré', icon: '🎉' },
];

const SERVICE_LABELS: any = {
  EXPRESS: { name: 'Express', icon: '⚡', color: 'text-orange-600 bg-orange-50' },
  STANDARD: { name: 'Standard', icon: '🚛', color: 'text-blue-600 bg-blue-50' },
  ECONOMIQUE: { name: 'Économique', icon: '💰', color: 'text-green-600 bg-green-50' },
  FRIGORIFIQUE: { name: 'Frigorifique', icon: '❄️', color: 'text-cyan-600 bg-cyan-50' },
};

export default function DeliveryTrackingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTracking();
    const interval = setInterval(loadTracking, 10000); // Refresh toutes les 10s
    return () => clearInterval(interval);
  }, [id]);

  const loadTracking = async () => {
    try {
      const res = await deliveryApi.getTracking(id as string);
      setDelivery(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setDelivery(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!delivery) return;
    setUpdating(true);
    try {
      await deliveryApi.updateStatus(delivery.id, { status });
      toast.success('Statut mis à jour');
      loadTracking();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement du suivi...</div>;

  if (!delivery) {
    return <CreateDeliveryForm orderId={id as string} onCreated={loadTracking} />;
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === delivery.status);
  const service = SERVICE_LABELS[delivery.serviceType] || SERVICE_LABELS.STANDARD;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour aux commandes
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-green-600" /> Suivi de livraison
            </h1>
            <p className="text-sm text-gray-500 mt-1">Commande #{(id as string).slice(0, 8)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${service.color}`}>
            {service.icon} {service.name}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-xs text-gray-400">Origine</p>
            <p className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-3 h-3" /> {delivery.origin}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Destination</p>
            <p className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-3 h-3" /> {delivery.destination}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Poids</p>
            <p className="font-medium text-gray-900">{delivery.weight} kg</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Coût livraison</p>
            <p className="font-medium text-green-700">{delivery.deliveryCost?.toLocaleString('fr-FR')} FCFA</p>
          </div>
        </div>

        {delivery.estimatedDate && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4" />
            Livraison estimée : {new Date(delivery.estimatedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        )}
      </div>

      {/* Timeline de suivi */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-6">Progression</h2>
        <div className="relative">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step.key} className="flex items-start gap-4 mb-6 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    isCompleted ? 'bg-green-100' : 'bg-gray-100'
                  } ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}>
                    {step.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 mt-1 ${isCompleted && i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pt-2">
                  <p className={`font-medium text-sm ${isCompleted ? 'text-green-700' : 'text-gray-400'}`}>
                    {step.label}
                    {isCurrent && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">En cours</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historique détaillé */}
      {delivery.trackingEvents && delivery.trackingEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Historique</h2>
          <div className="space-y-3">
            {delivery.trackingEvents.map((event: any) => (
              <div key={event.id} className="flex items-start gap-3 text-sm border-b last:border-0 pb-3">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-800">{event.description}</p>
                  {event.location && <p className="text-xs text-gray-400">📍 {event.location}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(event.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions transporteur */}
      {user?.role === 'TRANSPORTER' && delivery.status !== 'DELIVERED' && delivery.status !== 'FAILED' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Actions transporteur</h2>
          <div className="flex flex-wrap gap-2">
            {delivery.status === 'PENDING' && (
              <button onClick={() => updateStatus('ACCEPTED')} disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                ✅ Accepter la livraison
              </button>
            )}
            {delivery.status === 'ACCEPTED' && (
              <button onClick={() => updateStatus('PICKED_UP')} disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                📦 Colis récupéré
              </button>
            )}
            {delivery.status === 'PICKED_UP' && (
              <button onClick={() => updateStatus('IN_TRANSIT')} disabled={updating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm">
                🚛 En transit
              </button>
            )}
            {delivery.status === 'IN_TRANSIT' && (
              <button onClick={() => updateStatus('ARRIVED_CITY')} disabled={updating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
                🏙️ Arrivé en ville
              </button>
            )}
            {delivery.status === 'ARRIVED_CITY' && (
              <button onClick={() => updateStatus('OUT_FOR_DELIVERY')} disabled={updating}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm">
                🏃 En cours de livraison
              </button>
            )}
            {delivery.status === 'OUT_FOR_DELIVERY' && (
              <button onClick={() => updateStatus('DELIVERED')} disabled={updating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                🎉 Livré
              </button>
            )}
          </div>
        </div>
      )}

      {/* Infos destinataire */}
      <div className="bg-gray-50 rounded-xl p-4 mt-6 text-sm text-gray-600">
        <p className="font-medium text-gray-800 mb-1">Destinataire</p>
        <p>{delivery.recipientName} — {delivery.recipientPhone}</p>
        <p className="mt-1">{delivery.deliveryAddress}</p>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Formulaire de création de livraison
// ═══════════════════════════════════════════════════════════════════════════════

function CreateDeliveryForm({ orderId, onCreated }: { orderId: string; onCreated: () => void }) {
  const { user } = useAuth();
  const [rates, setRates] = useState<any[]>([]);
  const [serviceOptions, setServiceOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);

  const [form, setForm] = useState({
    transportRateId: '',
    weight: 10,
    serviceType: 'STANDARD',
    deliveryAddress: '',
    recipientName: user?.name || '',
    recipientPhone: '',
  });

  useEffect(() => {
    Promise.all([
      transportApi.getAllRates(),
      deliveryApi.getServiceOptions(),
    ]).then(([ratesRes, optionsRes]) => {
      setRates(ratesRes.data);
      setServiceOptions(optionsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // Calculer le coût quand les paramètres changent
  useEffect(() => {
    if (!form.transportRateId || !form.weight || !form.serviceType) {
      setEstimate(null);
      return;
    }
    deliveryApi.calculateCost({
      transportRateId: form.transportRateId,
      weight: form.weight,
      serviceType: form.serviceType,
    }).then(res => setEstimate(res.data)).catch(() => setEstimate(null));
  }, [form.transportRateId, form.weight, form.serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.transportRateId) return toast.error('Sélectionnez un transporteur');
    if (!form.deliveryAddress) return toast.error('Entrez l\'adresse de livraison');
    if (!form.recipientPhone) return toast.error('Entrez le téléphone du destinataire');

    setSubmitting(true);
    try {
      await deliveryApi.create({ orderId, ...form });
      toast.success('Livraison commandée avec succès !');
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement des options...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/dashboard/orders" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour aux commandes
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Truck className="w-6 h-6 text-green-600" /> Commander une livraison
        </h1>
        <p className="text-sm text-gray-500 mb-6">Commande #{orderId.slice(0, 8)}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Choix du service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Type de service</label>
            <div className="grid grid-cols-2 gap-3">
              {serviceOptions.map((opt: any) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setForm({ ...form, serviceType: opt.type })}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    form.serviceType === opt.type
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-lg mb-1">{opt.icon} {opt.name}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                  <p className="text-xs text-green-700 mt-1 font-medium">Idéal : {opt.ideal}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Choix du transporteur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transporteur et trajet</label>
            {rates.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun transporteur disponible</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rates.map((rate: any) => (
                  <button
                    key={rate.id}
                    type="button"
                    onClick={() => setForm({ ...form, transportRateId: rate.id })}
                    className={`w-full p-3 rounded-lg border-2 text-left flex justify-between items-center transition ${
                      form.transportRateId === rate.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{rate.origin} → {rate.destination}</p>
                      <p className="text-xs text-gray-500">
                        {rate.transporter?.name} • {rate.vehicleType || 'Standard'} • {rate.estimatedDays ? `${rate.estimatedDays}j` : ''}
                      </p>
                    </div>
                    <p className="font-bold text-green-700 text-sm">{rate.pricePerKg} FCFA/kg</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Poids */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids total (kg)</label>
            <input
              type="number"
              value={form.weight}
              onChange={e => setForm({ ...form, weight: +e.target.value })}
              min={1}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Adresse de livraison */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison</label>
            <input
              type="text"
              value={form.deliveryAddress}
              onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
              placeholder="Ex: Quartier Bastos, Yaoundé, près du carrefour..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Destinataire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du destinataire</label>
              <input
                type="text"
                value={form.recipientName}
                onChange={e => setForm({ ...form, recipientName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.recipientPhone}
                onChange={e => setForm({ ...form, recipientPhone: e.target.value })}
                placeholder="+237 6XX XXX XXX"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          {/* Estimation du coût */}
          {estimate && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-semibold text-green-800 mb-2">Estimation du coût</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Transport</p>
                  <p className="font-bold text-gray-900">{estimate.baseCost?.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-500">Commission (3%)</p>
                  <p className="font-bold text-gray-900">{estimate.commission?.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-500">Total livraison</p>
                  <p className="font-bold text-green-700 text-lg">{estimate.totalCost?.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
              {estimate.estimatedDays && (
                <p className="text-xs text-green-600 mt-2">⏱️ Délai estimé : {estimate.estimatedDays} jour(s)</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.transportRateId}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Création...' : `Commander la livraison${estimate ? ` — ${estimate.totalCost?.toLocaleString('fr-FR')} FCFA` : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}
