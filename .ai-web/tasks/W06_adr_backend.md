# W06 — ADR : choix du backend (boutique réelle + back-office)

Branche : `web/06-adr-backend` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout. **Tâche recherche + rédaction : ZÉRO code.**

## Objectif
Décision produit : la ville d'abord, le backend ensuite — mais le choix doit être préparé
sérieusement. Périmètre serveur à terme : **boutique réelle** (panier, checkout, paiement, stock)
+ **back-office éditable** (admin catalogue). Supabase est pressenti mais **PAS verrouillé** (le
client en doute) : produire un comparatif honnête, pas un plaidoyer.

## Contexte
Aujourd'hui : site 100 % statique (Cloudflare Pages, cf. `public/_headers`), analytics PostHog
opt-in RGPD, formulaire contact Web3Forms, boutique = vitrine (données dans
`src/components/canvas/rooms/Studio/productData.js`). Public cible en France → RGPD et résidence
des données UE comptent. Un audit de sécurité dédié est prévu après l'implémentation backend.

## Instructions
1. Livrable : `docs/adr/001-choix-backend.md` (format ADR : Contexte / Options / Décision
   recommandée / Conséquences).
2. Comparer AU MOINS : **Supabase**, **Firebase**, **PocketBase**, **Appwrite**, **stack custom**
  (Node/Hono + Postgres managé), et l'angle e-commerce spécifiquement (Stripe intégré à la main
   vs solution dédiée type Medusa vs panier tiers type Snipcart).
3. Critères OBLIGATOIRES du tableau : coût réel à petite échelle (0→quelques milliers de
   commandes/mois, prix **2026 vérifiés par recherche web, sources citées**), résidence UE/RGPD,
   auth, intégration paiement (Stripe), effort pour le back-office admin, lock-in/réversibilité,
   surface de sécurité (RLS/règles/API exposée — l'audit post-backend en dépend), compatibilité
   avec l'hébergement statique actuel (le front reste sur Cloudflare Pages).
4. Recommandation argumentée (option principale + plan B) + **plan de migration par phases**
   (phase 1 : catalogue lisible depuis le back-office sans paiement ; phase 2 : panier/checkout ;
   phase 3 : stock/emails), chaque phase livrable indépendamment.
5. Ton : neutre, chiffré, hypothèses explicites. Si une info est introuvable, le dire.

## Critère de fin
ADR complet, sources citées (liens), tableau comparatif lisible, recommandation + plan de
migration. Aucun fichier hors `docs/` modifié.
