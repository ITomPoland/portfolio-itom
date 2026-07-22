# Rapport W09 — Fondations backend D1 + API produits

## Livrables

- `wrangler.toml` : configuration Cloudflare Pages, sortie `dist`, binding D1
  `PRODUCTS_DB`, base `hakkilo-catalogue` et UUID local factice documenté.
- `migrations/0001_products.sql` : création de la table `products` et index sur `active`.
- `migrations/0002_seed.sql` : seed de 8 produits généré depuis la source statique.
- `scripts/generate-product-seed.js` : générateur déterministe du seed, avec validation des champs.
- `functions/api/products.js` : liste des produits actifs.
- `functions/api/products/[id].js` : détail d'un produit actif par identifiant.
- `package.json` / `package-lock.json` : Wrangler ajouté uniquement en `devDependency`.

Le front et `productData.js` n'ont pas été modifiés : le fallback statique reste intact.

## Schéma dérivé

Les champs réels de `productData.js` sont stockés sans perte :

- `id`, `category`, `scale`, `title`, `date`, `description`, `url` ;
- `platformConfig` sous forme JSON validée dans `platform_config` ;
- `ctaLabel` dans `cta_label`.

Les champs backend demandés sont également présents : `stock` (défaut 0, entier positif),
`price_cents` (nullable, entier positif), `active` (0/1, défaut 1), `created_at` et `updated_at`.
Le script refuse de générer le seed si la forme des objets de `productData.js` dérive.

## Contrat API et sécurité

- `GET /api/products` renvoie `{ "products": [...] }` et filtre `active = 1`.
- `GET /api/products/:id` renvoie `{ "products": [produit] }`, ou une erreur JSON 404.
- Toutes les entrées SQL dynamiques utilisent des requêtes préparées avec `.bind()`.
- Succès : `Cache-Control: public, max-age=60`.
- Erreurs : `Cache-Control: no-store`, sans stack trace.
- Toutes les réponses : `Content-Type: application/json; charset=utf-8` et
  `X-Content-Type-Options: nosniff`.
- Aucun en-tête CORS n'est ajouté ; l'accès navigateur reste same-origin.
- `public/_headers` et sa CSP n'ont pas été modifiés.

## Runbook D1 distant

À exécuter depuis la racine du dépôt après authentification Cloudflare :

```powershell
npx wrangler login
npx wrangler d1 create hakkilo-catalogue
```

1. Copier le `database_id` retourné dans `wrangler.toml` à la place de
   `00000000-0000-0000-0000-000000000000`.
2. Dans Cloudflare Dashboard : **Workers & Pages → projet Hakkilo XR → Settings → Bindings →
   Add binding → D1 database** ; variable `PRODUCTS_DB`, base `hakkilo-catalogue`.
3. Appliquer les migrations à la base distante :

```powershell
npx wrangler d1 migrations apply PRODUCTS_DB --remote
```

Commande de régénération du seed si `productData.js` change :

```powershell
node scripts/generate-product-seed.js
```

## Vérifications locales

Commandes exécutées :

```powershell
npx wrangler d1 migrations apply PRODUCTS_DB --local
npm run build
npx wrangler pages dev dist --port 8788 --persist-to .wrangler/state
curl.exe -sS -i http://127.0.0.1:8788/api/products
curl.exe -sS -i http://127.0.0.1:8788/api/products/headset-01
curl.exe -sS -i http://127.0.0.1:8788/api/products/inexistant
```

Wrangler 4 exécute `pages dev` localement par défaut et n'expose plus d'option `--local` pour
cette commande. L'option `--local` a bien été utilisée pour appliquer les migrations D1.

Résultat migrations :

```text
Resource location: local
0001_products.sql  ✅
0002_seed.sql      ✅
```

Sortie liste :

