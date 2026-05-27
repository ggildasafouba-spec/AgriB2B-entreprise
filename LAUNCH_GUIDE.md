# 🚀 Guide Lancement Application - Barrière & Commission

## ✅ Statut des Implémentations

### 1. Barrière Contact 🔒
**STATUS: ✅ COMPLÈTE ET TESTÉE**
- Bloque: Téléphones, Emails, WhatsApp, Telegram, Facebook, Viber, Skype, WeChat, Signal, URLs
- Retour erreur: 400 Bad Request avec raison en français
- Localisation: `backend/src/common/message-filter.util.ts`

### 2. Système de Commission 💰
**STATUS: ✅ COMPLÈTE ET TESTÉE**
- Particuliers (INDIVIDUAL): **5% commission**
- Entreprises (COMPANY): **10% commission**  
- Transporteurs (TRANSPORTER): **3% commission**
- Calcul lors de la confirmation de paiement
- Stockage dans model Escrow

---

## 🎯 Commandes Lancement

### 1️⃣ Démarrer les Services Docker
```bash
cd d:\AgriB2B-enterprise\AgroB2B-enterprise
docker compose -f docker-compose.dev.yml up -d
```
✅ Services qui démarreront:
- PostgreSQL sur **localhost:5432**
- Redis sur **localhost:16379** (⚠️ Port changé pour éviter conflit Windows)

### 2️⃣ Compiler le Backend
```bash
cd backend
npm run build
```
✅ Valide TypeScript et prepare les fichiers pour le lancement

### 3️⃣ Lancer le Backend
```bash
cd backend
npm run start:dev
```
✅ Backend disponible sur **http://localhost:4000**
✅ Swagger API disponible sur **http://localhost:4000/api/docs**

### 4️⃣ Lancer le Frontend (dans un autre terminal)
```bash
cd frontend
npm run dev
```
✅ Frontend disponible sur **http://localhost:3000**

---

## 📋 Comptes de Test

| Rôle | Email | Mot de passe | Type Compte |
|---|---|---|---|
| **Admin** | admin@agrib2b.com | admin123 | - |
| **Vendeur** | vendeur@agrib2b.com | seller123 | INDIVIDUAL (5%) |
| **Acheteur** | acheteur@agrib2b.com | buyer123 | INDIVIDUAL |
| **Transporteur** | transport@agrib2b.com | transport123 | INDIVIDUAL (3%) |

---

## 🧪 TESTS BARRIÈRE CONTACT

### Méthode 1: Via Swagger API
```
1. Aller à http://localhost:4000/api/docs
2. Chercher "POST /messaging/messages"
3. S'authentifier avec JWT token (voir Admin Login)
4. Envoyer un message avec contenu bloqué
```

### Méthode 2: Via Frontend (Chat)
```
1. Aller à http://localhost:3000
2. Connecter acheteur@agrib2b.com / buyer123
3. Aller au chat avec un vendeur
4. Tenter d'envoyer messages bloqués
```

### Exemples à Tester (❌ Seront Bloqués)
```
❌ "Appelle-moi au +33612345678"
❌ "Mon email: john@gmail.com"
❌ "Message-moi sur WhatsApp"
❌ "Telegram @username"
❌ "Visite: https://exemple.com"
```

### Exemples Autorisés (✅)
```
✅ "Bonjour, le produit est-il disponible?"
✅ "Quel est le prix exact?"
✅ "Quand peut-on se rencontrer sur la plateforme?"
✅ "Je suis intéressé par votre offre"
```

---

## 💰 TESTS COMMISSION

### Scénario Test Complet

#### Étape 1: S'authentifier comme Admin
```
POST http://localhost:4000/auth/login
{
  "email": "admin@agrib2b.com",
  "password": "admin123"
}

Copier le JWT token retourné
```

#### Étape 2: Vérifier un Escrow Existant
```
GET http://localhost:4000/escrows
Header: Authorization: Bearer <JWT_TOKEN>
```

#### Étape 3: Créer une Commande (Acheteur)
```
1. Connexion: acheteur@agrib2b.com / buyer123
2. Parcourir les produits du vendeur
3. Ajouter au panier
4. Créer commande
```

#### Étape 4: Confirmer Paiement (Admin)
```
POST http://localhost:4000/payments/confirm
{
  "orderId": "<ID_COMMANDE>",
  "status": "SUCCESS"
}

RÉSULTAT: Escrow créé automatiquement avec commission calculée!
```

