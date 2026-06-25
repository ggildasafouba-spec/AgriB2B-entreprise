'use client';
import { useEffect, useState } from 'react';
import { productsApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { MapPin, Package, ChevronDown, ChevronUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  seller?: { region?: string; name?: string };
}

interface RegionGroup {
  region: string;
  products: Product[];
}

export default function ProductMapPage() {
  const { user } = useAuth();
  const [regions, setRegions] = useState<RegionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  useEffect(() => {
    productsApi.getAll().then((res) => {
      const products: Product[] = res.data;
      const grouped: Record<string, Product[]> = {};

      for (const product of products) {
        const region = product.seller?.region || 'Non spécifiée';
        if (!grouped[region]) grouped[region] = [];
        grouped[region].push(product);
      }

      const sorted = Object.entries(grouped)
        .map(([region, products]) => ({ region, products }))
        .sort((a, b) => b.products.length - a.products.length);

      setRegions(sorted);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalProducts = regions.reduce((sum, r) => sum + r.products.length, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-600" />
          Carte des Produits par Région
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {totalProducts} produit{totalProducts > 1 ? 's' : ''} répartis dans {regions.length} région{regions.length > 1 ? 's' : ''}
        </p>
      </div>

      {regions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun produit disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((group) => (
            <div
              key={group.region}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
            >
              {/* Region header */}
              <button
                onClick={() => setExpandedRegion(expandedRegion === group.region ? null : group.region)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-green-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.region}</h3>
                    <p className="text-xs text-gray-500">
                      {group.products.length} produit{group.products.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedRegion === group.region ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Expanded product list */}
              {expandedRegion === group.region && (
                <div className="border-t px-5 py-3 space-y-2 max-h-64 overflow-y-auto">
                  {group.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.seller?.name || 'Vendeur'}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-700">
                        {product.price.toLocaleString('fr-FR')} FCFA/{product.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
