'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { journalApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import toast from 'react-hot-toast';

// Articles statiques (fallback si pas d'articles en BDD)
const STATIC_ARTICLES = [
  {
    id: 'static-1',
    title: 'Chute des prix du cacao au Cameroun : les producteurs sous pression',
    summary: 'Les prix du cacao au Cameroun ont chuté de 75% depuis juin 2024, passant de 6 000 FCFA/kg à environ 1 550 FCFA/kg en mai 2026.',
    category: 'Cacao',
    source: 'Business in Cameroon',
    sourceUrl: 'https://www.businessincameroon.com/agriculture/2605-16219-cameroon-farmgate-cocoa-prices-drop-cfa250-in-less-than-two-weeks',
    imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=200&fit=crop',
    createdAt: '2026-05-22',
  },
  {
    id: 'static-2',
    title: 'Le Cameroun modernise ses laboratoires cacao et café',
    summary: 'Le Cameroun investit dans la modernisation de ses laboratoires de contrôle qualité pour le cacao et le café, afin de renforcer la compétitivité de ses exportations.',
    category: 'Exportation',
    source: 'Business in Cameroon',
    sourceUrl: 'https://www.businessincameroon.com/public-management/2605-16222-cameroon-upgrades-cocoa-and-coffee-labs-to-strengthen-export-competitiveness',
    imageUrl: 'https://images.unsplash.com/photo-1611070960720-61fe2fdc5f97?w=400&h=200&fit=crop',
    createdAt: '2026-05-26',
  },
  {
    id: 'static-3',
    title: 'Les producteurs camerounais de cacao visent le marché chinois',
    summary: 'Grâce à la politique de tarif zéro de Pékin, les producteurs camerounais explorent le vaste marché chinois comme nouveau débouché.',
    category: 'Commerce international',
    source: 'Xinhua',
    sourceUrl: 'https://english.news.cn/20260429/1eaddc03bd6943e0894296d214e45873/c.html',
    imageUrl: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=400&h=200&fit=crop',
    createdAt: '2026-04-29',
  },
];

export default function JournalPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formulaire admin
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', category: '', source: '', sourceUrl: '', imageUrl: '' });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    Promise.all([
      journalApi.getPrices().catch(() => ({ data: { prices: [], lastUpdate: null } })),
      journalApi.getArticles().catch(() => ({ data: [] })),
    ]).then(([pricesRes, articlesRes]) => {
      setPrices(pricesRes.data.prices || []);
      setLastUpdate(pricesRes.data.lastUpdate);
      const dbArticles = articlesRes.data || [];
      setArticles(dbArticles.length > 0 ? dbArticles : STATIC_ARTICLES);
    }).finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await journalApi.refreshPrices();
      setPrices(res.data.prices || []);
      setLastUpdate(new Date().toISOString());
      toast.success('Prix mis à jour');
    } catch {
      toast.error('Erreur lors du rafraîchissement');
    } finally {
      setRefreshing(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.summary || !form.category) {
      toast.error('Titre, résumé et catégorie requis');
      return;
    }
    setPublishing(true);
    try {
      await journalApi.createArticle(form);
      toast.success('Article publié');
      setForm({ title: '', summary: '', category: '', source: '', sourceUrl: '', imageUrl: '' });
      setShowForm(false);
      const res = await journalApi.getArticles();
      if (res.data.length > 0) setArticles(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur de publication');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await journalApi.deleteArticle(id);
      toast.success('Article supprimé');
      setArticles(articles.filter(a => a.id !== id));
    } catch {
      toast.error('Erreur');
    }
  };

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
            {user ? (
              <Link href="/dashboard" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">Connexion</Link>
                <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">Inscription</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Titre */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📰 Journal Agricole</h1>
            <p className="text-gray-500 mt-1">Prix des matières premières et actualités agricoles</p>
            {lastUpdate && (
              <p className="text-xs text-gray-400 mt-1">
                Dernière mise à jour : {new Date(lastUpdate).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
          {user?.role === 'ADMIN' && (
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Rafraîchir prix
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                + Publier un article
              </button>
            </div>
          )}
        </div>

        {/* Formulaire admin */}
        {showForm && user?.role === 'ADMIN' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">📝 Publier un article</h2>
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="Titre de l'article" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2 text-sm" required>
                    <option value="">Choisir...</option>
                    <option value="Cacao">Cacao</option>
                    <option value="Café">Café</option>
                    <option value="Coton">Coton</option>
                    <option value="Huile de palme">Huile de palme</option>
                    <option value="Exportation">Exportation</option>
                    <option value="Commerce international">Commerce international</option>
                    <option value="Politique agricole">Politique agricole</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Résumé *</label>
                <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2 text-sm" rows={3} placeholder="Résumé de l'article..." required />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input type="text" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="Nom de la source" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lien source</label>
                  <input type="url" value={form.sourceUrl} onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image (URL)</label>
                  <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2 text-sm" placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={publishing}
                  className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {publishing ? 'Publication...' : 'Publier'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50">Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* Prix des matières premières */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Prix des matières premières agricoles
          </h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Chargement des prix...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {prices.map((p, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1 font-medium">{p.name}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof p.price === 'number' ? p.price.toLocaleString('fr-FR') : p.price}
                  </p>
                  <p className="text-xs text-gray-400">{p.unit}</p>
                  <div className="mt-2 flex items-center gap-1">
                    {p.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {p.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {p.trend === 'stable' && <span className="text-xs text-gray-400">→</span>}
                    <span className={`text-xs font-medium ${
                      p.trend === 'up' ? 'text-green-600' : p.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {p.change > 0 ? '+' : ''}{p.change}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1">{p.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Articles */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dernières actualités</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group relative">
              {user?.role === 'ADMIN' && !article.id.startsWith('static') && (
                <button
                  onClick={() => handleDelete(article.id)}
                  className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >×</button>
              )}
              <a href={article.sourceUrl || '#'} target="_blank" rel="noopener noreferrer">
                {article.imageUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img src={article.imageUrl} alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2 group-hover:text-green-700 transition">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{article.summary}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{new Date(article.createdAt).toLocaleDateString('fr-FR')}</span>
                    {article.source && (
                      <span className="flex items-center gap-1">{article.source} <ExternalLink className="w-3 h-3" /></span>
                    )}
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>

        {articles.length === 0 && !loading && (
          <p className="text-center text-gray-400 py-12">Aucun article pour le moment</p>
        )}
      </div>
    </div>
  );
}
