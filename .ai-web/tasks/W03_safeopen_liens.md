# W03 — safeOpen() + audit sécurité des liens externes

Branche : `web/03-safeopen` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout.

## Objectif
Backlog sécurité P3 (audit Fable) : durcir toutes les ouvertures de liens externes du site
(reverse tabnabbing, injection d'URL).

## Instructions
1. Créer `src/utils/safeOpen.js` : `safeOpen(url)` qui (a) n'accepte que des URLs http(s)
   absolues ou relatives au site (rejeter `javascript:`, `data:`, etc. — utiliser `new URL()` avec
   base, pas des regex maison), (b) ouvre avec `noopener,noreferrer`, (c) no-op + `console.warn`
   si l'URL est rejetée.
2. Remplacer TOUS les `window.open(...)` du code par `safeOpen` (grep exhaustif, `src/` entier).
3. Auditer tous les `target="_blank"` (JSX et HTML) : ajouter `rel="noopener noreferrer"` partout
   où il manque.
4. Auditer toute URL **dynamique** (venant de données/props) injectée dans `href`, `src`,
   `window.location` : lister chaque cas dans la PR avec verdict (sûr / corrigé / à discuter).
   Corriger seulement les cas trivialement sûrs à corriger ; ne pas restructurer des composants.
5. Tests unitaires de `safeOpen` si l'infra de test (W01) est déjà mergée ; sinon les décrire dans
   la PR pour ajout ultérieur.

## Critère de fin
`grep -rn "window.open" src/` ne renvoie plus que `safeOpen.js` ; zéro `target="_blank"` sans
`rel` ; `npm run build` OK ; comportement utilisateur inchangé (les mêmes liens s'ouvrent).
Inventaire des URLs dynamiques dans la PR.
