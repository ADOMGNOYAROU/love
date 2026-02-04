# Guide de Déploiement - Projet Saint-Valentine 💕

## 📋 Prérequis

- Node.js 18+ (optionnel, pour le développement local)
- Compte Supabase (gratuit)
- Compte Vercel/Netlify (pour l'hébergement)

## 🚀 Étape 1 : Configuration Supabase

### 1. Créer le projet
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL et la clé anon

### 2. Configurer la base de données
1. Dans le dashboard Supabase, allez dans "SQL Editor"
2. Exécutez le script `supabase/migrations/001_create_tables.sql`
3. Vérifiez que les tables `proposals` et `responses` sont créées

### 3. Mettre à jour les clés
Dans `src/js/database.js`, remplacez :
```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anonyme';
```

## 🌐 Étape 2 : Déploiement Frontend

### Option A : Vercel (recommandé)

1. **Installer Vercel CLI**
```bash
npm i -g vercel
```

2. **Déployer**
```bash
cd valentine-proposal
vercel --prod
```

3. **Configurer les variables d'environnement** (dans le dashboard Vercel) :
```
NEXT_PUBLIC_SUPABASE_URL=votre-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anonyme
```

### Option B : Netlify

1. **Installer Netlify CLI**
```bash
npm i -g netlify-cli
```

2. **Déployer**
```bash
cd valentine-proposal/public
netlify deploy --prod --dir .
```

3. **Configurer les variables d'environnement** dans le dashboard Netlify

### Option C : Hébergement statique

1. **Uploader le dossier `public`** sur votre hébergeur
2. **Modifier les clés Supabase** directement dans `src/js/database.js`

## 🔧 Étape 3 : Configuration finale

### 1. Mettre à jour les URLs
Assurez-vous que les URLs dans les fichiers pointent vers votre domaine :
- Dans `public/index.html` : les chemins des scripts
- Dans `src/js/main.js` : les redirections

### 2. Tester le déploiement
1. Créez une demande de test
2. Vérifiez que le lien généré fonctionne
3. Testez la soumission de réponse
4. Vérifiez l'affichage des résultats

## 📊 Étape 4 : Monitoring (optionnel)

### Analytics Supabase
1. Activez les analytics dans le dashboard Supabase
2. Surveillez les performances des requêtes

### Monitoring externe
1. Configurez Uptime Robot pour surveiller le site
2. Ajoutez Google Analytics si souhaité

## 🔒 Étape 5 : Sécurité

### 1. Activer RLS (Row Level Security)
Les politiques sont déjà configurées dans le script SQL, mais vérifiez :
```sql
-- Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Limiter les requêtes
Ajoutez des limites de taux si nécessaire dans les fonctions edge Supabase

## 🎯 Étape 6 : Personnalisation

### 1. Modifier les couleurs
Dans `src/css/custom.css`, modifiez les variables de couleur :
```css
:root {
  --primary-pink: #ff69b4;
  --secondary-pink: #ff1493;
  --accent-purple: #9333ea;
}
```

### 2. Personnaliser les messages
Dans `src/js/main.js`, modifiez les textes des notifications et messages

### 3. Ajouter votre logo
Remplacez les emojis par votre logo dans `public/index.html`

## 📱 Étape 7 : Tests

### Checklist de test :
- [ ] Création de demande fonctionne
- [ ] Lien de partage fonctionne
- [ ] Réponse Oui s'enregistre
- [ ] Bouton Non fuit correctement
- [ ] Résultats s'affichent
- [ ] Responsive mobile/desktop
- [ ] Accessibilité clavier
- [ ] Performance acceptable

## 🚨 Dépannage

### Problèmes courants :

**"Erreur de connexion Supabase"**
- Vérifiez les clés dans `database.js`
- Assurez-vous que le projet Supabase est actif

**"Les réponses ne s'enregistrent pas"**
- Vérifiez les politiques RLS
- Testez avec les outils de développement Supabase

**"Le site est lent"**
- Optimisez les images
- Vérifiez la taille des bundles JavaScript
- Activez la mise en cache

## 📈 Maintenance

### Tâches mensuelles :
1. Vérifier les logs d'erreurs
2. Nettoyer les anciennes données (si nécessaire)
3. Mettre à jour les dépendances
4. Surveiller l'utilisation de la base de données

### Backup :
Supabase gère automatiquement les backups, mais vous pouvez :
- Exporter manuellement les données importantes
- Configurer des backups automatiques supplémentaires

## 🎉 Félicitations !

Votre application Saint-Valentine est maintenant en ligne ! 

Pour toute question ou problème, consultez la documentation ou contactez le support technique.