#### Étape 5: Vérifier Commission
```
GET http://localhost:4000/escrows/<orderId>

RESPONSE EXAMPLE (Vendeur COMPANY 10%):
{
  "id": "uuid",
  "orderId": "order-123",
  "amount": 10000,          ← Total payé par acheteur
  "commission": 1000,       ← 10% = Plateforme reçoit
  "sellerAmount": 9000,     ← 90% = Vendeur reçoit
  "status": "HELD",
  "createdAt": "2024-01-15T..."
}
```

---

## 🔍 Vérification en Directe

### Docker Check
```bash
docker compose -f docker-compose.dev.yml ps

OUTPUT ATTENDU:
NAME                          STATE          PORTS
agrob2b-enterprise-postgres-1 running ✔ 0.0.0.0:5432->5432/tcp
agrob2b-enterprise-redis-1    running ✔ 0.0.0.0:16379->6379/tcp
```

### Backend Logs
```bash
cd backend
npm run start:dev

OUTPUT EXPECTED:
[NestJS] 15  01/15/2024, 10:30 AM LOG [NestFactory] Starting Nest application...
[NestJS] 15  01/15/2024, 10:30 AM LOG [InstanceLoader] PrismaModule dependencies initialized
...
[NestJS] 15  01/15/2024, 10:30 AM LOG [RouterExplorer] Mapped {/auth/login, POST} route
[NestJS] 15  01/15/2024, 10:30 AM LOG [RouterExplorer] Mapped {/messaging/messages, POST} route
...
[NestJS] 15  01/15/2024, 10:30 AM LOG [NestApplication] Nest application successfully started
```

### Frontend Logs
```bash
cd frontend
npm run dev

OUTPUT EXPECTED:
 ▲ Next.js 14.x.x
 ✓ Ready in 2.5s
 ✓ Compiled in 1.2s

✓ API route: http://localhost:4000
✓ Frontend: http://localhost:3000
```

---

## 📝 Fichiers Modifiés/Créés

### CRÉÉS (Nouveaux)
```
✨ backend/src/common/message-filter.util.ts    - Utilitaire filtrage contacts
✨ backend/src/common/commission.service.ts     - Service calcul commissions
✨ backend/src/common/message-filter.examples.ts - Tests filtrage
✨ backend/src/common/commission.examples.ts    - Tests commission
```

### MODIFIÉS
```
📝 backend/src/messages/messages.service.ts     - Intégration filtrage (send method)
📝 backend/src/payments/payments.service.ts     - Intégration commission (confirmPayment)
📝 backend/src/payments/payments.module.ts      - Injection CommissionService
```

---

## ⚠️ Points Importants

### Redis Port Changé
Windows réserve les ports 6281-6380, donc Redis est sur **16379** au lieu de 6379
```
Dans backend/.env:
REDIS_URL="redis://localhost:16379"   ← IMPORTANT!
```

### Compilation Required
Après modifications TypeScript, toujours faire:
```bash
npm run build
```

### Credentials Stockés en BD
Les comptes de test sont en base de données Prisma. Si DB reset:
```bash
# Reseed data
npx prisma db seed
```

---

## 🎉 Flux Complet Testé

✅ **Message Filtering**
- Utilisateur essaie d'envoyer message avec contact → 400 Bad Request
- Message avec contenu normal passe → Créé en BD

✅ **Commission Calculation**
- Paiement confirmé → CommissionService.getCommissionDetails()
- Escrow créé automatiquement avec montants corrects
- Vendeur voit commission retenue dans le tableau de bord

✅ **All 3 Account Types**
- INDIVIDUAL (5%) → Commission calculée
- COMPANY (10%) → Commission calculée  
- TRANSPORTER (3%) → Commission calculée

---

## 🚨 Troubleshooting

### Docker Services n'apparaissent pas
```bash
# Redémarrer complètement
docker compose down
docker compose -f docker-compose.dev.yml up -d
```

### Backend ne démarre pas
```bash
# Vérifier compilation
npm run build

# Vérifier dépendances
npm install

# Vérifier variables d'environnement
cat backend/.env
```

### Erreur "Port 4000 en utilisation"
```bash
# Vérifier quel process utilise le port
netstat -ano | findstr :4000

# Tuer le process (Windows)
taskkill /PID <PID> /F
```

---

## 📞 Support

Pour questions sur:
- **Barrière Contact**: Voir [BARRIER_AND_COMMISSION.md](./BARRIER_AND_COMMISSION.md) Section 1
- **Commission**: Voir [BARRIER_AND_COMMISSION.md](./BARRIER_AND_COMMISSION.md) Section 2
- **Endpoints API**: Voir http://localhost:4000/api/docs (Swagger)

✨ **Application maintenant sécurisée et monétisée!** ✨
