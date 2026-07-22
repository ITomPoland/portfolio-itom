# Rapport W05 — Optimisation du bundle (manualChunks)

## Résumé
Découpage du bundle JavaScript monolithique initial (~1,44 MB) en vendor chunks ciblés (`three`, `@react-three/*`, `posthog-js`, `react`, `gsap`) via `vite.config.js` (`build.rollupOptions.output.manualChunks`).

---

## Tableau comparatif Avant / Après

### 1. Avant optimisation (baseline)

| Chunk | Description | Taille brute | Taille gzip |
| :--- | :--- | :--- | :--- |
| `dist/assets/index-[hash].js` | Entrypoint JS monolithique (incluait tous vendors) | 1 440.94 kB | 425.37 kB |
| `dist/assets/Experience-[hash].js` | Chunk lazy Experience 3D | 499.18 kB | 149.64 kB |
| `dist/assets/index-[hash].css` | Styles SCSS / CSS | 28.20 kB | 5.47 kB |
| **TOTAL Entrypoint JS** | | **1 440.94 kB** | **425.37 kB** |

---

### 2. Après optimisation (W05)

| Chunk | Description / Contenu | Taille brute | Taille gzip |
| :--- | :--- | :--- | :--- |
| `dist/assets/index-[hash].js` | **Entrypoint JS principal** (code applicatif pur) | **68.62 kB** | **20.82 kB** |
| `dist/assets/vendor-three-[hash].js` | Moteur 3D (`three`) | 719.76 kB | 187.26 kB |
| `dist/assets/vendor-r3f-[hash].js` | Écosystème `@react-three/*`, `r3f-perf`, `@react-spring/*` | 445.40 kB | 142.18 kB |
| `dist/assets/vendor-posthog-[hash].js` | Analytics (`posthog-js`) | 213.29 kB | 71.19 kB |
| `dist/assets/Experience-[hash].js` | Chunk 3D lazy-loaded (`Experience.jsx`) | 202.84 kB | 55.09 kB |
| `dist/assets/vendor-react-[hash].js` | Core React (`react`, `react-dom`, `scheduler`) | 196.35 kB | 61.81 kB |
| `dist/assets/vendor-gsap-[hash].js` | Animations (`gsap`) | 88.92 kB | 34.47 kB |
| `dist/assets/index-[hash].css` | Styles CSS | 28.20 kB | 5.47 kB |

---

## Gains obtenus
- **Réduction massive du chunk d'entrée `index.js`** : de **1,44 MB (425 kB gzip)** à **68 kB (20,8 kB gzip)**, soit **-95%** sur le script initial de l'application.
- **Mise en cache HTTP optimisée** : les dépendances stables (`three`, `react`, `gsap`) sont désormais isolées dans des vendor chunks distincts et réutilisables en cache par le navigateur entre les déploiements.
- **Réduction du chunk Experience** : passe de **499 kB (150 kB gzip)** à **202 kB (55 kB gzip)**.
- **Compatibilité conservée** : `vite-plugin-compression` produit l'intégralité des fichiers `.gz`. Les 54 tests Vitest passent avec succès.

---

## Note sur les routes Admin / Fallback
L'application ne contient pas encore de système de routage `/admin` dans `App.jsx` (prévu dans le backlog W11). Lors de sa future intégration, un chargement dynamique `React.lazy()` + `<Suspense>` devra être appliqué pour maintenir l'admin en chunk séparé sans impacter le bundle principal.
