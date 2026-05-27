# AgroMarket Frontend

Interface utilisateur pour la plateforme AgroMarket Enterprise

## 🚀 Démarrage

### Avec Docker Compose (recommandé)
```bash
docker compose up
```

### Développement local
```bash
# Installation des dépendances
npm install

# Lancer en mode développement
npm run dev
```

## 📦 Scripts disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Compiler l'application pour la production
- `npm start` - Lancer l'application compilée
- `npm run lint` - Vérifier le code avec ESLint

## 🛠️ Stack Technologique

- **Framework**: Next.js 14
- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Styling**: CSS natif (à améliorer avec Tailwind/Material-UI)
- **HTTP Client**: Axios

## 📚 Récupération de données

Les appels API sont proxifiés vers le backend via la configuration Next.js:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Proxy: `/api/*` → `http://backend:4000/api/*`

## 📁 Structure des fichiers

```
frontend/
├── app/
│   ├── layout.tsx        # Layout principal
│   ├── page.tsx          # Page d'accueil
│   └── api/              # API routes (optionnel)
├── public/               # Fichiers statiques
├── package.json
├── tsconfig.json
├── next.config.js
└── Dockerfile
```

## 🎨 Composants

À implémenter:
- Navbar
- Product List
- Product Detail
- Cart
- Checkout
- User Dashboard

## 🔐 Authentification

JWT avec stockage en localStorage - À implémenter

## 📖 Pages principales

- `/` - Accueil
- `/products` - Catalogue des produits
- `/cart` - Panier
- `/checkout` - Paiement
- `/dashboard` - Tableau de bord utilisateur

## 🌐 Environnement

- `NEXT_PUBLIC_API_URL` - URL de l'API backend (défaut: http://localhost:4000)
