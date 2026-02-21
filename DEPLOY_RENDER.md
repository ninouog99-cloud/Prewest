# 🚀 Déploiement Rapide sur Render

## Étape 1: Créer un compte Render
1. Allez sur https://render.com
2. Inscrivez-vous avec Google ou GitHub (gratuit)

## Étape 2: Télécharger le projet
1. Téléchargez ce fichier: `prewest-render.zip`
2. Extrayez-le sur votre ordinateur

## Étape 3: Créer un nouveau service Web
1. Dans Render Dashboard, cliquez sur "New +"
2. Choisissez "Web Service"
3. Faites défiler et cliquez sur "Deploy an existing image from a registry" 
   OU "Create Web Service" puis choisissez "Upload your code"

## Étape 4: Upload du code
**Option A: Upload ZIP (recommandé)**
- Cliquez sur "Upload"
- Sélectionnez le dossier `prewest-render` extrait
- Render détectera automatiquement Node.js

**Option B: Git (si vous préférez)**
- Poussez le code sur GitHub
- Connectez Render à GitHub

## Étape 5: Configuration
Render détectera automatiquement:
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

Cliquez sur "Create Web Service"

## Étape 6: Attendre le déploiement
- Le build prend 2-3 minutes
- Une fois terminé, vous verrez l'URL: `https://prewest-xxx.onrender.com`

## Étape 7: Tester!
1. Ouvrez l'URL
2. Connectez-vous avec:
   - Username: `admin`
   - Password: `admin123`
3. Changez le mot de passe immédiatement

## 🔧 Configuration avancée (optionnel)

Dans Render Dashboard > Settings:
- **Environment**: Node
- **Region**: Choisissez la plus proche (Europe recommandée)
- **Instance Type**: Free

### Variables d'environnement (ajoutez si vous voulez):
```
SESSION_SECRET=votre_secret_long_et_aleatoire_123456789
```

## ⚠️ Important: Persistence des données

**Version Gratuite Render:**
- SQLite fonctionne mais les données peuvent être réinitialisées après redémarrage
- Pour production réelle, migrez vers PostgreSQL (Render offre PostgreSQL gratuit)

**Pour PostgreSQL gratuit:**
1. Dans Render: "New +" > "PostgreSQL"
2. Copiez l'URL de connexion
3. Ajoutez comme variable d'environnement: `DATABASE_URL`
4. Le code détectera automatiquement PostgreSQL

## 📱 URLs après déploiement

- **Site public**: https://votre-nom.onrender.com
- **Admin**: https://votre-nom.onrender.com/index.html
- **Rendez-vous**: https://votre-nom.onrender.com/rendez-vous.html

## 🛟 Support

Si vous avez des erreurs:
1. Vérifiez les logs dans Render Dashboard
2. Assurez-vous que `npm install` s'est bien exécuté
3. Vérifiez que le port est bien détecté (10000 par défaut sur Render)

---
**Votre système sera en ligne en 5 minutes! 🚀**
