# 🎨 Hakkilo XR | Vitrine 3D Immersive en Réalité Virtuelle

<div align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.182-black?style=for-the-badge&logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/R3F-9.4-purple?style=for-the-badge&logo=react" alt="React Three Fiber" />
  <img src="https://img.shields.io/badge/GSAP-3.14-green?style=for-the-badge&logo=greensock" alt="GSAP" />
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
</div>

<br/>

Bienvenue sur le dépôt du site vitrine 3D interactif de **Hakkilo XR**, une startup innovante spécialisée dans la réalité virtuelle. Ce site propose une expérience immersive unique en déambulation 3D à travers un bâtiment virtuel.

> [!NOTE]
> Assurez-vous que l'accélération matérielle est activée dans les paramètres de votre navigateur pour profiter d'une expérience fluide à 60 FPS.

## 🏗️ Concept UX & Navigation

Le site est conçu comme un bâtiment unique composé d'un hall d'entrée suivi d'un couloir infini. L'utilisateur déambule au scroll :
- **Entrée principale** : Introduction de la marque.
- **Couloir infini** : Navigation fluide rythmée par des portes d'accès.
- **Salles thématiques (sections)** : Chaque porte s'ouvre sur une section spécifique (Boutique & Exposition Studio, Présentation, Galerie, Contact).

## 🛠️ Stack Technique

Le projet repose sur des technologies web modernes et performantes :
- **Framework & Outils** : React 19, Vite 7
- **3D & Rendu** : Three.js, React Three Fiber (R3F), `@react-three/drei`
- **Animation** : GSAP 3 (Scroll-driven animations, transition de caméra)
- **Style** : SCSS

## 🚀 Fonctionnalités & Optimisations

1. **Génération de Couloir Infini** : Rendu et recyclage dynamique des segments de couloirs pour maintenir un niveau de performance optimal.
2. **Gestionnaire de Performance** : Détection des capacités matérielles (`LOW`, `MEDIUM`, `HIGH`) pour adapter la résolution, l'anticrénelage et le rendu des ombres à la volée.
3. **Compilation de Shaders Asynchrone** : Précompilation des matériaux complexes au chargement (`gl.compileAsync` via `RoomWarmup`) pour éviter les saccades lors de la déambulation.
4. **Transition de Caméra Fluide** : Entrées et sorties de pièces animées de manière cinématique avec GSAP, en totale synchronisation avec l'état global.

---

## 🛠️ Démarrage Local

Pour lancer l'application sur votre machine locale :

1. **Installer les dépendances** :
   Assurez-vous de disposer de Node.js v20+.
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Construire le projet pour la production** :
   ```bash
   npm run build
   ```
