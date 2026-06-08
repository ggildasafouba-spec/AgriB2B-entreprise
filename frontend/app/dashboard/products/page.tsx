'use client';
import { useEffect, useState, useRef } from 'react';
import { productsApi, uploadApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import toast from 'react-hot-toast';
import { Plus, Trash2, MapPin, Truck, Package, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

const TRANSPORT_OPTIONS = [
  { value: 'ROUTE', label: '🚛 Route', color: 'bg-blue-100 text-blue-700' },
  { value: 'CHEMIN_DE_FER', label: '🚂 Chemin de fer', color: 'bg-purple-100 text-purple-700' },
  { value: 'MARITIME', label: '🚢 Voie maritime', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'AERIEN', label: '✈️ Voie aérienne', color: 'bg-orange-100 text-orange-700' },
];

const CATEGORIES = ['Légumes', 'Fruits', 'Céréales', 'Tubercules', 'Légumineuses', 'Épices', 'Produits laitiers', 'Viandes', 'Poissons', 'Autre'];

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', price: '', unit: 'kg', category: '',
    productionZone: '', initialStock: '', minOrderQty: '1',
    images: [] as string[], transport: [] as string[], imageInput: '',
    deliveryOptions: [] as { type: string; label: string; price: number }[],
    newDeliveryLabel: '', newDeliveryPrice: '', newDeliveryType: 'POINT' as string,
  });

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    productsApi.getAll(filterCategory || undefined)
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterCategory]);

  const toggleTransport = (val: string) => {
    set('transport', form.transport.includes(val)
      ? form.transport.filter(t => t !== val)
      : [...form.transport, val]);
  };

  const addImage = () => {
    if (!form.imageInput.trim()) return;
    set('images', [...form.images, form.imageInput.trim()]);
    set('imageInput', '');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const res = await uploadApi.uploadImage(files[i]);
        set('images', [...form.images, res.data.url]);
        // Update form.images in real-time
        form.images.push(res.data.url);
      }
      toast.success(`${Math.min(files.length, 5)} photo(s) uploadée(s)`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (i: number) => {
    set('images', form.images.filter((_, idx) => idx !== i));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.transport.length === 0) return toast.error('Sélectionnez au moins un moyen de transport');
    try {
      await productsApi.create({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        unit: form.unit,
        category: form.category,
        productionZone: form.productionZone,
        images: form.images,
        transport: form.transport,
        deliveryOptions: form.deliveryOptions.map(o => JSON.stringify(o)),
        initialStock: parseFloat(form.initialStock),
        minOrderQty: parseInt(form.minOrderQty),
      });
      toast.success('Produit créé');
      setShowForm(false);
      setForm({ name: '', description: '', price: '', unit: 'kg', category: '', productionZone: '', initialStock: '', minOrderQty: '1', images: [], transport: [], imageInput: '', deliveryOptions: [], newDeliveryLabel: '', newDeliveryPrice: '', newDeliveryType: 'POINT' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Produit supprimé');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      unit: product.unit,
      category: product.category,
      productionZone: product.productionZone || '',
      initialStock: String(product.stock?.quantity || 0),
      minOrderQty: String(product.minOrderQty || 1),
      images: product.images || [],
      transport: product.transport || [],
      imageInput: '',
      deliveryOptions: (product.deliveryOptions || []).map((o: string) => { try { return JSON.parse(o); } catch { return null; } }).filter(Boolean),
      newDeliveryLabel: '',
      newDeliveryPrice: '',
      newDeliveryType: 'POINT',
    });
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (form.transport.length === 0) return toast.error('Sélectionnez au moins un moyen de transport');
    try {
      await productsApi.update(editingProduct.id, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        unit: form.unit,
        category: form.category,
        productionZone: form.productionZone,
        images: form.images,
        transport: form.transport,
        minOrderQty: parseInt(form.minOrderQty),
      });
      toast.success('Produit modifié avec succès');
      setShowForm(false);
      setEditingProduct(null);
      setForm({ name: '', description: '', price: '', unit: 'kg', category: '', productionZone: '', initialStock: '', minOrderQty: '1', images: [], transport: [], imageInput: '', deliveryOptions: [], newDeliveryLabel: '', newDeliveryPrice: '', newDeliveryType: 'POINT' });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Catalogue produits</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {(user?.role === 'SELLER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => { setShowForm(!showForm); setEditingProduct(null); setForm({ name: '', description: '', price: '', unit: 'kg', category: '', productionZone: '', initialStock: '', minOrderQty: '1', images: [], transport: [], imageInput: '', deliveryOptions: [], newDeliveryLabel: '', newDeliveryPrice: '', newDeliveryType: 'POINT' }); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" /> Nouveau produit
            </button>
          )}
        </div>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={editingProduct ? handleUpdate : handleCreate} className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-green-100">
          <h3 className="font-bold text-lg text-gray-900 mb-5">{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="Nom du produit">
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                className="input" placeholder="Ex: Tomates Bio" required />
            </FormField>

            <FormField label="Catégorie">
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input" required>
                <option value="">Choisir...</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Prix unitaire (FCFA)">
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                className="input" min="0" step="0.01" required />
            </FormField>

            <FormField label="Unité">
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input">
                {['kg'].map(u => <option key={u}>{u}</option>)}
              </select>
            </FormField>

            <FormField label="Stock initial">
              <input type="number" value={form.initialStock} onChange={e => set('initialStock', e.target.value)}
                className="input" min="0" required />
            </FormField>

            <FormField label="Quantité minimale de commande">
              <input type="number" value={form.minOrderQty} onChange={e => set('minOrderQty', e.target.value)}
                className="input" min="1" required />
            </FormField>

            <FormField label="Zone de production" className="md:col-span-2">
              <input type="text" value={form.productionZone} onChange={e => set('productionZone', e.target.value)}
                className="input" placeholder="Ex: Région Centre, Cameroun" />
            </FormField>

            <FormField label="Description" className="md:col-span-2">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                className="input" rows={3} required />
            </FormField>

            {/* Images */}
            <FormField label="Photos du produit" className="md:col-span-2">
              {/* Upload de fichier */}
              <div className="mb-3">
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
                  className="flex items-center gap-2 px-4 py-3 bg-green-50 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-100 text-green-700 font-medium text-sm w-full justify-center disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  {uploading ? 'Upload en cours...' : 'Prendre une photo ou choisir un fichier'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP. Max 5 Mo par photo, 5 photos max.</p>
              </div>

              {/* Ou ajouter via URL */}
              <div className="flex gap-2 mb-2">
                <input type="url" value={form.imageInput} onChange={e => set('imageInput', e.target.value)}
                  className="input flex-1" placeholder="Ou coller une URL d'image..." />
                <button type="button" onClick={addImage}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
                  + URL
                </button>
              </div>

              {/* Aperçu des images */}
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg border" onError={e => (e.currentTarget.src = '/placeholder.png')} />
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </FormField>

            {/* Transport */}
            <FormField label="Moyens de transport disponibles (triangle national)" className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {TRANSPORT_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => toggleTransport(t.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${
                      form.transport.includes(t.value)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {form.transport.length === 0 && (
                <p className="text-xs text-red-400 mt-1">Sélectionnez au moins un moyen de transport</p>
              )}
            </FormField>

            {/* Options de livraison vendeur */}
            <FormField label="Options de livraison pour l'acheteur" className="md:col-span-2">
              <p className="text-xs text-gray-400 mb-3">Définissez comment l'acheteur peut récupérer sa commande</p>

              {/* Liste des options ajoutées */}
              {form.deliveryOptions.length > 0 && (
                <div className="space-y-2 mb-3">
                  {form.deliveryOptions.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span>{opt.type === 'DOMICILE' ? '🏠' : '📍'}</span>
                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-700">{opt.price === 0 ? 'Gratuit' : `${opt.price.toLocaleString('fr-FR')} FCFA`}</span>
                        <button type="button" onClick={() => set('deliveryOptions', form.deliveryOptions.filter((_, idx) => idx !== i))}
                          className="text-red-500 hover:text-red-700 text-lg">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout */}
              <div className="flex gap-2 items-end flex-wrap">
                <select value={form.newDeliveryType} onChange={e => set('newDeliveryType', e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm">
                  <option value="DOMICILE">🏠 Livraison domicile</option>
                  <option value="POINT">📍 Point de rencontre</option>
                </select>
                <input type="text" value={form.newDeliveryLabel} onChange={e => set('newDeliveryLabel', e.target.value)}
                  placeholder={form.newDeliveryType === 'DOMICILE' ? 'Ex: Rayon 0-10km' : 'Ex: Marché central'}
                  className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[150px]" />
                <input type="number" value={form.newDeliveryPrice} onChange={e => set('newDeliveryPrice', e.target.value)}
                  placeholder="Prix (FCFA)" min="0"
                  className="border rounded-lg px-3 py-2 text-sm w-28" />
                <button type="button" onClick={() => {
                  if (!form.newDeliveryLabel) return toast.error('Indiquez un lieu ou une description');
                  set('deliveryOptions', [...form.deliveryOptions, {
                    type: form.newDeliveryType,
                    label: form.newDeliveryLabel,
                    price: parseInt(form.newDeliveryPrice) || 0,
                  }]);
                  set('newDeliveryLabel', '');
                  set('newDeliveryPrice', '');
                }} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  + Ajouter
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Mettez 0 FCFA pour une option gratuite (ex: retrait sur place)</p>
            </FormField>
          </div>

          <div className="flex gap-3 mt-5">
            <button type="submit" className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              {editingProduct ? 'Enregistrer les modifications' : 'Publier le produit'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-5 py-2 border rounded-lg hover:bg-gray-50">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Grille produits */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl shadow h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              user={user}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onClick={() => setSelectedProduct(p)}
            />
          ))}
          {products.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun produit disponible</p>
            </div>
          )}
        </div>
      )}

      {/* Modal détail produit */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} user={user} />
      )}

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
      `}</style>
    </div>
  );
}

// ── Carte produit ─────────────────────────────────────────────────────────────
function ProductCard({ product: p, user, onDelete, onEdit, onClick }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = p.images?.length ? p.images : [];

  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer group"
      onClick={onClick}>
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {imgs.length > 0 ? (
          <>
            <img src={imgs[imgIdx]} alt={p.name}
              className="w-full h-full object-cover"
              onError={e => (e.currentTarget.src = 'https://placehold.co/400x300/e8f5e9/16a34a?text=Produit')} />
            {imgs.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + imgs.length) % imgs.length); }}
                  className="w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % imgs.length); }}
                  className="w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {imgs.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {imgs.map((_: any, i: number) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-16 h-16" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
          {p.category}
        </span>
        {(user?.role === 'ADMIN' || user?.id === p.sellerId) && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(p.id); }}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {(user?.role === 'ADMIN' || user?.id === p.sellerId) && onEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(p); }}
            className="absolute top-2 right-10 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.name}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>

        {p.productionZone && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-green-600" />
            {p.productionZone}
          </div>
        )}

        <div className="flex justify-between items-end mt-3">
          <div>
            <span className="text-xl font-bold text-green-700">{p.price.toLocaleString()} FCFA</span>
            <span className="text-sm text-gray-400">/{p.unit}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Stock: <span className="font-medium">{p.stock?.quantity ?? 0} {p.unit}</span></p>
            {p.minOrderQty > 1 && (
              <p className="text-xs text-amber-600">Min: {p.minOrderQty} {p.unit}</p>
            )}
          </div>
        </div>

        {/* Transport badges */}
        {p.transport?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {p.transport.map((t: string) => {
              const opt = TRANSPORT_OPTIONS.find(o => o.value === t);
              return opt ? (
                <span key={t} className={`text-xs px-2 py-0.5 rounded-full ${opt.color}`}>{opt.label}</span>
              ) : null;
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">Par {p.seller?.name}</p>
      </div>
    </div>
  );
}

// ── Modal détail produit ──────────────────────────────────────────────────────
function ProductModal({ product: p, onClose, user }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = p.images?.length ? p.images : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Image carousel */}
        <div className="relative h-64 bg-gray-100 rounded-t-2xl overflow-hidden">
          {imgs.length > 0 ? (
            <>
              <img src={imgs[imgIdx]} alt={p.name} className="w-full h-full object-cover"
                onError={e => (e.currentTarget.src = 'https://placehold.co/600x300/e8f5e9/16a34a?text=Produit')} />
              {imgs.length > 1 && (
                <div className="absolute inset-0 flex items-center justify-between px-3">
                  <button onClick={() => setImgIdx(i => (i - 1 + imgs.length) % imgs.length)}
                    className="w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx(i => (i + 1) % imgs.length)}
                    className="w-9 h-9 bg-black/40 text-white rounded-full flex items-center justify-center">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
              {imgs.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {imgs.map((_: any, i: number) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="w-20 h-20" />
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{p.category}</span>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{p.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">{p.price.toLocaleString()} FCFA</p>
              <p className="text-sm text-gray-500">par {p.unit}</p>
            </div>
          </div>

          <p className="text-gray-600 mt-3">{p.description}</p>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <InfoBox label="Stock disponible" value={`${p.stock?.quantity ?? 0} ${p.unit}`} />
            <InfoBox label="Commande minimale" value={`${p.minOrderQty} ${p.unit}`} highlight={p.minOrderQty > 1} />
            {p.productionZone && <InfoBox label="Zone de production" value={p.productionZone} icon={<MapPin className="w-4 h-4" />} />}
            <InfoBox label="Vendeur" value={p.seller?.name} sub={p.seller?.accountType === 'COMPANY' ? 'Entreprise' : 'Particulier'} />
          </div>

          {/* Transport */}
          {p.transport?.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Livraison — Triangle national
              </p>
              <div className="flex flex-wrap gap-2">
                {p.transport.map((t: string) => {
                  const opt = TRANSPORT_OPTIONS.find(o => o.value === t);
                  return opt ? (
                    <span key={t} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${opt.color}`}>{opt.label}</span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Contact vendeur */}
          {p.seller?.phone && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-700">Contact vendeur</p>
              <p className="text-gray-500">{p.seller.email} {p.seller.phone && `· ${p.seller.phone}`}</p>
              {p.seller.region && <p className="text-gray-400 text-xs">{p.seller.region}, {p.seller.country}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function InfoBox({ label, value, sub, highlight, icon }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 flex items-center gap-1">{icon}{label}</p>
      <p className={`font-semibold mt-0.5 ${highlight ? 'text-amber-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
