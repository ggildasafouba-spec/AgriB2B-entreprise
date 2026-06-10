'use client';
import { useState } from 'react';
import { authApi } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Entrez votre email');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      toast.success('Code envoyé !');
      if (res.data.devOtpCode) setDevCode(res.data.devOtpCode);
      setStep('code');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) return toast.error('Entrez le code à 6 chiffres');
    if (newPassword.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères');
    if (newPassword !== confirmPassword) return toast.error('Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      await authApi.resetPassword(email, code, newPassword);
      toast.success('Mot de passe réinitialisé ! Connectez-vous.');
      setStep('done');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🔑 Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'email' && 'Entrez votre email pour recevoir un code de réinitialisation'}
            {step === 'code' && 'Entrez le code reçu et votre nouveau mot de passe'}
            {step === 'done' && 'Votre mot de passe a été réinitialisé'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="votre@email.com" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleReset} className="space-y-4">
            {devCode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                <p className="font-semibold">🔧 Code : <span className="font-mono text-lg">{devCode}</span></p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code à 6 chiffres</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="000000" maxLength={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Min. 6 caractères" minLength={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Confirmez" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-green-700 font-semibold">Mot de passe réinitialisé avec succès !</p>
            <p className="text-sm text-gray-500 mt-2">Redirection vers la connexion...</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-green-600 hover:underline">← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
