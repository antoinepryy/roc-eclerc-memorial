# Plan d'Implémentation — Espace Mémoriel Roc Eclerc

## Architecture Générale

Le projet sera développé comme un **module intégré au site Roc Eclerc Nancy existant** (Next.js 16 + Tailwind v4 + TypeScript), et non comme une application séparée. Cela permet de réutiliser le design system, le SEO, et l'hébergement Vercel.

### Stack technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | Next.js 16 (App Router) + React 19 + Tailwind v4 | Cohérence avec le site existant |
| Base de données | PostgreSQL (Supabase ou Neon) | Données relationnelles, auth intégrée, gratuit en dev |
| Stockage médias | Cloudflare R2 ou Vercel Blob | Photos, vidéos, PDFs — pas cher, CDN intégré |
| Authentification | Supabase Auth ou NextAuth.js | Accès famille (lien magique) + accès agence (login) |
| Génération vidéo | Remotion (SSR) | Rendu vidéo côté serveur, React-based, open source |
| Génération texte IA | API Claude (Anthropic) | Textes hommage personnalisés |
| Email | EmailJS (déjà utilisé) ou Resend | Notifications aux familles |
| QR Code | `qrcode` (npm) | Génération côté serveur |
| Déploiement | Vercel | Déjà en place pour le site |

---

## Phase 1 — Conception & Setup (2-3 semaines)

### 1.1 Setup projet
- [ ] Créer la branche `feat/memorial` sur le repo roc-eclerc-nancy
- [ ] Installer les dépendances : Supabase client, Cloudflare R2 SDK, qrcode
- [ ] Configurer la base de données (schema initial)
- [ ] Configurer le stockage médias (bucket R2 ou Vercel Blob)
- [ ] Variables d'environnement (.env.local)

### 1.2 Schéma de données

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│    defunts       │     │   condoleances    │     │   medias          │
├─────────────────┤     ├──────────────────┤     ├───────────────────┤
│ id (uuid)        │◄───┤ defunt_id (fk)    │     │ id (uuid)         │
│ slug (unique)    │     │ id (uuid)         │     │ defunt_id (fk)    │
│ prenom           │     │ auteur_nom        │     │ type (photo/video)│
│ nom              │     │ auteur_email      │     │ url               │
│ date_naissance   │     │ message           │     │ caption           │
│ date_deces       │     │ type (texte/audio) │    │ ordre             │
│ photo_url        │     │ media_url         │     │ created_at        │
│ texte_annonce    │     │ statut (en_attente │     └───────────────────┘
│ ceremonie_date   │     │   /approuvé/rejeté)│
│ ceremonie_lieu   │     │ created_at        │     ┌───────────────────┐
│ ceremonie_heure  │     └──────────────────┘     │   videos_hommage   │
│ statut (brouillon│                               ├───────────────────┤
│   /publié/archivé)│    ┌──────────────────┐     │ id (uuid)         │
│ acces (public    │     │   utilisateurs    │     │ defunt_id (fk)    │
│   /privé)        │     ├──────────────────┤     │ theme             │
│ token_famille    │     │ id (uuid)         │     │ musique           │
│ qr_code_url      │     │ email             │     │ texte_overlay     │
│ created_at       │     │ nom               │     │ statut (en_cours  │
│ created_by (fk)  │     │ role (agence      │     │   /terminé/erreur)│
└─────────────────┘     │   /famille)       │     │ video_url         │
                         │ password_hash     │     │ created_at        │
                         │ created_at        │     └───────────────────┘
                         └──────────────────┘

                         ┌──────────────────┐
                         │  textes_hommage   │
                         ├──────────────────┤
                         │ id (uuid)         │
                         │ defunt_id (fk)    │
                         │ contenu           │
                         │ audio_url         │
                         │ pdf_url           │
                         │ created_at        │
                         └──────────────────┘
