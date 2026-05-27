# ⚡ Démarrage Rapide - AgroMarket Enterprise

## 🎯 En 3 étapes simples

### 1️⃣ Prérequis
- ✅ Docker et Docker Compose installés
- ✅ Port 3000, 4000, 5432, 6379 disponibles

### 2️⃣ Lancer l'application

**Sur Windows (Command Prompt):**
```cmd
start.cmd
```

**Sur Mac/Linux (Terminal):**
```bash
bash start.sh
```

**Ou manuellement:**
```bash
docker compose up --build
```

### 3️⃣ Accéder à l'application
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **Backend API**: http://localhost:4000
- 📊 **Health Check**: http://localhost:4000/health

---

## 📋 Commandes Utiles

```bash
# Initialiser la base de données
docker compose exec backend npm run prisma:push

# Charger les données de test
docker compose exec backend npm run seed

# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down

# Nettoyer et réinitialiser
docker compose down -v
```

---

## 📚 Structure du Projet

```
agromarket-enterprise/
├── backend/           # API Node.js + Prisma
├── frontend/          # Interface Next.js
├── docker-compose.yml # Orchestration des services
├── .env              # Variables d'environnement
└── README.md         # Documentation complète
```

---

## 🐳 Services Docker

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 4000 | http://localhost:4000 |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |

---

## ✅ Checklist

- [ ] Docker Compose installé
- [ ] Ports disponibles
- [ ] `.env` créé (ou utiliser `start.cmd`/`start.sh`)
- [ ] Lancer `docker compose up --build`
- [ ] Attendre que tous les services soient prêts
- [ ] Accéder http://localhost:3000

---

## 🆘 Dépannage

**Le backend ne démarre pas?**
```bash
docker compose logs backend
```

**Erreur de base de données?**
```bash
docker compose exec backend npm run prisma:push
```

**Régénérer tout?**
```bash
docker compose down -v
docker compose up --build
```

---

## 📖 Documentation Complète

Voir [README.md](./README.md) pour la documentation complète.
