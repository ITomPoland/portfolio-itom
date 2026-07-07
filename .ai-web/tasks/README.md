# Backlog Claude Code web — Hakkilo XR (DERNIÈRE ITÉRATION)

Lire `CLAUDE.md` (racine) d'abord : charte, invariants, **protocole relais §4** (1 discussion =
1 session, finir en préparant `.ai-web/NEXT.md` + dire à l'utilisateur de changer de session),
**architecture backend décidée §5** (Pages Functions + D1 + Stripe Checkout hébergé).

`NEXT.md` (racine `.ai-web/`) dit où on en est. Base = `feature/mini-ville`, une branche + une PR
par tâche, jamais de merge soi-même.

## Sessions (2-3 tâches, dans l'ordre)

| Session | Tâches | Contenu |
|---------|--------|---------|
| **A** | W02 + W03 + W04 | CI GitHub Actions ; safeOpen/liens ; a11y DOM |
| **B** | W05 + W07 | Bundle manualChunks ; docs systèmes + JSDoc |
| **C** | W09 + W10 | Fondations backend (D1 + API produits) ; front branché avec fallback |
| **D** | W11 + W12 | Back-office admin ; Stripe Checkout hébergé |
| **E** | W13 + W14 | Tests backend ; **audit de sécurité final** |
| **F** | W15 + W08 | Tests finaux + runbook release ; lint → 0 (tout dernier) |

- W01 (Vitest) : ✅ FAITE, mergée.
- W06 (ADR backend) : ✖ SUPPRIMÉE — la décision d'architecture a été prise par l'Engineering
  Manager (CLAUDE.md §5) ; W07 documente l'as-built.
- W08 reste TOUJOURS la dernière tâche (elle touche tous les fichiers).

Statut : une tâche est « prise » quand sa PR `web/NN-*` (ou `claude/*`) existe ; « faite » quand
la PR est mergée par l'Engineering Manager. Ne pas modifier ces fichiers de tâches.