```http
HTTP/1.1 200 OK
Content-Length: 4195
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=60
X-Content-Type-Options: nosniff

{"products":[{"id":"basestation-01","category":"basestation","scale":1,"platformConfig":{"label":"Base de tracking"},"title":"Hakkilo Anchor","date":"Borne de suivi spatial","description":"Borne de tracking spatial à balayage laser. Assure une synchronisation millimétrique et une couverture étendue pour les déploiements de réalité virtuelle en salle multi-utilisateurs.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"hapticglove-01","category":"hapticglove","scale":1,"platformConfig":{"label":"Gant haptique"},"title":"Hakkilo Glove","date":"Gant à retour de force","description":"Gant haptique professionnel permettant de ressentir les textures, les formes et la résistance des objets virtuels manipulés, idéal pour les entraînements de chirurgie et de maintenance industrielle.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"glasses-01","category":"glasses","scale":1,"platformConfig":{"label":"Lunettes connectées"},"title":"Hakkilo Lens","date":"Réalité augmentée légère","description":"Des lunettes connectées légères pour des expériences de réalité augmentée au quotidien : affichage discret, autonomie toute la journée, compagnon idéal du casque Hakkilo One.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"headset-01","category":"headset","scale":1,"platformConfig":{"label":"Casque VR"},"title":"Hakkilo One","date":"Casque VR autonome","description":"Notre casque de réalité virtuelle autonome, pensé pour l'exploration immersive et la formation professionnelle : suivi 6 degrés de liberté, résolution 4K par œil, 3h d'autonomie.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"console-01","category":"console","scale":1,"platformConfig":{"label":"Console de jeu"},"title":"Hakkilo Play","date":"Console de jeu compacte","description":"Une console compacte pensée pour les expériences interactives présentées en boutique et en formation, compatible avec l'ensemble du catalogue Hakkilo XR.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"drone-01","category":"drone","scale":1,"platformConfig":{"label":"Drone photogrammétrique"},"title":"Hakkilo ScanFly","date":"Captation 3D & Photogrammétrie","description":"Un drone autonome équipé de capteurs LiDAR et caméras haute résolution pour la numérisation 3D d'environnements réels à grande échelle, facilitant la création de jumeaux numériques.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"scanner-01","category":"scanner3d","scale":1,"platformConfig":{"label":"Scanner 3D"},"title":"Hakkilo ScanHand","date":"Scanner 3D portable","description":"Scanner laser portable de qualité métrologique. Permet de capturer instantanément des objets physiques avec une précision submillimétrique pour leur intégration dans des scènes XR.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"},{"id":"controller-01","category":"controller","scale":1,"platformConfig":{"label":"Contrôleurs XR"},"title":"Hakkilo Touch","date":"Contrôleurs de mouvement","description":"Paire de contrôleurs ergonomiques pour le casque Hakkilo One. Offrent un suivi infrarouge de haute précision et un retour tactile nuancé pour des interactions naturelles dans l'espace virtuel.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"}]}
```

Sortie détail :

```http
HTTP/1.1 200 OK
Content-Length: 519
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=60
X-Content-Type-Options: nosniff

{"products":[{"id":"headset-01","category":"headset","scale":1,"platformConfig":{"label":"Casque VR"},"title":"Hakkilo One","date":"Casque VR autonome","description":"Notre casque de réalité virtuelle autonome, pensé pour l'exploration immersive et la formation professionnelle : suivi 6 degrés de liberté, résolution 4K par œil, 3h d'autonomie.","url":"#contact","ctaLabel":"Demander une démo ↗","stock":0,"priceCents":null,"active":true,"createdAt":"2026-07-22 20:44:51","updatedAt":"2026-07-22 20:44:51"}]}
```

Sortie 404 :

```http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
X-Content-Type-Options: nosniff

{"error":"Produit introuvable."}
```

`npm run build` : succès, 993 modules transformés. Le warning existant sur les chunks de plus
de 500 kB reste présent. Le lint ciblé des trois nouveaux fichiers JavaScript passe sans erreur.

## Points à valider par l'Engineering Manager

- Remplacer l'UUID factice après création réelle de D1.
- Confirmer le nom exact du projet Pages si le projet Dashboard n'utilise pas `hakkilo-xr`.
- Vérifier le binding `PRODUCTS_DB` dans les environnements Preview et Production.
