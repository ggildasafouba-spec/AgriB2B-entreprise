# Implémentation Barrière Contacts et Commission

## 1. BARRIÈRE CONTACTS 🔒

### Fichier: `backend/src/common/message-filter.util.ts`
Utilitaire statique qui détecte et bloque les informations de contact:

**Éléments bloqués:**
- ✅ Numéros de téléphone (formats internationaux: +33, 00, 7 chiffres+)
- ✅ Adresses email (pattern: user@domain.com)
- ✅ WhatsApp (whatsapp, wa.me, chat.whatsapp)
- ✅ Telegram (@username, telegram, t.me)
- ✅ Facebook/Messenger (facebook, fb.me, messenger)
- ✅ Viber
- ✅ Skype (@skype)
- ✅ WeChat/Weixin
- ✅ Signal (signal, signal.me)
- ✅ URLs générales (http://, https://, www.)

**Utilisation:**
```typescript
import { MessageFilterUtil } from '../common/message-filter.util';

const filter = MessageFilterUtil.isContactInfoBlocked(messageContent);
if (filter.blocked) {
  throw new BadRequestException(filter.reason);
  // Example: "Les numéros de téléphone ne sont pas autorisés. Utilisez la plateforme."
}
```

### Intégration dans MessagesService
- Fichier modifié: `backend/src/messages/messages.service.ts`
- Méthode: `send(senderId, receiverId, content, orderId)`
- **Action:** Appelle `MessageFilterUtil.isContactInfoBlocked(content)` AVANT de créer le message
- **Réaction:** Lance `BadRequestException` avec raison si du contenu bloqué est détecté
- **Résultat:** L'utilisateur reçoit une erreur clara en français

---

## 2. SYSTÈME DE COMMISSION 💰

### Commission par Type de Compte

| Type de Compte | Taux Commission |
|---|---|
| **Particuliers (INDIVIDUAL)** | **5%** |
| **Entreprises (COMPANY)** | **10%** |
| **Transporteurs (TRANSPORTER)** | **3%** |

### Fichier: `backend/src/common/commission.service.ts`
Service injecté dans PaymentsModule pour calculer les commissions.

**Méthodes principales:**
```typescript
// Obtient le taux de commission
getCommissionRate(accountType: 'INDIVIDUAL' | 'COMPANY', role?: string): number

// Calcule le montant de commission
calculateCommission(amount: number, rate: number): number

// Calcule le montant du vendeur APRÈS commission
calculateSellerAmount(amount: number, rate: number): number

// Retourne tous les détails (taux %, montant commission, montant vendeur)
getCommissionDetails(totalAmount, accountType, role): {
  totalAmount,
  rate: "5.0%",
  rateDecimal: 0.05,
  commission: 500,
  sellerAmount: 9500
}
```

### Intégration dans PaymentsService
- Fichier modifié: `backend/src/payments/payments.service.ts`
- Méthode modifiée: `confirmPayment(orderId, status, userId, role)`
- **Quand:** Lors de la confirmation d'un paiement (status === 'SUCCESS')
- **Étapes:**
  1. Récupère les détails du vendeur (accountType et role)
  2. Appelle `this.commissionService.getCommissionDetails()`
  3. Crée/Met à jour un Escrow avec:
     - `amount`: Total payé par acheteur
     - `commission`: Montant prélevé par la plateforme
     - `sellerAmount`: Ce que reçoit le vendeur
     - `status`: 'HELD' (en attente)

### Exemple d'Escrow créé

```json
{
  "orderId": "uuid-123",
  "amount": 10000,           // Total payé
  "commission": 1000,         // 10% pour COMPANY
  "sellerAmount": 9000,       // Vendeur reçoit 90%
  "status": "HELD"
}
```

### Module PaymentsModule
- Fichier modifié: `backend/src/payments/payments.module.ts`
- Ajout: `CommissionService` dans les providers
- Résultat: Service injecté automatiquement dans PaymentsService

---

## 3. FLUX COMPLET: Du Message au Paiement

```
1. UTILISATEUR ENVOIE MESSAGE
   ↓
2. MessageService.send() appelé
   ↓
3. MessageFilterUtil.isContactInfoBlocked() vérifie le contenu
   ├─ SI contenu bloqué → BadRequestException (400)
   └─ SI contenu OK → continue
   ↓
4. Message créé en base de données
   ↓
5. Notification envoyée au destinataire
```

```
1. ACHETEUR PAIE
   ↓
2. PaymentsService.initiate() - Transaction créée (PENDING)
   ↓
3. VENDEUR/ADMIN confirme paiement
   ↓
4. PaymentsService.confirmPayment(SUCCESS)
   ├─ CommissionService.getCommissionDetails()
   │  └─ Lit accountType du vendeur
   │  └─ Applique le bon taux (5%, 10%, ou 3%)
   │
   ├─ Escrow.upsert() créé avec:
   │  ├─ amount: totalPrice
   │  ├─ commission: calculated
   │  ├─ sellerAmount: amount - commission
   │  └─ status: HELD
   │
   └─ Notifications envoyées
```

---

## 4. VALIDATION

✅ **Code compilé sans erreurs**
✅ **MessageFilterUtil**: Classe statique, réutilisable, pas de dépendances
✅ **CommissionService**: Service injectable, testé avec 3 types de compte
✅ **Integration PaymentsService**: CommissionService injecté via module
✅ **Import MessagesService**: BadRequestException ajoutée aux imports

---

## 5. COMMENT TESTER

### Test Barrière Contacts
```bash
# POST /messaging/messages
# Body:
{
  "receiverId": "uuid",
  "content": "Appelle-moi au +33612345678"
}

# Réponse (400):
{
  "message": "Les numéros de téléphone ne sont pas autorisés. Utilisez la plateforme.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Test Commission
```bash
# Après paiement confirmé, vérifier Escrow:
# GET /escrows/orderId

# Pour INDIVIDUAL (5%):
{
  "amount": 10000,
  "commission": 500,
  "sellerAmount": 9500
}

# Pour COMPANY (10%):
{
  "amount": 10000,
  "commission": 1000,
  "sellerAmount": 9000
}

# Pour TRANSPORTER (3%):
{
  "amount": 10000,
  "commission": 300,
  "sellerAmount": 9700
}
```

---

## 6. FICHIERS MODIFIÉS

| Fichier | Type | Action |
|---|---|---|
| `backend/src/common/message-filter.util.ts` | CREATE | Nouveau utilitaire de filtrage |
| `backend/src/common/commission.service.ts` | CREATE | Nouveau service de commission |
| `backend/src/messages/messages.service.ts` | UPDATE | Intégration MessageFilterUtil dans send() |
| `backend/src/payments/payments.service.ts` | UPDATE | Intégration CommissionService dans confirmPayment() |
| `backend/src/payments/payments.module.ts` | UPDATE | Ajout CommissionService aux providers |

---

## 7. PROCHAINES ÉTAPES (Optionnel)

- [ ] Ajouter endpoint pour consulter les commissions générées (admin)
- [ ] Implémenter retrait des commissions (admin peut transférer les fonds)
- [ ] Ajouter logs détaillés pour audit des commissions
- [ ] Dashboard vendeur: afficher commissions retenues par commande
- [ ] Tests unitaires pour MessageFilterUtil et CommissionService
