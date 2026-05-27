# AgroMarket Enterprise

Plateforme agricole B2B professionnelle.

## 🚀 Fonctionnalités
- ✅ Authentification JWT
- ✅ Gestion produits
- ✅ Gestion des stocks temps réel
- ✅ Escrow paiement
- ✅ Commandes
- ✅ Export & logistique
- ✅ Notifications
- ✅ KYC
- ✅ Dashboard admin
- ✅ PostgreSQL
- ✅ Redis
- ✅ Docker

## 📦 Stack Technologique

### Backend
- **Node.js** avec TypeScript
- **Express.js** - Framework web
- **Prisma** - ORM pour PostgreSQL
- **JWT** - Authentification
- **Redis** - Cache et sessions

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **React** - Interface utilisateur

### Infrastructure
- **Docker & Docker Compose** - Conteneurisation
- **PostgreSQL 16** - Base de données
- **Redis 7** - Cache

## 🔧 Installation & Configuration

### Prérequis
- Docker et Docker Compose installés
- Node.js 20+ (pour développement local)

### Démarrer le projet

Windows
```cmd
cd AgroB2B-enterprise
start.cmd
```

Mac / Linux
```bash
cd AgroB2B-enterprise
./start.sh
```

Le script fait :
- création de `.env` à partir de `.env.example` si nécessaire
- choix du bon contexte Docker (`default` si disponible)
- démarrage du stack Docker Compose avec PostgreSQL, Redis, backend et frontend

### Initialiser les données de démonstration
Après le premier lancement, exécutez la commande suivante dans `AgroB2B-enterprise/backend` :
```bash
cd AgroB2B-enterprise/backend
npm run seed
```

Comptes de démonstration disponibles après seed :
| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@agrib2b.com` | `admin123` |
| Vendeur | `vendeur@agrib2b.com` | `seller123` |
| Acheteur | `acheteur@agrib2b.com` | `buyer123` |
| Transporteur | `transport@agrib2b.com` | `transport123` |

Si le démarrage échoue, vérifiez que Docker Desktop est lancé et que le démon Docker est accessible.

Exécuter le seed via Docker Compose
----------------------------------
Si tu utilises Docker Compose pour démarrer les services, tu peux lancer le seed dans un conteneur one-shot :

```bash
cd AgroB2B-enterprise
docker compose up -d postgres redis
docker compose run --rm seed
```

La commande `docker compose run --rm seed` va construire l'image backend (si nécessaire), générer le client Prisma et exécuter le script de seed.

### Déploiement backend

- Construire l'image Docker depuis le dossier `backend`.
- Déployer l'image sur un service de containers (Render, Railway, Fly.io, DigitalOcean App Platform, etc.).
- Configurer ces variables d’environnement dans le service de production:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - `PORT` (ou `BACKEND_PORT`)
  - `NODE_ENV=production`
- Le backend écoute par défaut sur `4000`.

```bash
docker build -t agromarket-backend:prod ./backend
docker run -e DATABASE_URL="$DATABASE_URL" -e REDIS_URL="$REDIS_URL" -e JWT_SECRET="$JWT_SECRET" -e NODE_ENV=production -e PORT=4000 -p 4000:4000 agromarket-backend:prod
```

### Accès à l'application
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:4000
- 📊 **Health Check**: http://localhost:4000/health
- 🗄️ **PostgreSQL**: localhost:5432
- 🚀 **Redis**: localhost:6379

## 📝 API Endpoints

### Produits
- `GET /api/products` - Liste tous les produits
- `POST /api/products` - Crée un nouveau produit

## 🛠️ Développement Local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

## 📚 Variables d'Environnement

Voir `.env.example` pour toutes les variables requises.

## 🐳 Docker Compose Services

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| Backend | 4000 | http://localhost:4000 |
| Frontend | 3000 | http://localhost:3000 |

## 📋 Commandes Utiles

```bash
# Arrêter les services
docker compose down

# Voir les logs
docker compose logs -f

# Logs d'un service spécifique
docker compose logs backend
docker compose logs frontend

# Accéder au shell du backend
docker compose exec backend sh

# Migrations Prisma
docker compose exec backend npm run prisma:migrate
```

## ✅ Status: Prêt à fonctionner 🎉

