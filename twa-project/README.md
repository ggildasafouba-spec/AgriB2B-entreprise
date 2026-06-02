# AgriB2B - TWA (Trusted Web Activity) pour le Play Store

Ce projet est une application Android qui encapsule votre site web 
`https://www.mboamarket.africa` dans une Trusted Web Activity.

## Prérequis

1. **Android Studio** (téléchargez-le sur https://developer.android.com/studio)
2. Lors de l'installation, acceptez d'installer le SDK Android

## Étapes pour générer l'AAB (Android App Bundle)

### 1. Ouvrir le projet dans Android Studio

- Ouvrez Android Studio
- Cliquez "Open" et sélectionnez le dossier `twa-project`
- Attendez que Gradle synchronise le projet (première fois = téléchargement des dépendances)

### 2. Ajouter les icônes

- Clic droit sur `app/src/main/res` → New → Image Asset
- Sélectionnez votre icône 512x512 comme source
- Cela génère automatiquement toutes les tailles nécessaires (mipmap)

### 3. Générer la clé de signature

- Menu : Build → Generate Signed Bundle / APK
- Choisissez "Android App Bundle"
- Cliquez "Create new..." pour créer un keystore
- Remplissez les infos (gardez bien le mot de passe !)
- Cliquez "Next" puis "Finish"

### 4. Récupérer le SHA256 fingerprint

Après avoir créé le keystore, exécutez :
```
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

Copiez le SHA256 fingerprint et mettez-le dans :
- `frontend/public/.well-known/assetlinks.json` (remplacez le TODO)
- `app/src/main/AndroidManifest.xml` (remplacez le TODO)
- `app/build.gradle` (remplacez le TODO dans manifestPlaceholders)

### 5. Builder l'AAB

- Menu : Build → Generate Signed Bundle / APK
- Sélectionnez "Android App Bundle"
- Utilisez votre keystore
- Build variant : release
- L'AAB sera généré dans `app/build/outputs/bundle/release/`

### 6. Publier sur le Play Store

- Connectez-vous à la Google Play Console
- Créez une nouvelle application
- Uploadez l'AAB
- Remplissez les informations de la fiche

## Configuration Digital Asset Links

Pour que l'app s'affiche en plein écran (sans barre d'URL), le fichier
`assetlinks.json` doit être accessible à :
`https://www.mboamarket.africa/.well-known/assetlinks.json`

Ce fichier est déjà présent dans votre projet frontend.
