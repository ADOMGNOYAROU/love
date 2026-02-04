# Projet Saint-Valentine 💕

Application web interactive de demande de Saint-Valentine avec identification des participants et sauvegarde des réponses.

## 🏗️ Structure du projet

```
valentine-proposal/
├── public/
│   ├── index.html          # Page principale
│   ├── success.html        # Page de succès (optionnelle)
│   └── assets/
│       └── images/         # Images et GIFs
├── src/
│   ├── js/
│   │   ├── main.js         # Logique principale
│   │   ├── database.js     # Connexion Supabase
│   │   └── utils.js        # Fonctions utilitaires
│   └── css/
│       └── custom.css      # Styles personnalisés
├── supabase/
│   ├── migrations/         # Scripts de migration
│   └── functions/          # Fonctions edge (optionnelles)
├── package.json            # Dépendances
└── README.md              # Documentation
```

## 🚀 Technologies utilisées

- **Frontend** : HTML5, TailwindCSS, JavaScript vanilla
- **Backend** : Supabase (PostgreSQL + Auth + Edge Functions)
- **Hébergement** : Vercel/Netlify (frontend) + Supabase (backend)

## 📊 Schéma de la base de données

### Table `proposals`
```sql
CREATE TABLE proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  from_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response TEXT, -- 'OUI', 'NON', 'PENDING'
  responded_at TIMESTAMP WITH TIME ZONE,
  actual_responder_name TEXT,
  unique_url_id TEXT UNIQUE NOT NULL
);
```

### Table `responses`
```sql
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  response TEXT NOT NULL, -- 'OUI', 'NON_TENTATIVE'
  responder_name TEXT NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT, -- Pour sécurité basique
  user_agent TEXT
);
```

## 🔐 Sécurité

- Sanitization des paramètres URL
- Validation des entrées utilisateur
- Protection contre réponses multiples
- Rate limiting basique
- Politiques RLS (Row Level Security) Supabase

## 📱 Responsive Design

- Mobile-first approach
- Adaptation desktop/tablet/mobile
- Touch-friendly buttons
- Optimisation performance

## 🎯 Fonctionnalités

- ✅ Identification demandeur/répondeur
- ✅ Liens uniques personnalisés
- ✅ Boutons interactifs (Oui/Non)
- ✅ Sauvegarde en base de données
- ✅ Consultation des résultats
- ✅ Protection réponses multiples
- ✅ Sécurité basique
- ✅ Design responsive
- ✅ Animations et micro-interactions
