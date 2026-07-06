'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../lib/auth-context';
import api, { uploadApi } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, MapPin, Briefcase, Clock, Heart, Share2, FileText } from 'lucide-react';

interface Classified {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  location: string;
  salary?: string;
  contactPhone: string;
  contactEmail?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

const TYPES = [
  { value: 'JOB_OFFER', label: '💼 Offre d\'emploi' },
  { value: 'JOB_SEARCH', label: '🔍 Recherche d\'emploi' },
  { value: 'SERVICE', label: '🛠️ Service proposé' },
  { value: 'PARTNERSHIP', label: '🤝 Partenariat' },
  { value: 'FORMATION', label: '🎓 Formation' },
  { value: 'FONCIER', label: '🏞️ Foncier / Terrain' },
  { value: 'OTHER', label: '📌 Autre annonce' },
];

const CATEGORIES = [
  'Agriculture / Production',
  'Transport / Logistique',
  'Commerce / Vente',
  'Transformation alimentaire',
  'Maintenance / Mécanique',
  'Formation / Conseil',
  'Foncier / Terrain',
  'Autre',
];

export default function ClassifiedsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: '', description: '', type: 'JOB_OFFER', category: CATEGORIES[0],
    location: '', salary: '', contactPhone: '', contactEmail: '', documentUrl: '',
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/classifieds').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classifieds', {
        ...form,
        salary: form.salary || undefined,
        contactPhone: form.contactPhone || user?.phone || '',
        contactEmail: form.contactEmail || user?.email || '',
        location: form.location || user?.region || '',
        documentUrl: form.documentUrl || undefined,
      });
      toast.success('Annonce publiée !');
      setShowForm(false);
      setForm({ title: '', description: '', type: 'JOB_OFFER', category: CATEGORIES[0], location: '', salary: '', contactPhone: '', contactEmail: '', documentUrl: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      await api.delete(`/classifieds/${id}`);
      toast.success('Supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = items.filter(i => !filterType || i.type === filterType);

  const typeLabel = (type: string) => TYPES.find(t => t.value === type)?.label || type;
  const typeColor = (type: string) => {
    switch (type) {
      case 'JOB_OFFER': return 'bg-blue-100 text-blue-700';
      case 'JOB_SEARCH': return 'bg-green-100 text-green-700';
      case 'SERVICE': return 'bg-purple-100 text-purple-700';
      case 'PARTNERSHIP': return 'bg-orange-100 text-orange-700';
      case 'FORMATION': return 'bg-indigo-100 text-indigo-700';
      case 'FONCIER': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Annonces & Emplois</h1>
          <p className="text-gray-500 text-sm mt-1">Offres d&apos;emploi, services et opportunités dans le secteur agricole</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
          <Plus className="w-4 h-4" /> Publier une annonce
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Recherche ouvrier agricole à Bafoussam" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required
              className="w-full border rounded-lg px-3 py-2 h-24" placeholder="Décrivez l'offre, les compétences requises, les conditions..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d&apos;annonce *</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className="w-full border rounded-lg px-3 py-2">
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="w-full border rounded-lg px-3 py-2">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Douala, Yaoundé" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salaire / Budget (optionnel)</label>
            <input type="text" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: 80 000 - 150 000 FCFA/mois" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="text" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="+237 6XX XXX XXX" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="contact@exemple.com" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">📄 Documents & Photos (optionnel)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"
                multiple
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  setUploadingDoc(true);
                  try {
                    for (let i = 0; i < Math.min(files.length, 5); i++) {
                      const file = files[i];
                      let res;
                      if (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                        res = await uploadApi.uploadDocument(file);
                      } else {
                        res = await uploadApi.uploadImage(file);
                      }
                      setForm(f => ({ ...f, documentUrl: f.documentUrl ? f.documentUrl + ',' + res.data.url : res.data.url }));
                    }
                    toast.success(`${Math.min(files.length, 5)} fichier(s) ajouté(s)`);
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Erreur upload');
                  } finally {
                    setUploadingDoc(false);
                  }
                }}
                className="text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium file:cursor-pointer hover:file:bg-green-100"
                disabled={uploadingDoc}
              />
              {uploadingDoc && <span className="text-xs text-gray-500">Upload en cours...</span>}
            </div>
            {form.documentUrl && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.documentUrl.split(',').map((url, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <FileText className="w-3 h-3" /> {url.includes('.pdf') ? 'PDF' : 'Photo'} {i + 1} ✓
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">PDF, photos (JPEG/PNG), Word. Max 10 Mo par fichier, 5 fichiers max.</p>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Publier</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border rounded-lg">Annuler</button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!filterType ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          Tout
        </button>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterType === t.value ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Aucune annonce pour le moment</p>
          <p className="text-sm mt-1">Publiez la première annonce !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(item.type)}`}>
                      {typeLabel(item.type)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{item.category}</span>
                    {(item as any).kycVerified && (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✅ Vérifié</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {item.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>}
                    {item.salary && <span className="flex items-center gap-1">💰 {item.salary}</span>}
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>Par {item.userName}</span>
                  </div>
                  {(item as any).documentUrl && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(item as any).documentUrl.split(',').map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition">
                          <FileText className="w-3.5 h-3.5" /> {url.includes('.pdf') ? `PDF ${i + 1}` : `Fichier ${i + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/classifieds/${item.id}`;
                      if (navigator.share) {
                        navigator.share({ title: item.title, text: `${typeLabel(item.type)} — ${item.title}`, url }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success('Lien copié !');
                      }
                    }}
                    className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center hover:scale-110 transition"
                    title="Partager"
                  >
                    <Share2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => setFavorites(prev => { const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s; })}
                    className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:scale-110 transition"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                  {(user?.id === item.userId || user?.role === 'ADMIN') && (
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
