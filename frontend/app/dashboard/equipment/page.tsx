'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../../lib/auth-context';
import api, { uploadApi } from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Phone, MapPin, Search, Heart, Camera } from 'lucide-react';

interface Equipment {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  location: string;
  images: string[];
  contactPhone: string;
  userId: string;
  userName: string;
  createdAt: string;
}

const CATEGORIES = [
  'Tracteurs & Engins',
  'Motopompes & Irrigation',
  'Pulvérisateurs',
  'Outils manuels',
  'Semences & Plants',
  'Engrais & Intrants',
  'Stockage & Emballage',
  'Autre',
];

export default function EquipmentPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    title: '', description: '', price: '', condition: 'Neuf',
    category: CATEGORIES[0], location: '', images: [] as string[], imageInput: '', contactPhone: '',
    guarantee: '', specs: '', transport: '', deliveryDays: '', shippingCountry: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { load(); }, []);

  const load = () => {
    api.get('/equipment').then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const res = await uploadApi.uploadImage(files[i]);
        form.images.push(res.data.url);
        setForm(f => ({ ...f, images: [...f.images] }));
      }
      toast.success(`${Math.min(files.length, 5)} photo(s) ajoutée(s)`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/equipment', {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        condition: form.condition,
        category: form.category,
        location: form.location || user?.region || '',
        images: form.images,
        contactPhone: form.contactPhone || user?.phone || '',
        guarantee: form.guarantee || '',
        specs: form.specs || '',
        transport: form.transport || '',
        deliveryDays: form.deliveryDays || '',
        shippingCountry: form.shippingCountry || '',
      });
      toast.success('Matériel publié !');
      setShowForm(false);
      setForm({ title: '', description: '', price: '', condition: 'Neuf', category: CATEGORIES[0], location: '', images: [], imageInput: '', contactPhone: '', guarantee: '', specs: '', transport: '', deliveryDays: '', shippingCountry: '' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success('Supprimé');
      load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = items.filter(i =>
    (!filter || i.category === filter) &&
    true
  );

  if (loading) return <div className="text-center py-10 text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚜 Matériel Agricole</h1>
          <p className="text-gray-500 text-sm mt-1">Achetez et vendez du matériel agricole entre professionnels</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
          <Plus className="w-4 h-4" /> Publier une annonce
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Motopompe Diesel 5CV" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required
              className="w-full border rounded-lg px-3 py-2 h-20" placeholder="Décrivez l'état, les caractéristiques, l'utilisation..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA) *</label>
            <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="0 = Prix à discuter" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">État</label>
            <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}
              className="w-full border rounded-lg px-3 py-2">
              <option>Neuf</option>
              <option>Très bon état</option>
              <option>Bon état</option>
              <option>Usagé</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">🛡️ Garantie</label>
            <input type="text" value={form.guarantee} onChange={e => setForm({...form, guarantee: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: 6 mois, 1 an, Aucune" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">📋 Fiche technique / Spécifications</label>
            <textarea value={form.specs} onChange={e => setForm({...form, specs: e.target.value})}
              className="w-full border rounded-lg px-3 py-2 h-16 text-sm" placeholder="Puissance, dimensions, poids, marque, modèle..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🚛 Moyen de transport</label>
            <select value={form.transport} onChange={e => setForm({...form, transport: e.target.value})}
              className="w-full border rounded-lg px-3 py-2">
              <option value="">-- Choisir --</option>
              <option>Livraison par le vendeur</option>
              <option>Transporteur de la plateforme</option>
              <option>Retrait sur place</option>
              <option>Expédition nationale</option>
              <option>Expédition internationale</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">⏱️ Durée de livraison</label>
            <input type="text" value={form.deliveryDays} onChange={e => setForm({...form, deliveryDays: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: 2-5 jours, 1 semaine" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🌍 Pays d&apos;expédition</label>
            <input type="text" value={form.shippingCountry} onChange={e => setForm({...form, shippingCountry: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Cameroun, Afrique de l'Ouest" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📍 Localisation</label>
            <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="Ex: Douala, Littoral" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📞 Téléphone de contact</label>
            <input type="text" value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" placeholder="+237 6XX XXX XXX" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">🖼️ Photos du matériel</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl hover:bg-amber-100 text-amber-700 font-medium text-sm w-full justify-center disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              {uploading ? 'Upload en cours...' : 'Prendre une photo ou choisir un fichier'}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP. Max 5 Mo par photo, 5 photos max.</p>
            {form.images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                    <button type="button" onClick={() => setForm(f => ({...f, images: f.images.filter((_, j) => j !== i)}))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2 border-t">
            <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium">Publier l&apos;annonce</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!filter ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Tout
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === c ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Aucune annonce pour le moment</p>
          <p className="text-sm mt-1">Soyez le premier à publier !</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden">
              {item.images?.[0] && (
                <div className="relative">
                  <img src={item.images[0]} alt={item.title} className="w-full h-40 object-cover" />
                  <button
                    onClick={() => setFavorites(prev => { const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s; })}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              )}
              {!item.images?.[0] && (
                <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                  <span className="text-4xl">🚜</span>
                  <button
                    onClick={() => setFavorites(prev => { const s = new Set(prev); s.has(item.id) ? s.delete(item.id) : s.add(item.id); return s; })}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:scale-110 transition"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">{item.title}</h3>
                  {(user?.id === item.userId || user?.role === 'ADMIN') && (
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-amber-700">
                    {item.price > 0 ? `${item.price.toLocaleString('fr-FR')} FCFA` : 'Prix à discuter'}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.condition}</span>
                </div>
                {((item as any).guarantee || (item as any).deliveryDays || (item as any).shippingCountry) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(item as any).guarantee && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">🛡️ {(item as any).guarantee}</span>}
                    {(item as any).deliveryDays && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">⏱️ {(item as any).deliveryDays}</span>}
                    {(item as any).shippingCountry && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">🌍 {(item as any).shippingCountry}</span>}
                    {(item as any).transport && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">🚛 {(item as any).transport}</span>}
                  </div>
                )}
                {(item as any).specs && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded px-2 py-1 line-clamp-2">📋 {(item as any).specs}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.contactPhone}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Par {item.userName} • {new Date(item.createdAt).toLocaleDateString('fr-FR')}</p>
                {item.kycVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">✅ Vérifié</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
