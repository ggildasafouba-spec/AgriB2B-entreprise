'use client';
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { User, Building2, ChevronRight, Mail, Phone, MapPin, ShieldCheck, Truck } from 'lucide-react';

const COUNTRIES = ['Cameroun', 'Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Tchad', 'Gabon', 'Congo', 'RDC', 'Autre'];
const REGIONS_CM = ['Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral', 'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'];

type Step = 'role' | 'info' | 'otp';

export default function RegisterPage() {
  const { register, verify } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [form, setForm] = useState({
    role: '',
    accountType: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'Cameroun',
    region: '',
    minOrderQty: 10,
    documentType: '',
    documentUrl: '',
    acceptCgu: false,
  });

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  // ── Étape 1 : choix rôle + type de compte ──────────────────────────────────
  const handleRoleSelect = (role: string, accountType: string) => {
    set('role', role);
    set('accountType', accountType);
    setStep('info');
  };

  // ── Étape 2 : soumission du formulaire ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas');
    }
    setLoading(true);
    try {
      const res = await register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        accountType: form.accountType,
        phone: form.phone,
        country: form.country,
        region: form.region,
        minOrderQty: form.role === 'SELLER' && form.accountType === 'INDIVIDUAL'
          ? Number(form.minOrderQty)
          : 1,
        documentType: form.accountType === 'COMPANY' ? form.documentType.trim() : undefined,
        documentUrl: form.accountType === 'COMPANY' ? form.documentUrl.trim() : undefined,
      });
      setPendingEmail(res.email);
      // Si le compte est auto-vérifié (pas de SMS configuré), rediriger directement
      if (res.verified && res.token) {
        toast.success('Compte créé avec succès ! Bienvenue sur AgriB2B 🌾');
        router.push('/dashboard');
        return;
      }
      // Sinon, afficher l'étape OTP
      if (res.devOtpCode) {
        const digits = res.devOtpCode.split('');
        setOtp(digits);
        setDevOtpCode(res.devOtpCode);
        toast.success(`Compte créé ! Code de vérification : ${res.devOtpCode}`);
      } else {
        toast.success('Compte créé ! Vérifiez votre email pour le code.');
      }
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 3 : vérification OTP ─────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Entrez les 6 chiffres');
    setLoading(true);
    try {
      await verify(pendingEmail, code);
      toast.success('Compte vérifié ! Bienvenue sur AgriB2B 🌾');
      router.push('/dashboard/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const { authApi } = await import('../../lib/api');
      const res = await authApi.resendCode(pendingEmail);
      // En mode dev, pré-remplir le code si l'API le retourne
      if (res.data?.devOtpCode) {
        const digits = res.data.devOtpCode.split('');
        setOtp(digits);
        setDevOtpCode(res.data.devOtpCode);
        toast.success(`Nouveau code : ${res.data.devOtpCode}`);
      } else {
        toast.success('Nouveau code envoyé');
      }
    } catch {
      toast.error('Erreur lors du renvoi');
    }
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-green-700 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold">🌾 AgriB2B</h1>
          <p className="text-green-200 text-sm mt-1">Créer votre compte professionnel</p>
          {/* Stepper */}
          <div className="flex items-center gap-2 mt-4">
            {(['role', 'info', 'otp'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  step === s ? 'bg-white text-green-700 border-white' :
                  ['role', 'info', 'otp'].indexOf(step) > i ? 'bg-green-500 border-green-500 text-white' :
                  'border-green-400 text-green-300'
                }`}>{i + 1}</div>
                {i < 2 && <div className={`h-0.5 w-8 ${['role', 'info', 'otp'].indexOf(step) > i ? 'bg-green-400' : 'bg-green-600'}`} />}
              </div>
            ))}
            <span className="ml-2 text-green-200 text-xs">
              {step === 'role' ? 'Type de compte' : step === 'info' ? 'Informations' : 'Vérification'}
            </span>
          </div>
        </div>

        <div className="p-8">

          {/* ── ÉTAPE 1 : Choix du rôle ── */}
          {step === 'role' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-6">Vous êtes :</h2>
              <div className="space-y-3">
                <RoleCard
                  icon={<User className="w-6 h-6" />}
                  title="Acheteur particulier"
                  desc="Vous achetez des produits agricoles pour usage personnel ou professionnel"
                  onClick={() => handleRoleSelect('BUYER', 'INDIVIDUAL')}
                />
                <RoleCard
                  icon={<Building2 className="w-6 h-6" />}
                  title="Acheteur entreprise"
                  desc="Société, coopérative ou organisation qui achète en volume"
                  onClick={() => handleRoleSelect('BUYER', 'COMPANY')}
                />
                <RoleCard
                  icon={<User className="w-6 h-6" />}
                  title="Producteur particulier"
                  desc="Agriculteur individuel — vente à partir de 10 unités minimum"
                  badge="Min. 10 unités"
                  onClick={() => handleRoleSelect('SELLER', 'INDIVIDUAL')}
                />
                <RoleCard
                  icon={<Building2 className="w-6 h-6" />}
                  title="Producteur entreprise"
                  desc="Entreprise agricole, coopérative ou exportateur — documents requis"
                  badge="Documents requis"
                  onClick={() => handleRoleSelect('SELLER', 'COMPANY')}
                />
                <RoleCard
                  icon={<Truck className="w-6 h-6" />}
                  title="Transporteur particulier"
                  desc="Vous proposez des services de transport de produits agricoles"
                  onClick={() => handleRoleSelect('TRANSPORTER', 'INDIVIDUAL')}
                />
                <RoleCard
                  icon={<Truck className="w-6 h-6" />}
                  title="Transporteur entreprise"
                  desc="Société de transport — documents requis"
                  badge="Documents requis"
                  onClick={() => handleRoleSelect('TRANSPORTER', 'COMPANY')}
                />
              </div>
              <p className="mt-6 text-center text-sm text-gray-500">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-green-600 hover:underline font-medium">Se connecter</Link>
              </p>
            </div>
          )}

          {/* ── ÉTAPE 2 : Formulaire ── */}
          {step === 'info' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <button type="button" onClick={() => setStep('role')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
                ← Retour
              </button>

              <div className="bg-green-50 rounded-lg px-4 py-2 text-sm text-green-700 font-medium">
                {form.role === 'BUYER' ? '🛒 Acheteur' : form.role === 'TRANSPORTER' ? '🚛 Transporteur' : '🌱 Producteur'} —{' '}
                {form.accountType === 'INDIVIDUAL' ? 'Particulier' : 'Entreprise'}
                {form.role === 'SELLER' && form.accountType === 'INDIVIDUAL' && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    Vente min. 10 unités
                  </span>
                )}
              </div>

              {/* Nom */}
              <Field label={form.accountType === 'COMPANY' ? "Raison sociale" : "Nom complet"} required>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className="input" placeholder={form.accountType === 'COMPANY' ? 'SARL AgroPlus' : 'Jean Dupont'} required />
              </Field>

              {/* Email */}
              <Field label="Adresse email" required>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className="input" placeholder="jean@example.com" required />
              </Field>

              {/* Téléphone */}
              <Field label="Numéro de téléphone" required>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className="input" placeholder="+237 6XX XXX XXX" required />
              </Field>

              {/* Pays + Région */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pays" required>
                  <select value={form.country} onChange={e => set('country', e.target.value)} className="input" required>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Région" required>
                  {form.country === 'Cameroun' ? (
                    <select value={form.region} onChange={e => set('region', e.target.value)} className="input" required>
                      <option value="">Choisir...</option>
                      {REGIONS_CM.map(r => <option key={r}>{r}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form.region} onChange={e => set('region', e.target.value)}
                      className="input" placeholder="Votre région" required />
                  )}
                </Field>
              </div>

              {/* Quantité minimale pour producteur particulier */}
              {form.role === 'SELLER' && form.accountType === 'INDIVIDUAL' && (
                <Field label="Quantité minimale de commande (unités)" required>
                  <input type="number" value={form.minOrderQty} min={10}
                    onChange={e => set('minOrderQty', parseInt(e.target.value))}
                    className="input" required />
                  <p className="text-xs text-gray-400 mt-1">Minimum 10 unités pour les particuliers</p>
                </Field>
              )}

              {/* Documents entreprise */}
              {/* Mot de passe */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mot de passe" required>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    className="input" minLength={6} required />
                </Field>
                <Field label="Confirmer" required>
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                    className="input" required />
                </Field>
              </div>

              {/* CGU */}
              <div className="flex items-start gap-3 mt-4 bg-gray-50 rounded-lg p-3">
                <input
                  type="checkbox"
                  id="cgu"
                  checked={form.acceptCgu || false}
                  onChange={e => set('acceptCgu', e.target.checked)}
                  className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  required
                />
                <label htmlFor="cgu" className="text-xs text-gray-600 leading-relaxed">
                  J'ai lu et j'accepte les{' '}
                  <a href="/cgu" target="_blank" className="text-green-600 hover:underline font-medium">
                    Conditions Générales d'Utilisation
                  </a>
                  , notamment le fait que la gestion des stocks est déclarative et que la plateforme n'est pas responsable de la disponibilité réelle des produits.
                </label>
              </div>

              <button type="submit" disabled={loading || !form.acceptCgu}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 mt-2">
                {loading ? 'Création du compte...' : 'Créer mon compte →'}
              </button>
            </form>
          )}

          {/* ── ÉTAPE 3 : OTP ── */}
          {step === 'otp' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
              <p className="text-gray-500 text-sm mb-1">
                Un code à 6 chiffres a été envoyé à
              </p>
              <p className="font-semibold text-gray-800 mb-6">{pendingEmail}</p>

              {/* Champs OTP */}
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.join('').length !== 6}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 mb-4"
              >
                {loading ? 'Vérification...' : 'Confirmer mon compte'}
              </button>

              <p className="text-sm text-gray-500">
                Vous n'avez pas reçu le code ?{' '}
                <button onClick={handleResend} className="text-green-600 hover:underline font-medium">
                  Renvoyer
                </button>
              </p>
              <p className="text-xs text-gray-400 mt-2">Le code expire dans 15 minutes</p>

              {/* Aide dev : affiche le code OTP directement */}
              {devOtpCode ? (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  <p className="font-semibold mb-1">🔧 Mode développement</p>
                  <p>Code OTP : <span className="font-mono font-bold text-lg tracking-widest">{devOtpCode}</span></p>
                  <p className="text-xs text-green-600 mt-1">Ce code est affiché car aucun service email n'est configuré.</p>
                </div>
              ) : (
                <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-400">
                  💡 En développement, le code apparaît dans les logs du backend
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function RoleCard({ icon, title, desc, badge, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition text-left group"
    >
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 group-hover:bg-green-200 flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900">{title}</p>
          {badge && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
    </button>
  );
}
