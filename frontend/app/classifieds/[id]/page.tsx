'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import api from '../../../lib/api';
import Link from 'next/link';
import { MapPin, Clock, Briefcase, Lock, Share2 } from 'lucide-react';

interface Classified {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  location: string;
  salary?: string;
  contactPhone?: string;
  contactEmail?: string;
  userName: string;
  kycVerified?: boolean;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  JOB_OFFER: '💼 Offre d\'emploi',
  JOB_SEARCH: '🔍 Recherche d\'emploi',
  SERVICE: '🛠️ Service proposé',
  PARTNERSHIP: '🤝 Partenariat',
  FORMATION: '🎓 Formation',
  FONCIER: '🏞️ Foncier / Terrain',
  OTHER: '📌 Autre annonce',
};

export default function ClassifiedPublicPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [item, setItem] = useState<Classified | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/classifieds/${id}`)
      .then(r => setItem(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item?.title || 'Annonce AgriB2B',
        text: `${TYPE_LABELS[item?.type || '']} — ${item?.title}\n📍 ${item?.location}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-700 font-semibold">Annonce introuvable</p>
          <Link href="/" className="text-green-600 hover:underline mt-2 block">Retour à l&apos;accueil</Link>
        </div>
      </div>
    );
  }

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-8 h-8 rounded-full" />
            <span className="text-lg font-bold text-green-700">AgriB2B</span>
          </Link>
          <div className="flex gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard/classifieds" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Toutes les annonces
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Connexion</Link>
                <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                {TYPE_LABELS[item.type] || item.type}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{item.category}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{item.title}</h1>
          </div>

          {/* Info visible par tous */}
          <div className="px-6 py-5 border-b">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {item.location && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-green-600" /> {item.location}</span>
              )}
              {item.salary && (
                <span className="flex items-center gap-1">💰 {item.salary}</span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
              <span className="flex items-center gap-1">
                Par {item.userName}
                {item.kycVerified && <span className="text-green-600 ml-1">✅</span>}
              </span>
            </div>
          </div>

          {/* Description — masquée partiellement si non connecté */}
          <div className="px-6 py-5">
            {isLoggedIn ? (
              <>
                <h3 className="font-semibold text-gray-900 mb-3">Description complète</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>

                {/* Contact */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-green-800 mb-2">📞 Contact</h4>
                  {item.contactPhone && <p className="text-sm text-gray-700">Téléphone : <span className="font-medium">{item.contactPhone}</span></p>}
                  {item.contactEmail && <p className="text-sm text-gray-700">Email : <span className="font-medium">{item.contactEmail}</span></p>}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                {/* Aperçu flou */}
                <p className="text-gray-700 leading-relaxed">
                  {item.description.slice(0, 100)}...
                </p>
                <div className="relative mt-4">
                  <div className="blur-sm select-none pointer-events-none text-gray-500 text-sm leading-relaxed">
                    {item.description.slice(100, 300) || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.'}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                </div>

                {/* CTA inscription */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                  <Lock className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-900 text-lg mb-2">Inscrivez-vous pour voir l&apos;annonce complète</h4>
                  <p className="text-sm text-gray-600 mb-4">La description complète et les coordonnées de contact sont réservées aux membres.</p>
                  <div className="flex justify-center gap-3">
                    <Link href="/register" className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                      Créer un compte gratuit
                    </Link>
                    <Link href="/login" className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                      Se connecter
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bouton Partager */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
            <button onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Share2 className="w-4 h-4" />
              {copied ? 'Lien copié !' : 'Partager cette annonce'}
            </button>
            <Link href="/dashboard/classifieds" className="text-green-600 text-sm font-medium hover:underline">
              Voir toutes les annonces →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer léger */}
      <footer className="text-center py-6 text-sm text-gray-400">
        <p>AgriB2B — La terre produit, AgriB2B distribue</p>
        <p className="mt-1">www.mboamarket.africa</p>
      </footer>
    </div>
  );
}
