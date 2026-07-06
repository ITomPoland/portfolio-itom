# Tâches Claude Code web — Hakkilo XR

Backlog des sessions **claude.ai/code** sur ce dépôt. Lire `CLAUDE.md` (racine) d'abord : charte,
invariants, workflow (base `feature/mini-ville`, branche `web/NN-slug`, PR, jamais de merge).

Une session = une tâche. Prendre la première tâche non commencée dans l'ordre ci-dessous, sauf
consigne contraire de l'utilisateur.

| # | Tâche | Fichier | Dépendances / ordre |
|---|-------|---------|---------------------|
| W01 | Infrastructure de tests (Vitest) + tests logique pure | `W01_tests_infra.md` | À faire en premier |
| W02 | CI GitHub Actions (build + tests) | `W02_ci_github_actions.md` | Idéalement après W01 |
| W03 | safeOpen() + audit sécurité des liens externes | `W03_safeopen_liens.md` | Indépendante |
| W04 | Accessibilité de la couche DOM (a11y) | `W04_a11y_dom.md` | Indépendante |
| W05 | Optimisation bundle (manualChunks, 1.4 MB) | `W05_bundle_chunks.md` | Indépendante |
| W06 | ADR backend : comparatif complet + recommandation | `W06_adr_backend.md` | Indépendante (recherche + doc, zéro code) |
| W07 | Documentation systèmes + JSDoc | `W07_docs_systemes.md` | Indépendante (zéro changement runtime) |
| W08 | Lint : ~239 erreurs → 0 | `W08_lint_zero.md` | **EN DERNIER** (touche beaucoup de fichiers → conflits) |

Statut : une tâche est « prise » quand une PR `web/NN-*` existe ; « faite » quand la PR est mergée
par l'Engineering Manager. Ne pas modifier ces fichiers de tâches.
