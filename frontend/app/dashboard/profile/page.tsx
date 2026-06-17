'use client';
import { useState, useEffect, useRef } from 'react';
import { authApi, uploadApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Camera, Save, User, Building2, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    country: '',
    region: '',
    logo: '',
    minOrderQty: 1,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authApi.profile();
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        country: res.data.country || '',
        region: res.data.region || '',
        logo: res.data.logo || '',
        minOrderQty: res.data.minOrderQty || 1,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      setForm(prev => ({ ...prev, logo: res.data.url }));
      setMessage('Logo uploadé avec succès');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await authApi.updateProfile(form);
      setProfile(res.data);
      setMessage('Profil mis à jour avec succès !');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon Profil</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
        {/* Logo / Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {form.logo ? (
              <img
                src={form.logo}
                alt="Logo"
                className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-50">
                {profile?.accountType === 'COMPANY' ? (
                  <Building2 className="w-10 h-10 text-green-600" />
                ) : (
                  <User className="w-10 h-10 text-green-600" />
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-500">
            {profile?.accountType === 'COMPANY' ? 'Logo de l\'entreprise' : 'Photo de profil'} (JPEG, PNG, WebP — max 5 Mo)
          </p>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
            {profile?.role}
          </span>
          <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full font-medium">
            {profile?.accountType === 'COMPANY' ? 'Entreprise' : 'Particulier'}
          </span>
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
            profile?.kycStatus === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            KYC: {profile?.kycStatus}
          </span>
        </div>

        <hr />

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom / Raison sociale</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
            <input
              type="text"
              value={form.country}
              onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Région</label>
            <input
              type="text"
              value={form.region}
              onChange={e => setForm(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {(profile?.role === 'SELLER') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité min. de commande</label>
              <input
                type="number"
                min={1}
                value={form.minOrderQty}
                onChange={e => setForm(prev => ({ ...prev, minOrderQty: parseInt(e.target.value) || 1 }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Email (lecture seule) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-xl text-sm ${
            message.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Enregistrer les modifications
        </button>
      </form>
    </div>
  );
}
