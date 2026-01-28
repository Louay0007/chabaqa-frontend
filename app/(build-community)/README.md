# Build Community Feature

Cette fonctionnalité permet aux utilisateurs de créer et personnaliser leurs communautés à travers un processus guidé en 3 étapes.

## Structure des fichiers

```
app/(build-community)/
├── build-community/
│   ├── page.tsx           # Page principale - Composant serveur
│   ├── loading.tsx        # État de chargement avec skeletons
│   └── actions.ts         # Actions serveur pour la soumission
├── components/
│   └── build-community-client.tsx  # Composant client interactif
├── lib/
│   └── build-community-utils.ts    # Utilitaires et types
└── layout.tsx             # Layout avec métadonnées
```

## Architecture

### 1. Organisation similaire à (auth)
- **Route group** : `(build-community)` pour organiser les routes liées
- **Composants serveur** : `page.tsx` et `layout.tsx` pour le contenu initial
- **Composants client** : Marqués avec `"use client"` pour l'interactivité
- **Actions serveur** : `actions.ts` pour la logique métier côté serveur

### 2. Séparation des responsabilités
- **`page.tsx`** : Point d'entrée simple qui importe le composant client
- **`build-community-client.tsx`** : Logique d'interface utilisateur interactive
- **`actions.ts`** : Logique de traitement des données côté serveur
- **`loading.tsx`** : États de chargement avec skeletons appropriés

### 3. Conventions Next.js
- **App Router** : Utilisation du nouveau système de routage
- **Route groups** : Organisation avec parenthèses `(folder-name)`
- **Métadonnées** : Définies dans `layout.tsx`
- **TypeScript** : Types strictement typés

## Fonctionnalités

### Étape 1 : Informations de base
- Nom de la communauté (requis)
- Bio/description (optionnel)
- Upload d'image de profil

### Étape 2 : Paramètres
- Statut : Public vs Privé
- Frais d'adhésion : Gratuit vs Payant
- Montant personnalisé pour les communautés payantes

### Étape 3 : Liens sociaux
- Instagram, Twitter, Facebook, YouTube, LinkedIn
- Validation des URLs et formats
- Tous optionnels

## Classes CSS personnalisées

```css
.community-primary-color         # Couleur principale #8e78fb
.community-primary-bg           # Arrière-plan principal
.community-gradient-btn         # Gradient pour boutons
.community-gradient-facebook    # Gradient spécial Facebook
.community-step-active          # Étapes actives du stepper
.community-step-connector-active # Connecteurs actifs
.community-button-active        # Boutons actifs
.community-button-inactive      # Boutons inactifs
```

## Validation

Le système inclut une validation complète :
- **Étape 1** : Nom requis, limites de caractères
- **Étape 2** : Validation des frais pour communautés payantes
- **Étape 3** : Validation des URLs de réseaux sociaux

## Utilisation

### Navigation
```typescript
// Accéder à la page
/build-community

// La page sera accessible à cette URL grâce au groupe de routes
```

### Types
```typescript
interface CommunityFormData {
  name: string
  bio: string
  status: "public" | "private"
  joinFee: "free" | "paid"
  customFee: string
  socialLinks: {
    instagram: string
    twitter: string
    facebook: string
    youtube: string
    linkedin: string
  }
}
```

## Prochaines étapes

1. **Intégration base de données** : Connecter les actions aux modèles de données
2. **Upload d'images** : Implémenter le stockage d'images (Cloudinary, S3)
3. **Authentification** : Vérifier que l'utilisateur est connecté
4. **Redirection** : Rediriger vers la communauté créée après soumission
5. **Tests** : Ajouter des tests unitaires et d'intégration