```

### 1.3 Maquettes UI/UX
- [ ] Page mémorielle publique (fiche défunt + condoléances + galerie + vidéo)
- [ ] Formulaire de condoléances
- [ ] Interface de création vidéo hommage (wizard 3 étapes)
- [ ] Formulaire de génération texte hommage
- [ ] Back-office agence (dashboard, liste, création, modération)
- [ ] Version mobile de tous les écrans

---

## Phase 2 — MVP (6-8 semaines)

### 2.1 Routes & Pages (semaine 1-2)

Nouvelles routes dans `src/app/` :

```
src/app/
├── memorial/
│   ├── page.tsx                    # Liste/recherche des espaces mémoriaux
│   ├── [slug]/
│   │   ├── page.tsx                # Page mémorielle publique
│   │   ├── condoleances/
│   │   │   └── page.tsx            # Formulaire de condoléances
│   │   ├── galerie/
│   │   │   └── page.tsx            # Galerie photos
│   │   └── hommage/
│   │       ├── video/
│   │       │   └── page.tsx        # Créateur vidéo hommage
│   │       └── texte/
│   │           └── page.tsx        # Générateur texte hommage
├── admin/
│   ├── layout.tsx                  # Layout admin (auth requise)
│   ├── page.tsx                    # Dashboard
│   ├── memorial/
│   │   ├── page.tsx                # Liste des fiches
│   │   ├── nouveau/
│   │   │   └── page.tsx            # Création fiche
│   │   └── [id]/
│   │       ├── page.tsx            # Édition fiche
│   │       └── condoleances/
│   │           └── page.tsx        # Modération condoléances
```

### 2.2 Fiche Mémorielle (semaine 1-2)
- [ ] **API** : CRUD défunts (`src/app/api/memorial/`)
- [ ] **Page publique** `/memorial/[slug]` : affichage fiche avec photo, dates, texte, infos cérémonie
- [ ] **Composants** : `MemorialCard`, `MemorialHeader`, `CeremonieInfo`
- [ ] Génération du slug automatique (prenom-nom-annee)
- [ ] Génération QR code (PNG + SVG) via API route
- [ ] Meta tags Open Graph pour le partage social
- [ ] Page `/memorial` : liste des avis récents + recherche par nom

### 2.3 Galerie Photos (semaine 2-3)
- [ ] Upload photos : drag & drop + sélection fichier (max 20 photos, 5 Mo chacune)
- [ ] Stockage sur R2/Blob avec optimisation (resize, WebP)
- [ ] Composant diaporama (carousel responsive)
- [ ] Réorganisation par drag & drop (ordre d'affichage)
- [ ] Accès upload protégé par token famille

### 2.4 Registre de Condoléances (semaine 3-4)
- [ ] Formulaire : nom, email (optionnel), message texte
- [ ] Anti-spam : honeypot + rate limiting
- [ ] Statut par défaut : `en_attente` (modération)
- [ ] Affichage des condoléances approuvées sur la page mémorielle
- [ ] Notification email à la famille (via EmailJS / Resend)
- [ ] API route pour la modération (approuver/rejeter)

### 2.5 Vidéo Hommage — Version basique (semaine 4-6)
- [ ] **Wizard 3 étapes** :
  1. Sélection des photos (depuis la galerie ou upload)
  2. Choix du thème visuel + musique de fond
  3. Ajout de textes overlay (nom, dates, citation)
- [ ] **Thèmes prédéfinis** : 4-5 thèmes (Nature, Ciel, Forêt, Mer, Nuit étoilée)
- [ ] **Musiques** : 6-8 morceaux libres de droits (classés par ambiance)
- [ ] **Prévisualisation** dans le navigateur (Remotion Player)
- [ ] **Rendu serveur** : API route qui lance Remotion SSR → fichier MP4
- [ ] Stockage de la vidéo générée sur R2/Blob
- [ ] Téléchargement + boutons de partage (lien, copier, réseaux sociaux)

### 2.6 Back-office Agence (semaine 5-7)
- [ ] **Authentification** : login email/mot de passe (Supabase Auth ou NextAuth)
- [ ] **Dashboard** : nombre de fiches actives, condoléances en attente, vidéos générées
- [ ] **CRUD fiches** : créer, modifier, archiver, supprimer un espace mémoriel
- [ ] **Modération** : liste des condoléances en attente, approuver/rejeter en lot
- [ ] **Gestion accès famille** : générer/régénérer le token d'accès famille
- [ ] Design cohérent avec la charte Roc Eclerc (bleu marine, doré, Poppins)

### 2.7 QR Code & Partage (semaine 7)
- [ ] Génération automatique du QR code à la création de la fiche
- [ ] API route `/api/memorial/[slug]/qrcode` → PNG haute résolution
- [ ] Page de téléchargement QR code (pour impression)
- [ ] Boutons de partage : copier le lien, WhatsApp, Facebook, email

### 2.8 Intégration au site existant (semaine 7-8)
- [ ] Lien dans la navigation principale vers `/memorial`
- [ ] Widget "Derniers avis" sur la page d'accueil (optionnel)
- [ ] Lien depuis la page `/avis-de-deces` existante vers les espaces mémoriaux
- [ ] SEO : sitemap dynamique pour les pages mémorielles

---

## Phase 3 — Texte Hommage IA (2-3 semaines)

### 3.1 Formulaire guidé
- [ ] Formulaire multi-étapes :
  1. Identité (prénom, surnom, âge)
  2. Personnalité (traits de caractère, 5-6 checkboxes + champ libre)
  3. Passions & activités
  4. Anecdotes / souvenirs marquants (champ libre)
  5. Ton souhaité (solennel, chaleureux, léger, poétique)
- [ ] Sauvegarde brouillon automatique

### 3.2 Génération via API Claude
- [ ] API route `/api/memorial/[slug]/texte-hommage`
- [ ] Prompt engineering : instructions système + données du formulaire
- [ ] Génération d'un texte de 200-400 mots
- [ ] Possibilité de regénérer / ajuster le ton
- [ ] Sauvegarde en base

### 3.3 Export
- [ ] Affichage sur la page mémorielle (section dédiée)
- [ ] Export PDF formaté (mise en page soignée, logo Roc Eclerc)
- [ ] Téléchargement PDF

---

## Phase 4 — V2 (à planifier)

Fonctionnalités reportées, à prioriser selon les retours :

- **Condoléances multimédia** : upload audio/photo dans les condoléances
- **Faire-part vidéo** : template animé avec infos cérémonie, partageable
- **Mise en voix (TTS)** : texte hommage lu par voix synthétique, mis en musique
- **Webdiffusion** : streaming live des cérémonies (complexité élevée, possible via partenariat)
- **Lieu de repos** : carte interactive du cimetière + photo de la tombe
- **Statistiques avancées** : analytics par espace (vues, partages, messages)
- **Boutique commémorative** : produits personnalisés (signets, cadres, etc.)
- **Vidéo prévoyance** : enregistrement d'un message de son vivant

---

## Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Rendu vidéo lent/coûteux | Élevé | Limiter durée (60s max), queue de jobs, cache des rendus |
| Coût API Claude | Moyen | Rate limiting par espace, cache des textes, modèle Haiku pour les brouillons |
| Stockage médias volumineux | Moyen | Compression images, limites d'upload, nettoyage auto des espaces archivés |
| RGPD / données sensibles | Élevé | Consentement explicite, politique de rétention, droit à l'effacement |
| Modération contenu inapproprié | Moyen | Modération par défaut, filtre anti-spam, signalement |

---

## Estimation Budgétaire (coûts récurrents)

| Service | Coût estimé / mois | Notes |
|---------|-------------------|-------|
| Supabase (Pro) | ~25€ | Base de données + auth |
| Cloudflare R2 | ~5-15€ | Stockage médias (10 Go inclus gratuit) |
| Vercel (Pro) | ~20€ | Déjà en place ? |
| API Claude (Haiku) | ~5-10€ | ~100 textes/mois |
| Musiques libres | 0€ | Licences CC0 / Pixabay Audio |
| **Total estimé** | **~55-70€/mois** | Hors coût de développement |

---

## Prochaines étapes

1. **Valider ce plan** avec le client / décideur Roc Eclerc
2. **Choisir la base de données** (Supabase vs Neon vs autre)
3. **Créer les maquettes** (Figma) pour la page mémorielle + back-office
4. **Initialiser le projet** : branche git, dépendances, schema DB
5. **Commencer Phase 2.2** : fiche mémorielle (la brique fondatrice)
