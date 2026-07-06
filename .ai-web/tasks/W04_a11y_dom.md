# W04 — Accessibilité de la couche DOM (a11y)

Branche : `web/04-a11y` (depuis `feature/mini-ville`) → PR vers `feature/mini-ville`.
Lire `CLAUDE.md` (racine) avant tout.

## Objectif
Backlog P3 : passe d'accessibilité sur la **couche DOM uniquement** (overlays, bannières, boutons,
prompts). Le canvas 3D lui-même est hors périmètre — on rend accessible tout ce qui l'entoure.

## Périmètre (fichiers typiques)
`src/components/ui/` (GlobalOverlay, ConsentBanner, VilleNavToggle, VilleThemeToggle,
VilleDoorPrompt…), `src/components/dom/`, `index.html`. NE PAS toucher aux invariants (CLAUDE.md
§2) ni à la logique 3D.

## Instructions
1. **Sémantique** : tout élément cliquable = vrai `<button>` (pas de div onClick) ; landmarks là
   où pertinent ; `lang="fr"` sur `<html>` si absent ; hiérarchie de titres cohérente dans les
   contenus DOM.
2. **Labels** : `aria-label` français sur chaque contrôle iconique (toggles nav/thème, fermeture
   overlay, etc.).
3. **GlobalOverlay** : à l'ouverture → focus déplacé dedans, `role="dialog"` + `aria-modal`,
   piège de focus léger (Tab reste dedans), fermeture par Échap si non gérée, focus rendu à
   l'élément déclencheur à la fermeture. ⚠️ Modifications ADDITIVES : ne pas casser le contrat
   `overlayContent`/`openOverlay` ni restructurer le composant.
4. **ConsentBanner** : accessible clavier, boutons explicites, annoncé aux lecteurs d'écran
   (`role`/`aria-live` approprié — ce n'est pas un dialog modal, ne pas bloquer la page).
5. **VilleDoorPrompt** : `aria-live="polite"` pour annoncer « Entrer — LABEL » quand il apparaît.
6. **Focus visible** : ne jamais supprimer l'outline sans alternative visible.
7. `prefers-reduced-motion` : respecter pour les animations **CSS/DOM** uniquement (le 3D est
   hors périmètre).

## Critère de fin
`npm run build` OK ; comportement souris/tactile strictement inchangé ; parcours clavier complet
possible sur la couche DOM (consentement → toggles → overlay → fermeture). PR : liste
des changements + points restants (avec justification si non traités).
