'use client';
import { useEffect, useState } from 'react';
import { kycApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function KycPage() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<any>(null);
  const [allKyc, setAllKyc] = useState<any[]>([]);
  const [form, setForm] = useState({ documentType: 'CNI', documentUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      kycApi.getAll()
        .then(res => setAllKyc(res.data))
        .finally(() => setLoading(false));
    } else {
      kycApi.getMe()
        .then(res => setKyc(res.data))
        .catch(() => setKyc(null))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await kycApi.submit(form.documentType, form.documentUrl);
      toast.success('KYC soumis avec succès');
      const res = await kycApi.getMe();
      setKyc(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleReview = async (id: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await kycApi.review(id, status);
      toast.success(`KYC ${status === 'VERIFIED' ? 'approuvé' : 'rejeté'}`);
      const res = await kycApi.getAll();
      setAllKyc(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'VERIFIED') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'REJECTED') return <XCircle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-yellow-600" />;
  };

  if (loading) return <p className="text-gray-500">Chargement...</p>;

  if (user?.role === 'ADMIN') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Vérifications KYC</h2>
        <div className="space-y-4">
          {allKyc.map(k => (
            <div key={k.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{k.user?.name} — {k.user?.email}</p>
                  <p className="text-sm text-gray-500">Type: {k.documentType}</p>
                  <p className="text-sm text-gray-500">URL: {k.documentUrl}</p>
                  <p className="text-xs text-gray-400">{new Date(k.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={k.status} />
                  <span className="text-sm font-medium">{k.status}</span>
                </div>
              </div>
              {k.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleReview(k.id, 'VERIFIED')} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                    Approuver
                  </button>
                  <button onClick={() => handleReview(k.id, 'REJECTED')} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
          {allKyc.length === 0 && <p className="text-center text-gray-500 py-12">Aucun KYC soumis</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Vérification d'identité (KYC)</h2>
      {kyc ? (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-lg">Statut KYC</p>
              <p className="text-sm text-gray-500">Type: {kyc.documentType}</p>
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            kyc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
            kyc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {kyc.status === 'VERIFIED' ? '✓ Vérifié' : kyc.status === 'REJECTED' ? '✗ Rejeté' : '⏳ En attente de vérification'}
          </div>
          {kyc.status === 'REJECTED' && (
            <p className="mt-4 text-sm text-red-600">Votre KYC a été rejeté. Veuillez contacter le support.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 max-w-lg">
          <p className="text-gray-600 mb-6">
            Soumettez un document d'identité pour vérifier votre compte et accéder à toutes les fonctionnalités.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
              <select
                value={form.documentType}
                onChange={e => setForm({ ...form, documentType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="CNI">Carte Nationale d'Identité</option>
                <option value="PASSPORT">Passeport</option>
                <option value="PERMIS">Permis de conduire</option>
                <option value="KBIS">Extrait Kbis</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL du document</label>
              <input
                type="url"
                value={form.documentUrl}
                onChange={e => setForm({ ...form, documentUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Hébergez votre document et collez l'URL ici</p>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Soumettre le KYC
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
