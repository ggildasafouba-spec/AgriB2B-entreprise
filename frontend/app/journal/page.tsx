'use client';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Calendar, MapPin, ExternalLink } from 'lucide-react';

const PRIX_DU_JOUR = [
  { produit: 'Cacao (CIF)', prix: '2 368', unite: 'FCFA/kg', tendance: 'down' },
  { produit: 'Cacao (FOB)', prix: '2 302', unite: 'FCFA/kg', tendance: 'down' },
  { produit: 'Cacao (Achat Douala)', prix: '1 550 - 1 600', unite: 'FCFA/kg', tendance: 'stable' },
  { produit: 'Café Robusta (CIF)', prix: '2 007', unite: 'FCFA/kg', tendance: 'up' },
  { produit: 'Café Robusta (FOB)', prix: '1 901', unite: 'FCFA/kg', tendance: 'up' },
  { produit: 'Café Robusta (Achat Moungo)', prix: '1 250 - 1 350', unite: 'FCFA/kg', tendance: 'stable' },
];

const ARTICLES = [
  {
    id: 1,
    titre: 'Chute des prix du cacao au Cameroun : les producteurs sous pression',
    resume: 'Les prix du cacao au Cameroun ont chuté de 75% depuis juin 2024, passant de 6 000 FCFA/kg à environ 1 550 FCFA/kg en mai 2026. Les producteurs font face à des stocks invendus et une baisse significative de leurs revenus.',
    date: '22 mai 2026',
    source: 'Business in Cameroon',
    lien: 'https://www.businessincameroon.com/agriculture/2605-16219-cameroon-farmgate-cocoa-prices-drop-cfa250-in-less-than-two-weeks',
    categorie: 'Cacao',
    image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=200&fit=crop',
  },
  {
    id: 2,
    titre: 'Le Cameroun modernise ses laboratoires cacao et café pour renforcer ses exportations',
    resume: 'Le Cameroun investit dans la modernisation de ses laboratoires de contrôle qualité pour le cacao et le café, afin de renforcer la fiabilité des certifications et la compétitivité de ses exportations sur le marché international.',
    date: '26 mai 2026',
    source: 'Business in Cameroon',
    lien: 'https://www.businessincameroon.com/public-management/2605-16222-cameroon-upgrades-cocoa-and-coffee-labs-to-strengthen-export-competitiveness',
    categorie: 'Exportation',
    image: 'https://images.unsplash.com/photo-1611070960720-61fe2fdc5f97?w=400&h=200&fit=crop',
  },
  {
    id: 3,
    titre: 'Les producteurs camerounais de cacao visent le marché chinois',
    resume: 'Grâce à la politique de tarif zéro de Pékin, les producteurs camerounais explorent le vaste marché chinois comme nouveau débouché pour leurs fèves de cacao, dans un contexte de surplus mondial et de stabilisation des prix.',
    date: '29 avril 2026',
    source: 'Xinhua',
    lien: 'https://english.news.cn/20260429/1eaddc03bd6943e0894296d214e45873/c.html',
    categorie: 'Commerce international',
    image: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=400&h=200&fit=crop',
  },
  {
    id: 4,
    titre: 'Reprise des cours du cacao : les prix remontent au-dessus de 1 500 FCFA/kg',
    resume: 'Après plusieurs semaines de baisse, les prix du cacao au Cameroun montrent des signes de reprise, remontant entre 1 550 et 1 650 FCFA/kg début mai 2026, selon les données du Système d\'Information des Filières (SIF) de l\'ONCC.',
    date: '9 mai 2026',
    source: 'Ecofin Agency',
    lien: 'http://www.ecofinagency.com/news-agriculture/0905-55418-cameroon-cocoa-prices-recover-to-nearly-3/kg-as-season-nears-end',
    categorie: 'Cacao',
    image: 'https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400&h=200&fit=crop',
  },
  {
    id: 5,
    titre: 'Saison 2025/2026 : bilan mitigé pour la filière cacao camerounaise',
    resume: 'La campagne cacaoyère 2025/2026 touche à sa fin avec des prix bien en dessous des attentes initiales (3 200 à 5 400 FCFA/kg projetés contre 1 300 à 1 450 FCFA/kg réalisés), impactant fortement les revenus des planteurs.',
    date: '17 avril 2026',
    source: 'News Minimalist',
    lien: 'https://www.newsminimalist.com/articles/cameroons-cocoa-prices-drop-below-expectations-for-the-202526-season-d4ae5ca6',
    categorie: 'Bilan',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=200&fit=crop',
  },
];

export default function JournalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-green-700">AgriB2B</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Connexion</Link>
            <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Inscription</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📰 Journal Agricole</h1>
          <p className="text-gray-500 mt-1">Actualités, prix du marché et tendances agricoles au Cameroun</p>
          <p className="text-xs text-gray-400 mt-1">Source : ONCC (Office National du Cacao et du Café) — oncc.cm</p>
        </div>

        {/* Prix du jour */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Prix du jour — 29 mai 2026
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRIX_DU_JOUR.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{p.produit}</p>
                <p className="text-lg font-bold text-gray-900">{p.prix}</p>
                <p className="text-xs text-gray-400">{p.unite}</p>
                <div className="mt-1">
                  {p.tendance === 'up' && <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />}
                  {p.tendance === 'down' && <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}
                  {p.tendance === 'stable' && <span className="text-xs text-gray-400">→ stable</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Articles */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dernières actualités</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARTICLES.map(article => (
            <a
              key={article.id}
              href={article.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.titre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {article.categorie}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-green-700 transition">
                  {article.titre}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{article.resume}</p>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{article.date}</span>
                  <span className="flex items-center gap-1">{article.source} <ExternalLink className="w-3 h-3" /></span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Lien ONCC */}
        <div className="mt-8 text-center">
          <a
            href="https://oncc.cm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
          >
            Voir tous les prix sur ONCC.cm <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
