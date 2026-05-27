'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Truck } from 'lucide-react';

interface TransportRate {
  id: string;
  origin: string;
  destination: string;
  productCategory: string;
  pricePerKg: number;
  basePricePerKg: number;
  pricePerUnit?: number;
  basePricePerUnit?: number;
  minWeight: number;
  maxWeight?: number;
  vehicleType?: string;
  estimatedDays?: number;
  isActive: boolean;
  commissionRate?: number;
  commissionPercent?: number;
}

export default function TransportPage() {
  const { user } = useAuth();
  const [rates, setRates] = useState<TransportRate[]>([]);
  const [allRates, setAllRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    productCategory: '',
    pricePerKg: 0,
    pricePerUnit: 0,
    minWeight: 0,
    maxWeight: 0,
    vehicleType: '',
    estimatedDays: 0,
  });

  const isTransporter = user?.role === 'TRANSPORTER';

  useEffect(() => {
    loadRates();
  }, [user]);

  const loadRates = async () => {
    try {
      if (isTransporter) {
        const res = await api.get('/transport/my-rates');
        setRates(res.data);
      }
      const res = await api.get('/transport/rates');
      setAllRates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: any = { ...form };
      if (!data.pricePerUnit) delete data.pricePerUnit;
      if (!data.maxWeight) delete data.maxWeight;
      if (!data.vehicleType) delete data.vehicleType;
      if (!data.estimatedDays) delete data.estimatedDays;

      if (editingId) {
        await api.put(`/transport/rates/${editingId}`, data);
        toast.success('Tarif modifié');
      } else {
        await api.post('/transport/rates', data);
        toast.success('Tarif créé');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ origin: '', destination: '', productCategory: '', pricePerKg: 0, pricePerUnit: 0, minWeight: 0, maxWeight: 0, vehicleType: '', estimatedDays: 0 });
      loadRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (rate: TransportRate) => {
    setForm({
      origin: rate.origin,
      destination: rate.destination,
      productCategory: rate.productCategory,
      pricePerKg: rate.basePricePerKg,
      pricePerUnit: rate.basePricePerUnit || 0,
      minWeight: rate.minWeight,
      maxWeight: rate.maxWeight || 0,
      vehicleType: rate.vehicleType || '',
      estimatedDays: rate.estimatedDays || 0,
    });
    setEditingId(rate.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce tarif ?')) return;
    try {
      await api.delete(`/transport/rates/${id}`);
      toast.success('Tarif supprimé');
      loadRates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-green-600" /> Grilles Tarifaires Transport
          </h1>
          <p className="text-gray-500 mt-1">
            {isTransporter ? 'Gérez vos tarifs de transport par destination et catégorie de produit' : 'Consultez les tarifs des transporteurs disponibles'}
          </p>
        </div>
        {isTransporter && (
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> Nouveau tarif
          </button>
        )}
      </div>

      {/* Bandeau info commission transport */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Commission transport :</span> Une commission de 3% est incluse dans les prix affichés.
          {isTransporter && (
            <span className="block mt-1 text-blue-600">En tant que transporteur, vous recevez le prix de base (hors commission) pour chaque transaction.</span>
          )}
        </p>
      </div>

      {/* Formulaire de création/édition */}
      {showForm && isTransporter && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origine *</label>
            <input type="text" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} required
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Douala" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
            <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} required
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Yaoundé" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie produit *</label>
            <input type="text" value={form.productCategory} onChange={e => setForm({ ...form, productCategory: e.target.value })} required
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Légumes, Céréales" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix par kg (FCFA) * <span className="text-xs text-gray-400 font-normal">(votre prix, +3% sera ajouté)</span></label>
            <input type="number" value={form.pricePerKg} onChange={e => setForm({ ...form, pricePerKg: +e.target.value })} required min={0}
              className="w-full border rounded-lg px-3 py-2" />
            {form.pricePerKg > 0 && (
              <p className="text-xs text-green-600 mt-1">Prix affiché aux clients : {Math.round(form.pricePerKg * 1.03).toLocaleString('fr-FR')} FCFA/kg</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix par unité (FCFA) <span className="text-xs text-gray-400 font-normal">(+3% sera ajouté)</span></label>
            <input type="number" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: +e.target.value })} min={0}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids min (kg)</label>
            <input type="number" value={form.minWeight} onChange={e => setForm({ ...form, minWeight: +e.target.value })} min={0}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Poids max (kg)</label>
            <input type="number" value={form.maxWeight} onChange={e => setForm({ ...form, maxWeight: +e.target.value })} min={0}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
            <input type="text" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Camion 10T, Pick-up" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Délai estimé (jours)</label>
            <input type="number" value={form.estimatedDays} onChange={e => setForm({ ...form, estimatedDays: +e.target.value })} min={0}
              className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex gap-3">
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {editingId ? 'Modifier' : 'Créer le tarif'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Mes tarifs (transporteur) */}
      {isTransporter && rates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Mes tarifs</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left">Origine → Destination</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-right">Votre prix/kg</th>
                  <th className="px-4 py-3 text-right">Prix affiché (TTC)</th>
                  <th className="px-4 py-3 text-center">Véhicule</th>
                  <th className="px-4 py-3 text-center">Délai</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rates.map(rate => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{rate.origin} → {rate.destination}</td>
                    <td className="px-4 py-3">{rate.productCategory}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{rate.basePricePerKg.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{rate.pricePerKg.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-center">{rate.vehicleType || '—'}</td>
                    <td className="px-4 py-3 text-center">{rate.estimatedDays ? `${rate.estimatedDays}j` : '—'}</td>
                    <td className="px-4 py-3 text-center flex gap-2 justify-center">
                      <button onClick={() => handleEdit(rate)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(rate.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tous les tarifs (visible par tous) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Tarifs disponibles</h2>
        {allRates.length === 0 ? (
          <p className="text-gray-500 bg-white rounded-xl shadow p-6">Aucun tarif de transport disponible pour le moment.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allRates.map((rate: any) => (
              <div key={rate.id} className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{rate.productCategory}</span>
                  {rate.estimatedDays && <span className="text-xs text-gray-500">{rate.estimatedDays} jour(s)</span>}
                </div>
                <p className="font-semibold text-gray-900">{rate.origin} → {rate.destination}</p>
                <p className="text-2xl font-bold text-green-700 mt-2">{rate.pricePerKg.toLocaleString('fr-FR')} <span className="text-sm font-normal">FCFA/kg</span></p>
                <p className="text-xs text-gray-400 mt-0.5">Commission 3% incluse</p>
                {rate.vehicleType && <p className="text-sm text-gray-500 mt-1">🚛 {rate.vehicleType}</p>}
                {rate.transporter && <p className="text-xs text-gray-400 mt-2">Par {rate.transporter.name} — {rate.transporter.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
