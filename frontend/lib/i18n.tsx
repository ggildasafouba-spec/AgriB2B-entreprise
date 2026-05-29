'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'fr' | 'en';

const translations = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.products': 'Produits',
    'nav.listings': 'Annonces',
    'nav.preorders': 'Pré-commandes',
    'nav.orders': 'Commandes',
    'nav.payments': 'Paiements',
    'nav.stock': 'Stock',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.kyc': 'KYC',
    'nav.transport': 'Transport',
    'nav.admin': 'Admin',
    'nav.logout': 'Déconnexion',

    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'S\'inscrire',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.submit': 'Se connecter',
    'auth.noAccount': 'Pas de compte ?',
    'auth.hasAccount': 'Déjà un compte ?',
    'auth.backHome': 'Retour à l\'accueil',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.welcome': 'Bienvenue',
    'dashboard.orders': 'Mes commandes',
    'dashboard.products': 'Produits disponibles',
    'dashboard.notifications': 'Notifications non lues',

    // Products
    'products.title': 'Catalogue produits',
    'products.new': 'Nouveau produit',
    'products.edit': 'Modifier le produit',
    'products.name': 'Nom du produit',
    'products.price': 'Prix unitaire (FCFA)',
    'products.category': 'Catégorie',
    'products.unit': 'Unité',
    'products.stock': 'Stock',
    'products.minOrder': 'Commande minimale',
    'products.zone': 'Zone de production',
    'products.description': 'Description',
    'products.publish': 'Publier le produit',
    'products.save': 'Enregistrer les modifications',
    'products.cancel': 'Annuler',
    'products.delete': 'Supprimer',
    'products.noProducts': 'Aucun produit disponible',
    'products.allCategories': 'Toutes catégories',
    'products.negotiate': 'Négocier le prix',

    // Orders
    'orders.title': 'Commandes',
    'orders.new': 'Nouvelle commande',
    'orders.total': 'Total',
    'orders.commission': 'Commission plateforme',
    'orders.sellerReceives': 'Vendeur reçoit',
    'orders.confirm': 'Confirmer',
    'orders.cancel': 'Annuler',
    'orders.ship': 'Marquer expédiée',
    'orders.delivered': 'Confirmer réception',
    'orders.delivery': 'Commander une livraison',
    'orders.tracking': 'Suivi livraison',
    'orders.installment': 'Payer en plusieurs fois',

    // Payments
    'payments.title': 'Paiements',
    'payments.installment2': 'Payer en 2 fois (60% + 40%)',
    'payments.installment3': 'Payer en 3 fois (50% + 25% + 25%)',
    'payments.deposit': 'Acompte',
    'payments.onShipping': 'À l\'expédition',
    'payments.onDelivery': 'Solde à la livraison',
    'payments.paid': 'Payé',
    'payments.pending': 'En attente',

    // Transport
    'transport.title': 'Grilles Tarifaires Transport',
    'transport.commission': 'Commission transport : 3% incluse dans les prix affichés.',
    'transport.newRate': 'Nouveau tarif',
    'transport.myRates': 'Mes tarifs',
    'transport.available': 'Tarifs disponibles',

    // Seasons
    'seasons.title': 'Calendrier des saisons',
    'seasons.inSeason': 'Produits de saison',
    'seasons.region': 'Région',

    // Negotiation
    'negotiation.title': 'Négociation',
    'negotiation.propose': 'Proposer un prix',
    'negotiation.accept': 'Accepter',
    'negotiation.reject': 'Refuser',
    'negotiation.counter': 'Contre-proposition',
    'negotiation.yourPrice': 'Votre prix proposé',
    'negotiation.originalPrice': 'Prix original',

    // Reviews
    'reviews.title': 'Avis',
    'reviews.leave': 'Laisser un avis',
    'reviews.rating': 'Note',
    'reviews.comment': 'Commentaire',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.back': 'Retour',
    'common.search': 'Rechercher...',
    'common.noResults': 'Aucun résultat',
    'common.fcfa': 'FCFA',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.products': 'Products',
    'nav.listings': 'Listings',
    'nav.preorders': 'Pre-orders',
    'nav.orders': 'Orders',
    'nav.payments': 'Payments',
    'nav.stock': 'Stock',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.kyc': 'KYC',
    'nav.transport': 'Transport',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',

    // Auth
    'auth.login': 'Login',
    'auth.register': 'Sign up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.submit': 'Sign in',
    'auth.noAccount': 'No account?',
    'auth.hasAccount': 'Already have an account?',
    'auth.backHome': 'Back to home',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.orders': 'My orders',
    'dashboard.products': 'Available products',
    'dashboard.notifications': 'Unread notifications',

    // Products
    'products.title': 'Product catalog',
    'products.new': 'New product',
    'products.edit': 'Edit product',
    'products.name': 'Product name',
    'products.price': 'Unit price (FCFA)',
    'products.category': 'Category',
    'products.unit': 'Unit',
    'products.stock': 'Stock',
    'products.minOrder': 'Minimum order',
    'products.zone': 'Production zone',
    'products.description': 'Description',
    'products.publish': 'Publish product',
    'products.save': 'Save changes',
    'products.cancel': 'Cancel',
    'products.delete': 'Delete',
    'products.noProducts': 'No products available',
    'products.allCategories': 'All categories',
    'products.negotiate': 'Negotiate price',

    // Orders
    'orders.title': 'Orders',
    'orders.new': 'New order',
    'orders.total': 'Total',
    'orders.commission': 'Platform commission',
    'orders.sellerReceives': 'Seller receives',
    'orders.confirm': 'Confirm',
    'orders.cancel': 'Cancel',
    'orders.ship': 'Mark as shipped',
    'orders.delivered': 'Confirm delivery',
    'orders.delivery': 'Order delivery',
    'orders.tracking': 'Track delivery',
    'orders.installment': 'Pay in installments',

    // Payments
    'payments.title': 'Payments',
    'payments.installment2': 'Pay in 2 installments (60% + 40%)',
    'payments.installment3': 'Pay in 3 installments (50% + 25% + 25%)',
    'payments.deposit': 'Deposit',
    'payments.onShipping': 'On shipping',
    'payments.onDelivery': 'Balance on delivery',
    'payments.paid': 'Paid',
    'payments.pending': 'Pending',

    // Transport
    'transport.title': 'Transport Rate Grid',
    'transport.commission': 'Transport commission: 3% included in displayed prices.',
    'transport.newRate': 'New rate',
    'transport.myRates': 'My rates',
    'transport.available': 'Available rates',

    // Seasons
    'seasons.title': 'Seasonal Calendar',
    'seasons.inSeason': 'In-season products',
    'seasons.region': 'Region',

    // Negotiation
    'negotiation.title': 'Negotiation',
    'negotiation.propose': 'Propose a price',
    'negotiation.accept': 'Accept',
    'negotiation.reject': 'Reject',
    'negotiation.counter': 'Counter-offer',
    'negotiation.yourPrice': 'Your proposed price',
    'negotiation.originalPrice': 'Original price',

    // Reviews
    'reviews.title': 'Reviews',
    'reviews.leave': 'Leave a review',
    'reviews.rating': 'Rating',
    'reviews.comment': 'Comment',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.search': 'Search...',
    'common.noResults': 'No results',
    'common.fcfa': 'FCFA',
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'fr',
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('agrib2b-lang') as Lang;
    if (saved && (saved === 'fr' || saved === 'en')) setLang(saved);
  }, []);

  const changeLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('agrib2b-lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang][key as keyof typeof translations['fr']] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

// Composant de sélection de langue
export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition"
      title={lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      {lang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}
    </button>
  );
}
