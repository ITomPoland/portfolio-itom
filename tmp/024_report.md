# Rapport performance mini-ville — tâche 024

## Changements réalisés

- La rangée fixe de **10 poteaux de rue** est maintenant rendue par deux `InstancedMesh`
  (fûts + têtes). Les `SimplePole` individuels des lampadaires de place restent intacts : ils
  sont les fallbacks montables séparément des `Suspense` / `ErrorBoundary` des GLB.
- L'herbe conserve `alphaTest={0.35}` mais n'utilise plus `transparent`. Les zones opaques
  écrivent donc dans le depth buffer sans tri alpha par objet.
- Les étoiles deviennent `visible=false` tant que leur opacité vaut zéro. Le groupe lune + halo
  devient lui aussi invisible de jour. La transition jour/nuit reste pilotée par les refs dans
  `useFrame`, sans `setState` ni allocation par frame.

## Gain attendu

La consigne historique mentionnait 20 poteaux fixes / 40 draws. Le code actuel contient en
réalité 10 entrées dans `streetLamps`, soit 20 meshes/draws (un fût et une tête par poteau).
Le rendu passe donc de **20 à 2 draws**, soit **18 draws économisés**. Les huit fallbacks de
lampadaires GLB ne sont pas inclus : ils ne sont rendus qu'en cas de chargement/erreur.

## Compromis visuels à valider

- `alphaTest` garde le seuil existant de 0,35. Vérifier sur mobile et en mouvement que les bords
  de l'herbe restent satisfaisants ; le bénéfice est l'absence de tri alpha.
- La lune et les étoiles ne sont plus soumises au rendu lorsqu'elles sont invisibles. Leur
  apparition reprend au même seuil et avec les mêmes opacités qu'avant.
- Les matrices des instances reprennent les coordonnées existantes des poteaux fixes. Une QA
  visuelle avec `?perf`, de jour puis de nuit, reste nécessaire pour confirmer le rendu et les
  compteurs réels du GPU.
