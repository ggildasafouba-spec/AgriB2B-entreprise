'use client';
import { useAuth } from '../lib/auth-context';
import Link from 'next/link';
import { ShoppingCart, Package, TrendingUp, Shield, Truck } from 'lucide-react';

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-12 h-12 rounded-full" />
      <div>
        <div className="text-lg font-bold text-green-700">AgriB2B</div>
        <div className="text-xs text-gray-500 font-semibold italic">&laquo; La terre produit, AgriB2B distribue &raquo;</div>
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
          <div className="mx-auto max-w-5xl rounded-[2rem] overflow-hidden shadow-xl shadow-green-100">
            <div className="bg-gradient-to-br from-green-600 to-green-800 p-12 md:p-16">
              <div className="inline-flex items-center gap-4 mb-6">
                <img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-16 h-16 rounded-full bg-white/20 shadow-lg" />
                <div className="text-left">
                  <p className="text-sm uppercase tracking-[0.3em] text-green-200 font-semibold">AgriB2B</p>
                  <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">La plateforme agricole B2B.</h1>
                </div>
              </div>
              <p className="text-xl text-green-100 font-bold italic mt-2">
                &laquo; La terre produit, AgriB2B distribue &raquo;
              </p>
              <p className="text-lg text-green-200 max-w-3xl mt-3">
                Connecter les producteurs, les acheteurs, les transporteurs et les solutions de paiement mobile en toute simplicité.
              </p>
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
            image="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&h=200&fit=crop"
            href="/journal"
          />
          <FeatureCard
            icon="🚛"
            color="from-orange-500 to-red-500"
            title="Transport & Livraison"
            description="Grilles tarifaires par destination. Suivi en temps réel. Express, Standard, Frigorifique."
            image="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=200&fit=crop"
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
            icon="🚜"
            color="from-amber-600 to-yellow-700"
            title="Matériel Agricole"
            description="Achetez et vendez du matériel agricole : tracteurs, motopompes, pulvérisateurs, semences, engrais."
            image="https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=400&h=200&fit=crop"
            href="/dashboard/equipment"
          />
          <FeatureCard
            icon="📋"
            color="from-pink-500 to-rose-600"
            title="Annonces & Emplois"
            description="Publiez et consultez des annonces : offres d'emploi agricole, services, partenariats, opportunités."
            image="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop"
            href="/dashboard/classifieds"
          />
          <FeatureCard
            icon="🌍"
            color="from-yellow-500 to-amber-600"
            title="Adapté à l'Afrique"
            description="Calendrier des saisons camerounaises. Négociation de prix. Paiement Mobile Money."
            image="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=200&fit=crop"
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
          <p className="mt-3">📧 <a href="mailto:contact.mboamarket@gmail.com" className="text-green-600 hover:underline">contact.mboamarket@gmail.com</a></p>
          <p className="mt-2 text-gray-400">© 2026 AgriB2B. Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, color, title, description, image, href }: any) {
  const Wrapper = href ? 'a' : 'div';
  const props = href ? { href, target: href.startsWith('http') ? '_blank' : undefined } : {};
  return (
    <Wrapper {...props} className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer relative">
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
        {href && (
          <span className="inline-block mt-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg group-hover:bg-green-700 transition">
            Cliquer ici →
          </span>
        )}
      </div>
    </Wrapper>
  );
}
