# AgroMarket Backend

API Backend pour la plateforme AgroMarket Enterprise

## 🚀 Démarrage

### Avec Docker Compose (recommandé)
```bash
docker compose up
```

### Développement local
```bash
# Installation des dépendances
npm install

# Configuration Prisma
npm run prisma:generate

# Lancer en mode développement
npm run dev
```

## 📦 Scripts disponibles

- `npm run dev` - Lancer en mode développement
- `npm run build` - Compiler le TypeScript
- `npm start` - Lancer l'application compilée
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Exécuter les migrations
- `npm run prisma:push` - Synchroniser le schéma avec la base
- `npm run seed` - Initialiser les données de test

## 📚 API Endpoints

### Health Check
- `GET /health` - Vérifier l'état du serveur

### Produits
- `GET /api/products` - Liste tous les produits
- `GET /api/products/:id` - Récupère un produit
- `POST /api/products` - Crée un produit
- `PUT /api/products/:id` - Modifie un produit
- `DELETE /api/products/:id` - Supprime un produit

## 🔧 Variables d'environnement

Voir `.env.example` pour la liste complète.

## 📝 Architecture

```
backend/
├── src/
│   └── index.ts          # Point d'entrée principal
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── seed.ts           # Script d'initialisation
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🗄️ Base de données

- **Provider**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis 7

## 🔐 Authentification

JWT (JSON Web Tokens) - À implémenter

## 📖 Documentation API

API documentation (Swagger/OpenAPI) - À implémenter
