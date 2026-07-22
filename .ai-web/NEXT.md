# NEXT — relais des sessions web

**Prochaine session : B** (W05 manualChunks + W07 docs) — voir `.ai-web/tasks/README.md`.

État : 
- W01 (tests) : ✅ FAITE
- W02 (CI) : ✅ FAITE EN LOCAL
- W03 (safeOpen) : ✅ FAITE (branche `web/03-safeopen`)
- W04 (a11y DOM) : ✅ FAITE (branche `web/04-a11y`)
- W05 (manualChunks) : ✅ FAITE + MERGÉE (`512146e`) — chunk d'entrée 1,44 Mo → 68 Ko, vendors isolés
  (three/r3f/gsap/posthog/react). `visualizer` opt-in via `ANALYZE=true npm run build`.
- W07 (docs systèmes) : ✅ FAITE + MERGÉE (`906c01d`) — `docs/systems.md` + JSDoc, zéro changement de
  comportement (invariants vérifiés : villeConfig/SceneContext/PerformanceContext/analytics/DoorSection intacts).
- W09 (backend D1 + API) : ✅ FAITE + MERGÉE (`2505032`) — voir `.ai/HANDOFF.md` §B (runbook D1 côté utilisateur).
- W10–W15 à faire. W06 supprimée.
- ⚠️ Ces 3 sessions ont été exécutées via worktrees isolés + sous-agents Cursor (modèles adaptés :
  Gemini Flash pour B, GPT-5.6 pour C), PAS via le flux web claude.ai/code. Toutes relues + mergées par l'EM.

Commande à coller dans une nouvelle session :
« Lis CLAUDE.md puis exécute la Session B de .ai-web/tasks/README.md »

(À la fin de ta session : mets ce fichier à jour dans ta dernière PR, puis dis à l'utilisateur de
changer de session — protocole relais CLAUDE.md §4.)
