'use client';
import { useAuth } from '../lib/auth-context';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Shield, Truck, MapPin, Users, Star, ArrowRight, CheckCircle } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const [countDown, setCountDown] = useState({ h: 0, m: 0, s: 0 });

  // Countdown animation (promo timer)
  useEffect(() => {
    const end = new Date();
    end.setHours(end.getHours() + 72);
    const timer = setInterval(() => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) { clearInterval(timer); return; }
      setCountDown({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ Navbar ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-10 h-10 rounded-full" />
            <span className="text-xl font-bold text-green-700">AgriB2B</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/journal" className="hover:text-green-700 transition">Journal</Link>
            <Link href="/dashboard/equipment" className="hover:text-green-700 transition">Matériel</Link>
            <Link href="/dashboard/classifieds" className="hover:text-green-700 transition">Annonces</Link>
          </div>
          <div className="flex gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                  Mon espace
                </Link>
                <button onClick={logout} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                  S&apos;inscrire gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ Hero animé ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-800 to-emerald-900 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-green-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Floating particles */}
          <div className="absolute top-20 right-20 w-3 h-3 bg-green-300/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-40 right-40 w-2 h-2 bg-emerald-300/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-32 left-32 w-4 h-4 bg-green-200/30 rounded-full animate-bounce" style={{ animationDelay: '2.5s' }} />
          <div className="absolute top-16 left-1/3 w-2 h-2 bg-white/20 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span>🔥 Nouvelles annonces publiées chaque jour — Rejoignez-nous !</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
              Le marché agricole B2B,<br />
              <span className="text-green-300">au meilleur prix.</span>
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-8 max-w-2xl leading-relaxed">
              La 1ère plateforme qui connecte producteurs, acheteurs et transporteurs au Cameroun. Paiement sécurisé. Livraison suivie. 100% Mobile Money.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="group px-8 py-4 bg-white text-green-800 rounded-xl font-bold text-lg hover:bg-green-50 transition-all shadow-lg hover:shadow-2xl hover:scale-105">
                Commencer gratuitement
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/dashboard/products" className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl font-medium text-lg hover:bg-white/20 transition-all hover:scale-105">
                Voir les produits
              </Link>
            </div>
          </div>

          {/* Stats animées avec compteur */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-xl">
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-4xl font-bold text-white">100+</p>
              <p className="text-sm text-green-200 mt-1">Utilisateurs actifs</p>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-4xl font-bold text-white">50+</p>
              <p className="text-sm text-green-200 mt-1">Produits en ligne</p>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-4xl font-bold text-white">10</p>
              <p className="text-sm text-green-200 mt-1">Régions couvertes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Bandeau confiance ═══ */}
      <section className="border-b bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Paiement sécurisé</p>
              <p className="text-xs text-gray-500">Escrow Mobile Money</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Vendeurs vérifiés</p>
              <p className="text-xs text-gray-500">KYC contrôlé</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Livraison suivie</p>
              <p className="text-xs text-gray-500">Temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Proximité</p>
              <p className="text-xs text-gray-500">Produits par région</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Catégories ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Explorer par catégorie</h2>
          <Link href="/dashboard/products" className="text-green-600 font-medium text-sm hover:underline flex items-center gap-1">
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🌾', label: 'Produits agricoles', count: '27 annonces', href: '/dashboard/products', color: 'bg-green-50 border-green-200 hover:border-green-400' },
            { icon: '🚜', label: 'Matériel agricole', count: 'Nouveau !', href: '/dashboard/equipment', color: 'bg-amber-50 border-amber-200 hover:border-amber-400' },
            { icon: '📋', label: 'Annonces & Emplois', count: 'Nouveau !', href: '/dashboard/classifieds', color: 'bg-rose-50 border-rose-200 hover:border-rose-400' },
            { icon: '🚛', label: 'Transport', count: 'Tarifs dispo', href: '/dashboard/transport', color: 'bg-orange-50 border-orange-200 hover:border-orange-400' },
          ].map(cat => (
            <Link key={cat.label} href={cat.href}
              className={`${cat.color} border-2 rounded-2xl p-5 text-center hover:shadow-lg transition-all duration-200 group`}>
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
              <p className="font-semibold text-gray-800 text-sm">{cat.label}</p>
              <p className="text-xs text-gray-500 mt-1">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ Fonctionnalités principales ═══ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Tout ce dont vous avez besoin</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🛒" color="from-green-500 to-emerald-600"
              title="Commandes B2B"
              description="Passez et gérez vos commandes. Négociez les prix, suivez chaque étape."
              image="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=200&fit=crop"
            />
            <FeatureCard
              icon="🔒" color="from-purple-500 to-violet-600"
              title="Paiement Escrow"
              description="Argent sécurisé jusqu'à la livraison. MTN MoMo & Orange Money."
              image="https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=400&h=200&fit=crop"
            />
            <FeatureCard
              icon="🚛" color="from-orange-500 to-red-500"
              title="Transport & Livraison"
              description="Suivi en temps réel. Express, Standard, Frigorifique."
              image="https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400&h=200&fit=crop"
            />
            <FeatureCard
              icon="🚜" color="from-amber-600 to-yellow-700"
              title="Matériel Agricole"
              description="Tracteurs, motopompes, engrais, semences entre professionnels."
              image="https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400&h=200&fit=crop"
              href="/dashboard/equipment"
            />
            <FeatureCard
              icon="📋" color="from-pink-500 to-rose-600"
              title="Annonces & Emplois"
              description="Offres d'emploi, formations, terrains, services agricoles."
              image="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=200&fit=crop"
              href="/dashboard/classifieds"
            />
            <FeatureCard
              icon="📰" color="from-blue-500 to-indigo-600"
              title="Journal Agricole"
              description="Actualités, prix du marché, conseils de saison."
              image="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&h=200&fit=crop"
              href="/journal"
            />
          </div>
        </div>
      </section>

      {/* ═══ Comment ça marche ═══ */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Inscrivez-vous', desc: 'Créez votre compte gratuit en 2 minutes. Particulier ou entreprise.', icon: '📝' },
            { step: '2', title: 'Publiez ou commandez', desc: 'Vendez vos produits ou achetez directement aux producteurs.', icon: '🛒' },
            { step: '3', title: 'Payez & recevez', desc: 'Paiement sécurisé Mobile Money. Livraison suivie en temps réel.', icon: '✅' },
          ].map(s => (
            <div key={s.step} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <div className="w-8 h-8 mx-auto -mt-2 mb-3 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {s.step}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA final ═══ */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à rejoindre le marché ?</h2>
          <p className="text-lg text-green-100 mb-8">
            Inscription gratuite. Commencez à vendre ou acheter dès aujourd&apos;hui.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="px-8 py-4 bg-white text-green-800 rounded-xl font-bold text-lg hover:bg-green-50 transition shadow-lg">
              Créer mon compte gratuit
            </Link>
            <Link href="/dashboard" className="px-8 py-4 bg-white/10 border border-white/30 rounded-xl font-medium text-lg hover:bg-white/20 transition">
              Explorer le marché →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/icons/android-chrome-192x192.png" alt="AgriB2B" className="w-8 h-8 rounded-full" />
                <span className="text-white font-bold">AgriB2B</span>
              </div>
              <p className="text-sm">La terre produit, AgriB2B distribue.</p>
              <p className="text-sm mt-2">Plateforme B2B agricole pour l&apos;Afrique.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Explorer</h4>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard/products" className="block hover:text-white">Produits agricoles</Link>
                <Link href="/dashboard/equipment" className="block hover:text-white">Matériel agricole</Link>
                <Link href="/dashboard/classifieds" className="block hover:text-white">Annonces & Emplois</Link>
                <Link href="/journal" className="block hover:text-white">Journal agricole</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Légal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/cgu" className="block hover:text-white">Conditions d&apos;utilisation</Link>
                <Link href="/privacy" className="block hover:text-white">Politique de confidentialité</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm">
                <a href="mailto:contact.mboamarket@gmail.com" className="block hover:text-white">contact.mboamarket@gmail.com</a>
                <p>Cameroun 🇨🇲</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 AgriB2B — Tous droits réservés.</p>
            <p className="text-xs">Développé par Germain AFOUBA & André Brice VOUNDI ESSAMA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, color, title, description, image, href }: any) {
  const Wrapper = href ? Link : 'div';
  const props: any = href ? { href } : {};
  return (
    <Wrapper {...props} className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="relative h-40 overflow-hidden">
        <img src={image} alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-60`} />
        <div className="absolute bottom-3 left-4">
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        {href && (
          <span className="inline-flex items-center gap-1 mt-3 text-green-600 text-sm font-medium group-hover:gap-2 transition-all">
            Découvrir <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </div>
    </Wrapper>
  );
}
