'use client';
import { useAuth } from '../lib/auth-context';
import Link from 'next/link';
import { ShoppingCart, Package, TrendingUp, Shield, Truck } from 'lucide-react';

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-green-600 text-white text-2xl shadow-lg">
        🌾
      </div>
      <div>
        <div className="text-lg font-bold text-green-700">AgriB2B</div>
        <div className="text-sm text-gray-500">La plateforme agricole B2B.</div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <BrandLogo />
          <div className="flex gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Dashboard
                </Link>
                <button onClick={logout} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-green-100 bg-white/90 py-12 px-8 shadow-xl shadow-green-100">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-green-600 text-white text-3xl shadow-lg">🌾</div>
              <div className="text-left">
                <p className="text-sm uppercase tracking-[0.3em] text-green-600 font-semibold">AgriB2B</p>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">La plateforme agricole B2B.</h1>
              </div>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Connecter les producteurs, les acheteurs, les transporteurs et les solutions de paiement mobile en toute simplicité.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
          <FeatureCard
            icon={<ShoppingCart className="w-8 h-8 text-green-600" />}
            title="Commandes B2B"
            description="Passez et gérez vos commandes en toute simplicité"
          />
          <FeatureCard
            icon={<Package className="w-8 h-8 text-green-600" />}
            title="Gestion Stock"
            description="Suivi en temps réel de vos inventaires"
          />
          <FeatureCard
            icon={<Truck className="w-8 h-8 text-green-600" />}
            title="Transport"
            description="Grilles tarifaires des transporteurs par destination"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-green-600" />}
            title="Paiement Escrow"
            description="Transactions sécurisées avec garantie"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-green-600" />}
            title="Analytics"
            description="Tableaux de bord et rapports détaillés"
          />
        </div>

        {user && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-lg text-gray-700">
              Bienvenue <span className="font-bold text-green-700">{user.name}</span> ({user.role})
            </p>
            <Link href="/dashboard" className="mt-4 inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Accéder au Dashboard →
            </Link>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 border-t pt-8">
          <p className="font-medium text-gray-700">AgriB2B — Plateforme Agricole B2B</p>
          <p className="mt-1">Développée par <span className="font-semibold">Germain AFOUBA</span>, Développeur Full Stack</p>
          <p>& <span className="font-semibold">André Brice VOUNDI ESSAMA</span>, Ingénieur Agronome</p>
          <p className="mt-2 text-gray-400">© 2026 AgriB2B. Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
