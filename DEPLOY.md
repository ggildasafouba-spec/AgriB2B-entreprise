# 🚀 Guide de déploiement en production

## Prérequis
- Serveur Linux (Ubuntu 22.04 recommandé) avec Docker + Docker Compose installés
- Nom de domaine pointant vers l'IP du serveur
- Ports 80 et 443 ouverts

## Étapes

### 1. Cloner le projet sur le serveur
```bash
git clone <votre-repo> /opt/agromarket
cd /opt/agromarket
```

### 2. Configurer les variables d'environnement
```bash
cp .env.production .env
nano .env   # Remplissez toutes les valeurs CHANGE_ME
```

### 3. Obtenir le certificat SSL (Let's Encrypt)
```bash
# Démarrer nginx en HTTP d'abord pour la validation
docker compose -f docker-compose.prod.yml up -d nginx certbot
```

### 4. Mettre à jour nginx.conf avec votre domaine
```bash
sed -i 's/DOMAIN/votre-domaine.com/g' nginx/nginx.conf
```

### 5. Lancer en production
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 6. Vérifier que tout tourne
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail=50
```

## Accès
- Application : https://votre-domaine.com
- API Swagger  : https://votre-domaine.com/api/docs

## Maintenance

### Backup base de données
```bash
docker exec agromarket-postgres-1 pg_dump -U agromarket agromarket > backup_$(date +%Y%m%d).sql
```

### Mise à jour de l'application
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build backend frontend
```

### Renouvellement SSL automatique (cron)
```bash
# Ajouter dans crontab (crontab -e)
0 3 * * * cd /opt/agromarket && docker compose -f docker-compose.prod.yml run certbot renew && docker compose -f docker-compose.prod.yml restart nginx
```

## Mobile Money en production

Pour activer les vrais paiements MTN MoMo et Orange Money :

1. **MTN MoMo** : Créer un compte sur https://momodeveloper.mtn.com
   - Obtenir `API_KEY` et `SUBSCRIPTION_KEY`
   - Remplacer la méthode `simulateMobileMoneyRequest` dans `payments.service.ts`

2. **Orange Money** : Créer un compte sur https://developer.orange.com
   - Obtenir `CLIENT_ID` et `CLIENT_SECRET`
   - Implémenter le flow OAuth2 Orange Money

Les clés sont déjà prévues dans `.env.production`.
