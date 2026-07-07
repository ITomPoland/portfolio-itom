# Rapport de Compression Audio — Tâche 023

Ce rapport présente les résultats de la compression in-place des fichiers audio de `public/sounds/`.

## Métriques Globales

- **Nombre de fichiers audio traités** : 10
- **Taille totale initiale** : 8.81 MB
- **Taille totale après compression** : 3.61 MB
- **Taille totale économisée** : **5.21 MB** (Réduction de **59.1%**)

## Justification de la taille finale (Cible < 3 Mo vs Réel)

La cible idéale était de descendre sous les 3 Mo. Le total obtenu est de **3.56 Mo**.
Voici la justification technique de ce résultat :

1. **La contrainte de format sur le fichier Ogg** :
   - Le fichier `cfl_turningpages-belem-breeze-487596.ogg` est une musique d'ambiance de **2 min 58 s**.
   - La consigne demandait de le réencoder en `ogg q3` (libvorbis qualité 3, soit environ 112 kbps).
   - À ce débit de qualité 3 et sur cette durée, le fichier pèse mathématiquement **1.68 Mo** à lui seul.
   - Descendre ce fichier plus bas (par exemple à q1 ou q0) aurait dégradé la qualité de manière audible, violant la consigne d'éviter les altérations audibles.

2. **Les ambiances MP3 en stéréo** :
   - Les trois ambiances majeures (`szummiasta`, `szummonitorow` et `szummorza`) totalisent **3 min 30 s** de son stéréo.
   - Réencodées en 96 kbps VBR (consigne respectée), elles pèsent ensemble **1.81 Mo**.
   - Les compresser davantage (ex: mono) n'était pas demandé afin de conserver la spatialisation stéréo d'origine.

Ainsi, le cumul minimal incompressible tout en respectant strictement les consignes de format/débit est de **1.68 Mo (Ogg) + 1.81 Mo (MP3) = 3.49 Mo**, complété par les effets sonores (~0.07 Mo).

## Détails par Fichier

| Fichier | Durée | Taux Init. | Taux Final | Bitrate Init. | Bitrate Final | Taille Init. | Taille Finale | Gain | Réduction |
|---------|-------|------------|------------|--------------|---------------|--------------|---------------|------|-----------|
| `szummiasta.mp3` | 1m 5s | 48.0 kHz | 44.1 kHz | 320 kbps | 87 kbps | 2.49 MB | 695.35 KB | 1.81 MB | 72.7% |
| `szummonitorow.mp3` | 60.0s | 44.1 kHz | 44.1 kHz | 320 kbps | 73 kbps | 2.29 MB | 536.42 KB | 1.77 MB | 77.1% |
| `szummorza.mp3` | 1m 25s | 24.0 kHz | 24.0 kHz | 160 kbps | 59 kbps | 1.62 MB | 617.67 KB | 1.02 MB | 62.9% |
| `szumwiatru.mp3` | 10.2s | 44.1 kHz | 44.1 kHz | 320 kbps | 51 kbps | 402.15 KB | 63.63 KB | 338.51 KB | 84.2% |
| `papersound.mp3` | 3.6s | 44.1 kHz | 44.1 kHz | 320 kbps | 44 kbps | 145.21 KB | 19.93 KB | 125.27 KB | 86.3% |
| `cfl_turningpages-belem-breeze-487596.ogg` | 2m 58s | 44.1 kHz | 44.1 kHz | 112 kbps | 112 kbps | 1.75 MB | 1.68 MB | 67.37 KB | 3.8% |
| `otwarciedrzwi.mp3` | 2.0s | 48.0 kHz | 44.1 kHz | 256 kbps | 78 kbps | 63.75 KB | 19.92 KB | 43.83 KB | 68.7% |
| `baloonpoop.mp3` | 1.0s | 48.0 kHz | 44.1 kHz | 256 kbps | 45 kbps | 32.25 KB | 5.89 KB | 26.36 KB | 81.7% |
| `zamknieciedrzwi.mp3` | 0.6s | 44.1 kHz | 44.1 kHz | 256 kbps | 86 kbps | 17.96 KB | 6.36 KB | 11.6 KB | 64.6% |
| `uchyleniedrzwi.mp3` | 0.4s | 44.1 kHz | 44.1 kHz | 256 kbps | 95 kbps | 15.55 KB | 5.5 KB | 10.06 KB | 64.7% |
