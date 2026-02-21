# 🩸 PREWEST - Plateforme de Prélèvement à Domicile

Système complet de gestion des prélèvements sanguins et analyses biologiques à domicile.

## 📁 Structure du Projet

```
prewest/
├── package.json          # Dépendances Node.js
├── server.js             # Serveur principal (Express)
├── database.db           # Base de données SQLite (créée automatiquement)
├── uploads/              # Dossier des résultats PDF
└── frontend/             # Interface utilisateur
    ├── index.html        # Page de connexion
    ├── rendez-vous.html  # Prise de rendez-vous (public)
    ├── admin.html        # Panel Admin
    ├── patient.html      # Espace Patient
    └── css/style.css     # Styles
```

## 🚀 Installation Locale

### 1. Prérequis
- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)

### 2. Installation

```bash
# Extraire le fichier prewest.zip
cd prewest

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

### 3. Accès
- **Application**: http://localhost:3000
- **Admin**: http://localhost:3000/index.html
  - Username: `admin`
  - Password: `admin123` (à changer à la première connexion)

## 🌐 Déploiement Gratuit (Railway.app)

### Étape 1: Créer un compte Railway
1. Allez sur https://railway.app
2. Connectez-vous avec GitHub
3. Cliquez sur "New Project"
4. Choisissez "Deploy from GitHub repo"

### Étape 2: Préparer le projet pour GitHub
```bash
# Initialiser Git
git init

# Créer .gitignore
echo "node_modules/
uploads/
.env
*.log" > .gitignore

# Commit
git add .
git commit -m "Initial commit"

# Créer repo GitHub et push
git remote add origin https://github.com/VOTRE_USERNAME/prewest.git
git push -u origin main
```

### Étape 3: Déployer sur Railway
1. Dans Railway, sélectionnez votre repo `prewest`
2. Cliquez sur "Deploy"
3. Railway détectera automatiquement Node.js
4. Attendez la fin du déploiement (2-3 minutes)

### Étape 4: Obtenir l'URL
- Railway génère une URL gratuite: `https://prewest-production.up.railway.app`
- Votre application est maintenant accessible de partout dans le monde!

## 🌍 Configuration d'un Domaine Personnalisé

### Option 1: Nom de domaine gratuit (Freenom)
1. Allez sur https://freenom.com
2. Cherchez un domaine gratuit (.tk, .ml, .ga, .cf, .gq)
3. Exemple: `prewest.tk`
4. Dans Railway:
   - Allez dans Settings > Domains
   - Cliquez "Custom Domain"
   - Entrez: `prewest.tk`
   - Copiez l'adresse DNS (CNAME)
5. Dans Freenom:
   - Gérez DNS > CNAME
   - Ajoutez: `www` → [adresse Railway]

### Option 2: Nom de domaine payant (GoDaddy, Namecheap, OVH...)
1. Achetez le domaine (ex: `prewest.dz`)
2. Dans Railway:
   - Settings > Domains > Custom Domain
   - Entrez: `prewest.dz`
   - Copiez l'adresse IP ou CNAME
3. Dans le panel de votre registrar:
   - Ajoutez un enregistrement A ou CNAME pointant vers Railway

### Option 3: Sous-domaine gratuit (DuckDNS)
1. Allez sur https://www.duckdns.org
2. Connectez-vous avec GitHub/Google
3. Créez un sous-domaine: `prewest.duckdns.org`
4. Dans Railway:
   - Settings > Domains > Custom Domain
   - Entrez: `prewest.duckdns.org`
5. Dans DuckDNS:
   - Collez l'IP de Railway

## 🗄️ Migration vers une Base de Données Réelle (PostgreSQL)

### Pourquoi migrer?
- SQLite est parfait pour le début
- PostgreSQL est mieux pour la production à grande échelle
- Railway offre PostgreSQL gratuit

### Étape 1: Créer la base PostgreSQL sur Railway
1. Dans votre projet Railway, cliquez "New"
2. Choisissez "Database" > "Add PostgreSQL"
3. Attendez la création (1 minute)
4. Allez dans "Variables" de PostgreSQL
5. Copiez `DATABASE_URL` (format: `postgresql://user:pass@host:port/db`)

### Étape 2: Modifier server.js
Remplacez la partie connexion SQLite par:

```javascript
const { Pool } = require('pg');

// Connexion PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Au lieu de db.run, utilisez:
await pool.query(`CREATE TABLE IF NOT EXISTS users (...)`);
```

### Étape 3: Installer le driver PostgreSQL
```bash
npm install pg
```

### Étape 4: Déployer
```bash
git add .
git commit -m "Migration PostgreSQL"
git push
```

Railway détectera automatiquement DATABASE_URL et utilisera PostgreSQL!

## 🔒 Sécurité Recommandée

### 1. Variables d'environnement (Railway)
Dans Railway > Variables, ajoutez:
```
SESSION_SECRET=votre_secret_tres_long_et_aleatoire_123456789
NODE_ENV=production
```

### 2. HTTPS
- Railway fournit HTTPS gratuitement
- Forcez le HTTPS dans server.js:
```javascript
if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
}
```

## 📱 Fonctionnalités

### Public
- ✅ Prise de rendez-vous en ligne
- ✅ Vérification des créneaux disponibles
- ✅ Formulaire de contact

### Patient
- ✅ Connexion sécurisée
- ✅ Consultation des résultats
- ✅ Téléchargement PDF
- ✅ Changement de mot de passe

### Admin
- ✅ Création de comptes patients
- ✅ Gestion des rendez-vous (confirmer/annuler)
- ✅ Upload des résultats PDF
- ✅ Tableau de bord statistiques
- ✅ Gestion des utilisateurs

## 🛠️ Maintenance

### Backup de la base de données
```bash
# SQLite
sqlite3 database.db ".backup backup.db"

# PostgreSQL (Railway)
# Allez dans Railway > PostgreSQL > Backups
```

### Logs
```bash
# Local
npm start

# Railway
# Allez dans Railway > Deployments > View Logs
```

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs Railway
2. Consultez la documentation Node.js/SQLite
3. Ouvrez une issue sur GitHub

## 📄 Licence

MIT License - Projet libre d'utilisation.

---

**Fait avec ❤️ pour faciliter l'accès aux soins de santé**
