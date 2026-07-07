# W12 — Paiement : Stripe Checkout hébergé (redirection pleine page)

Branche : `web/12-stripe` → PR vers `feature/mini-ville`. Dépend de W09–W11 (session D).

## Objectif
Vente réelle avec la surface de risque MINIMALE : bouton « Acheter » → session **Stripe Checkout
hébergée** (redirection pleine page chez Stripe) → retour succès/annulation → webhook signé qui
décrémente le stock. Aucune donnée carte, aucun stripe.js sur notre origine : la CSP stricte de
`public/_headers` ne doit PAS être élargie (contrainte dure — si tu crois devoir l'élargir, tu
fais fausse route, re-lis l'approche redirection).

## Instructions
1. `functions/api/checkout.js` : POST `{ productId, quantity }` → vérifie produit actif + stock en
   D1 → crée la session via l'API REST Stripe (fetch server-side, secret `STRIPE_SECRET_KEY` en
   env) avec `success_url`/`cancel_url` sur notre domaine → répond `{ url }` ; le front fait
   `window.location.assign(url)` (redirection top-level = hors CSP connect-src). Prix TOUJOURS lu
   depuis D1, jamais depuis le client.
2. `functions/api/stripe-webhook.js` : POST — **vérification de la signature**
   (`stripe-signature`, secret `STRIPE_WEBHOOK_SECRET`, HMAC-SHA256 implémenté via WebCrypto —
   pas de SDK npm lourd si évitable) ; sur `checkout.session.completed` : décrément de stock
   transactionnel (`stock = stock - ? WHERE id = ? AND stock >= ?`) + journal en table `orders`
   (id session, produit, montant, timestamp — PAS de données personnelles au-delà du nécessaire,
   noter la question RGPD dans la PR).
3. Front : sur la fiche produit, bouton « Acheter » (si `price_cents` et stock > 0) à CÔTÉ du CTA
   démo existant ; pages/états succès et annulation simples en français. Rien avant le clic.
4. Mode test Stripe documenté dans la PR (clés test, `stripe listen` ou webhook test) ; ne
   committer AUCUNE clé, compléter `.env.example`/runbook.
5. Tests : checkout refuse produit inactif/stock 0/quantité invalide ; webhook rejette signature
   invalide ; décrément jamais négatif.

## Critère de fin
`npm test` vert, build OK, parcours test local complet documenté (curl + wrangler dev, sorties
dans la PR), CSP inchangée, zéro secret dans le diff (vérifier avant de pousser).
