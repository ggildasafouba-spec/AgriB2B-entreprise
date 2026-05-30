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
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-green-100 bg-white/90 overflow-hidden shadow-xl shadow-green-100">
            {/* Image hero */}
            <div className="relative h-64 md:h-80">
              <img
                src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=1200&h=400&fit=crop"
                alt="Agriculture africaine"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="inline-flex items-center gap-4 mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-green-600 text-white text-3xl shadow-lg">🌾</div>
                  <div className="text-left">
                    <p className="text-sm uppercase tracking-[0.3em] text-green-600 font-semibold">AgriB2B</p>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">La plateforme agricole B2B.</h1>
                  </div>
                </div>
                <p className="text-lg text-gray-700 max-w-3xl">
                  Connecter les producteurs, les acheteurs, les transporteurs et les solutions de paiement mobile en toute simplicité.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon="🛒"
            color="from-green-500 to-emerald-600"
            title="Commandes B2B"
            description="Passez et gérez vos commandes entre producteurs et acheteurs. Négociez les prix, suivez chaque étape."
            image="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=200&fit=crop"
          />
          <FeatureCard
            icon="📰"
            color="from-blue-500 to-indigo-600"
            title="Journal Agricole"
            description="Actualités du marché, prix des produits par région, conseils de saison et tendances agricoles au Cameroun."
            image="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=200&fit=crop"
          />
          <FeatureCard
            icon="🚛"
            color="from-orange-500 to-red-500"
            title="Transport & Livraison"
            description="Grilles tarifaires par destination. Suivi en temps réel. Express, Standard, Frigorifique."
            image="https://images.unsplash.com/photo-1591768793355-74d04bb6e2f0?w=400&h=200&fit=crop"
          />
          <FeatureCard
            icon="🔒"
            color="from-purple-500 to-violet-600"
            title="Paiement Escrow"
            description="Votre argent est sécurisé jusqu'à la livraison. Paiement Mobile Money (MTN, Orange)."
            image="https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&h=200&fit=crop"
          />
          <FeatureCard
            icon="📊"
            color="from-teal-500 to-cyan-600"
            title="Analytics & Commissions"
            description="Tableaux de bord détaillés. Suivi des commissions, revenus et performances."
            image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop"
          />
          <FeatureCard
            icon="🌍"
            color="from-yellow-500 to-amber-600"
            title="Adapté à l'Afrique"
            description="Calendrier des saisons camerounaises. Négociation de prix. Paiement Mobile Money."
            image="https://images.unsplash.com/photo-1580748142473-f6cf861a8cfe?w=400&h=200&fit=crop"
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

function FeatureCard({ icon, color, title, description, image }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-60`} />
        <div className="absolute bottom-3 left-4">
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
