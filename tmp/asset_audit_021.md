# Rapport d'Audit des Assets — Hakkilo XR

Ce rapport présente un inventaire détaillé des ressources (images, modèles 3D, sons, zips) du site afin de guider les optimisations de performance de chargement mobile-first.

## 1. Métriques Globales

- **Nombre total d'assets inventoriés** : 481
- **Taille totale sur disque** : 160.4 MB
- **Gain potentiel total estimé** : **155.5 MB**

### Répartition par catégorie

| Catégorie | Nombre | Taille totale | Description |
|-----------|--------|---------------|-------------|
| Images | 425 | 123.46 MB | Textures, illustrations, UI |
| Modèles 3D | 45 | 15.53 MB | GLB, GLTF et buffers binaires |
| Audio | 10 | 8.81 MB | Sons d'ambiance et effets |
| Vidéos | 0 | 0 B | Séquences vidéo |
| Zips / Archives | 1 | 12.6 MB | Sources d'assets ou téléchargements |
| Autres | 0 | 0 B | Fichiers divers |

## 2. Top 20 des Fichiers les plus Lourds

Ces fichiers représentent la priorité absolue pour les actions de compression.

| Rang | Fichier | Taille | Emplacement | Type | Réf. dans le code |
|------|---------|--------|-------------|------|-------------------|
| 1 | `download` | 12.6 MB | root | zip_archive | Non (à confirmer) |
| 2 | `public/textures/corridor/backups/rysuneknaobrazek2_painted.png` | 8.85 MB | public | image | Non (à confirmer) |
| 3 | `public/textures/corridor/backups/zakonczeniepodlogi.png` | 6.14 MB | public | image | Non (à confirmer) |
| 4 | `public/textures/corridor/backups/rysuneknaobrazek2.png` | 6.02 MB | public | image | Non (à confirmer) |
| 5 | `public/textures/contact/backups/beczka.png` | 5.26 MB | public | image | Oui |
| 6 | `public/textures/entrance/backups/pot_with_duck.png` | 4.22 MB | public | image | Oui |
| 7 | `public/textures/contact/backups/beczka_painted.png` | 4.06 MB | public | image | Oui |
| 8 | `public/textures/corridor/backups/ramkanazdjecieduza_painted.png` | 3.27 MB | public | image | Oui |
| 9 | `public/models/boutique/sofa.glb` | 3.0 MB | public | model | Oui |
| 10 | `download:assets/models/street_lamp/street_lamp_02_1k.standalone.gltf` | 2.76 MB | download_zip | model | Non (à confirmer) |
| 11 | `public/textures/entrance/backups/pot_with_duck_painted.png` | 2.55 MB | public | image | Non (à confirmer) |
| 12 | `public/sounds/szummiasta.mp3` | 2.49 MB | public | audio | Oui |
| 13 | `public/sounds/szummonitorow.mp3` | 2.29 MB | public | audio | Non (à confirmer) |
| 14 | `public/textures/entrance/wall_bricks_2_ORIGINAL.webp` | 2.11 MB | public | image | Non (à confirmer) |
| 15 | `download:assets/models/celandine/celandine_01_1k.standalone.gltf` | 1.93 MB | download_zip | model | Non (à confirmer) |
| 16 | `public/sounds/cfl_turningpages-belem-breeze-487596.ogg` | 1.75 MB | public | audio | Oui |
| 17 | `public/sounds/szummorza.mp3` | 1.62 MB | public | audio | Oui |
| 18 | `public/textures/corridor/backups/pustatabliczka.png` | 1.53 MB | public | image | Oui |
| 19 | `public/textures/contact/backups/latarnia.png` | 1.47 MB | public | image | Oui |
| 20 | `public/textures/entrance/backups/wall_bricks_2_ORIGINAL.webp` | 1.4 MB | public | image | Non (à confirmer) |

## 3. Images Non-Power-of-Two (NPOT) Utilisées comme Textures

Les textures NPOT empêchent WebGL d'utiliser le mipmapping efficace et peuvent causer du gaspillage de mémoire GPU.

| Fichier | Dimensions | POT Recommandé | Taille | Réf. |
|---------|------------|----------------|--------|------|
| `public/textures/paper-texture.webp` | 1215x680 | 1024x512 | 21.89 KB | Oui |
| `public/textures/about/backups/JSSREDNIBALON_painted.webp` | 1344x3168 | 1024x4096 | 402.36 KB | Oui |
| `public/textures/about/backups/nextjssrednibalon.webp` | 631x1486 | 512x1024 | 65.4 KB | Oui |
| `public/textures/about/backups/nextjssrednibalon_painted.webp` | 1344x3168 | 1024x4096 | 387.92 KB | Oui |
| `public/textures/about/backups/reactduzybalon.webp` | 736x1447 | 512x1024 | 98.15 KB | Oui |
| `public/textures/about/backups/reactduzybalon_painted.webp` | 1472x2912 | 1024x2048 | 407.3 KB | Oui |
| `public/textures/about/backups/SOTD.webp` | 2400x1760 | 2048x2048 | 152.38 KB | Oui |
| `public/textures/about/backups/SOTD_painted.webp` | 2400x1760 | 2048x2048 | 594.43 KB | Oui |
| `public/textures/about/backups/SOTM.webp` | 1830x1342 | 2048x1024 | 154.56 KB | Oui |
| `public/textures/about/backups/SOTM_painted.webp` | 2400x1760 | 2048x2048 | 706.15 KB | Oui |
| `public/textures/about/backups/SOTY.webp` | 2400x1760 | 2048x2048 | 224.93 KB | Oui |
| `public/textures/about/backups/SOTY_painted.webp` | 2400x1760 | 2048x2048 | 582.16 KB | Oui |
| `public/textures/about/backups/threejsduzybalon.webp` | 1141x1964 | 1024x2048 | 117.09 KB | Oui |
| `public/textures/about/backups/threejsduzybalon_painted.webp` | 784x1360 | 1024x1024 | 144.49 KB | Oui |
| `public/textures/about/backups/uowyspa.webp` | 2816x1536 | 2048x2048 | 235.75 KB | Oui |
| `public/textures/about/backups/awatarnachmurce.webp` | 2816x1536 | 2048x2048 | 138.06 KB | Oui |
| `public/textures/about/backups/button.webp` | 894x208 | 1024x256 | 16.03 KB | Oui |
| `public/textures/about/backups/button_painted.webp` | 888x202 | 1024x256 | 20.52 KB | Oui |
| `public/textures/about/backups/csssrednibalon.webp` | 631x1482 | 512x1024 | 75.23 KB | Oui |
| `public/textures/about/backups/csssrednibalon_painted.webp` | 1344x3168 | 1024x4096 | 330.49 KB | Oui |
| `public/textures/about/backups/figmamalybalon.webp` | 604x1421 | 512x1024 | 68.81 KB | Oui |
| `public/textures/about/backups/figmamalybalon_painted.webp` | 1344x3168 | 1024x4096 | 443.66 KB | Oui |
| `public/textures/about/backups/firebasemalybalon.webp` | 609x1421 | 512x1024 | 71.75 KB | Oui |
| `public/textures/about/backups/firebasemalybalon_painted.webp` | 1344x3168 | 1024x4096 | 383.39 KB | Oui |
| `public/textures/about/backups/freelancewyspa.webp` | 2816x1536 | 2048x2048 | 396.98 KB | Oui |
| `public/textures/about/backups/gitmalybalon.webp` | 597x1407 | 512x1024 | 66.25 KB | Oui |
| `public/textures/about/backups/gitmalybalon_painted.webp` | 1344x3168 | 1024x4096 | 457.58 KB | Oui |
| `public/textures/about/backups/htmlmalybalon.webp` | 597x1405 | 512x1024 | 71.19 KB | Oui |
| `public/textures/about/backups/htmlmalybalon_painted.webp` | 1344x3168 | 1024x4096 | 455.8 KB | Oui |
| `public/textures/about/backups/JSSREDNIBALON.webp` | 631x1484 | 512x1024 | 69.79 KB | Oui |
| `public/textures/boutique/wall-art-back.jpg` | 896x1200 | 1024x1024 | 768.66 KB | Oui |
| `public/textures/boutique/wall-art-left.jpg` | 896x1200 | 1024x1024 | 976.27 KB | Oui |
| `public/textures/boutique/wall-art-right.jpg` | 896x1200 | 1024x1024 | 989.48 KB | Oui |
| `public/textures/clouds/backups/1131c3eb-dfae-423f-924b-ff39d8ccd6dc.webp` | 214x113 | 256x128 | 5.17 KB | Oui |
| `public/textures/clouds/backups/254b8ec8-d6f7-4275-956f-7bab65b2ce2d.webp` | 209x85 | 256x64 | 4.04 KB | Oui |
| `public/textures/clouds/backups/2cc88dd1-483c-466d-b07e-f8308c61ccbe.webp` | 769x215 | 1024x256 | 14.97 KB | Oui |
| `public/textures/clouds/backups/5606fcc0-3252-447d-a58a-7bcbac73229a.webp` | 540x301 | 512x256 | 15.69 KB | Oui |
| `public/textures/clouds/backups/7882dc72-3d01-41fb-ac0e-d07b0184ebc1.webp` | 509x283 | 512x256 | 13.75 KB | Oui |
| `public/textures/clouds/backups/9b2ca72f-7bd0-473b-ba6e-dd9e0eb79d35.webp` | 172x99 | 128x128 | 4.49 KB | Oui |
| `public/textures/clouds/backups/c83293c6-d90c-4a32-8d9d-5ac9af7e2296.webp` | 830x182 | 1024x128 | 14.69 KB | Oui |
| `public/textures/clouds/backups/f6e358bc-d27c-41dd-95f4-6787a835c41e.webp` | 195x104 | 256x128 | 4.79 KB | Oui |
| `public/textures/contact/beczka.webp` | 901x901 | 1024x1024 | 32.8 KB | Oui |
| `public/textures/contact/beczka_painted.webp` | 901x901 | 1024x1024 | 40.98 KB | Oui |
| `public/textures/contact/faletopdown.webp` | 1351x675 | 1024x512 | 59.96 KB | Oui |
| `public/textures/contact/molo.webp` | 906x452 | 1024x512 | 45.79 KB | Oui |
| `public/textures/contact/paper_form.webp` | 1197x1340 | 1024x1024 | 68.31 KB | Oui |
| `public/textures/contact/backups/beczka.png` | 1984x2144 | 2048x2048 | 5.26 MB | Oui |
| `public/textures/contact/backups/beczka.webp` | 1984x2144 | 2048x2048 | 214.18 KB | Oui |
| `public/textures/contact/backups/beczka_painted.png` | 1984x2144 | 2048x2048 | 4.06 MB | Oui |
| `public/textures/contact/backups/beczka_painted.webp` | 1984x2144 | 2048x2048 | 440.41 KB | Oui |
| `public/textures/contact/backups/czescglownabutelki.webp` | 1392x768 | 1024x1024 | 27.99 KB | Non |
| `public/textures/contact/backups/facebooklink.webp` | 1393x1495 | 1024x1024 | 148.9 KB | Non |
| `public/textures/contact/backups/fala1.webp` | 2525x202 | 2048x256 | 72.2 KB | Non |
| `public/textures/contact/backups/fala2.webp` | 2525x160 | 2048x128 | 54.77 KB | Non |
| `public/textures/contact/backups/faletopdown.webp` | 2816x1536 | 2048x2048 | 318.97 KB | Oui |
| `public/textures/contact/backups/faletopdown_black.webp` | 2816x1536 | 2048x2048 | 462.45 KB | Non |
| `public/textures/contact/backups/githublink.webp` | 1393x1494 | 1024x1024 | 162.05 KB | Non |
| `public/textures/contact/backups/instagramlink.webp` | 1389x1491 | 1024x1024 | 154.56 KB | Non |
| `public/textures/contact/backups/latarnia.png` | 1102x1225 | 1024x1024 | 1.47 MB | Oui |
| `public/textures/contact/backups/latarnia.webp` | 1102x1225 | 1024x1024 | 89.4 KB | Oui |
| `public/textures/contact/backups/linkedinlink.webp` | 1393x1491 | 1024x1024 | 152.79 KB | Non |
| `public/textures/contact/backups/maillink.webp` | 1391x1495 | 1024x1024 | 138.33 KB | Non |
| `public/textures/contact/backups/molo.webp` | 2735x1410 | 2048x1024 | 285.08 KB | Oui |
| `public/textures/contact/backups/paper_form.webp` | 1197x1340 | 1024x1024 | 68.31 KB | Oui |
| `public/textures/contact/backups/papiernabutelke.webp` | 1392x768 | 1024x1024 | 12.7 KB | Non |
| `public/textures/contact/backups/send_button.webp` | 405x106 | 512x128 | 4.28 KB | Oui |
| `public/textures/contact/backups/statek.webp` | 2525x978 | 2048x1024 | 199.46 KB | Oui |
| `public/textures/contact/backups/zakretkabutelki.webp` | 1392x768 | 1024x1024 | 9.56 KB | Non |
| `public/textures/corridor/kratanalampy.webp` | 1515x757 | 1024x512 | 85.99 KB | Oui |
| `public/textures/corridor/rysuneknaobraz1.webp` | 376x753 | 256x512 | 73.7 KB | Oui |
| `public/textures/corridor/rysuneknaobrazek3.webp` | 716x358 | 512x256 | 50.07 KB | Oui |
| `public/textures/corridor/zakonczeniepodlogi.webp` | 1474x737 | 1024x512 | 92.48 KB | Non |
| `public/textures/corridor/backups/kawalekpodlogi.webp` | 1349x1792 | 1024x2048 | 238.94 KB | Oui |
| `public/textures/corridor/backups/rysuneknaobraz1.webp` | 1747x2125 | 2048x2048 | 619.02 KB | Oui |
| `public/textures/corridor/backups/rysuneknaobrazek2.png` | 2730x1536 | 2048x2048 | 6.02 MB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek2.webp` | 2730x1536 | 2048x2048 | 283.19 KB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.png` | 2730x1536 | 2048x2048 | 8.85 MB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.webp` | 2730x1536 | 2048x2048 | 627.84 KB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek3.webp` | 1280x756 | 1024x512 | 172.88 KB | Oui |
| `public/textures/corridor/backups/shakerholy.png` | 749x1571 | 512x2048 | 674.0 KB | Non |
| `public/textures/corridor/backups/shakerholy.webp` | 749x1571 | 512x2048 | 63.71 KB | Non |
| `public/textures/corridor/backups/strzalka.png` | 225x118 | 256x128 | 2.71 KB | Oui |
| `public/textures/corridor/backups/strzalka.webp` | 225x118 | 256x128 | 2.22 KB | Oui |
| `public/textures/corridor/backups/szafkaprzod.png` | 1320x1639 | 1024x2048 | 146.74 KB | Oui |
| `public/textures/corridor/backups/szafkaprzod.webp` | 1320x1639 | 1024x2048 | 176.03 KB | Oui |
| `public/textures/corridor/backups/szafkaprzodgora.png` | 693x1639 | 512x2048 | 70.44 KB | Oui |
| `public/textures/corridor/backups/szafkaprzodgora.webp` | 693x1639 | 512x2048 | 83.74 KB | Oui |
| `public/textures/corridor/backups/texturadoprogow.png` | 1582x94 | 2048x64 | 10.42 KB | Oui |
| `public/textures/corridor/backups/texturadoprogow.webp` | 1582x94 | 2048x64 | 11.73 KB | Oui |
| `public/textures/corridor/backups/texturadrewnadonozekbiurka.png` | 2400x233 | 2048x256 | 36.71 KB | Oui |
| `public/textures/corridor/backups/texturadrewnadonozekbiurka.webp` | 2400x233 | 2048x256 | 43.72 KB | Oui |
| `public/textures/corridor/backups/thegallerysign.webp` | 2752x1536 | 2048x2048 | 294.2 KB | Non |
| `public/textures/corridor/backups/thestudiosign.webp` | 2752x1536 | 2048x2048 | 303.84 KB | Non |
| `public/textures/corridor/backups/wall_texture.webp` | 1024x573 | 1024x512 | 8.66 KB | Oui |
| `public/textures/corridor/backups/zakonczeniepodlogi.png` | 2268x1792 | 2048x2048 | 6.14 MB | Non |
| `public/textures/corridor/backups/zakonczeniepodlogi.webp` | 2268x1792 | 2048x2048 | 474.0 KB | Non |
| `public/textures/corridor/backups/aboutsign.webp` | 2752x1536 | 2048x2048 | 273.04 KB | Non |
| `public/textures/corridor/backups/avatar_sketch.webp` | 245x1024 | 256x1024 | 35.15 KB | Oui |
| `public/textures/corridor/backups/bokilampy.png` | 1600x100 | 2048x128 | 2.92 KB | Oui |
| `public/textures/corridor/backups/bokilampy.webp` | 1600x100 | 2048x128 | 1.13 KB | Oui |
| `public/textures/corridor/backups/ceiling_texture.webp` | 1024x573 | 1024x512 | 18.89 KB | Oui |
| `public/textures/corridor/backups/contactsign.webp` | 2752x1536 | 2048x2048 | 303.72 KB | Non |
| `public/textures/corridor/backups/drzewkowdoniczce.png` | 1387x2485 | 1024x2048 | 290.96 KB | Oui |
| `public/textures/corridor/backups/drzewkowdoniczce.webp` | 1387x2485 | 1024x2048 | 329.19 KB | Oui |
| `public/textures/corridor/backups/floor_wood.webp` | 1024x573 | 1024x512 | 38.96 KB | Non |
| `public/textures/corridor/backups/gorastolika.png` | 2400x905 | 2048x1024 | 164.51 KB | Oui |
| `public/textures/corridor/backups/gorastolika.webp` | 2400x905 | 2048x1024 | 196.32 KB | Oui |
| `public/textures/corridor/backups/itom_text.webp` | 2329x765 | 2048x512 | 92.99 KB | Non |
| `public/textures/corridor/backups/kawalekpodlogi.png` | 1349x1792 | 1024x2048 | 204.63 KB | Oui |
| `public/textures/corridor/backups/kratanalampy.png` | 2871x1390 | 2048x1024 | 194.92 KB | Oui |
| `public/textures/corridor/backups/kratanalampy.webp` | 2871x1390 | 2048x1024 | 215.65 KB | Oui |
| `public/textures/corridor/backups/kratkawentylacyjna.png` | 2495x1169 | 2048x1024 | 35.91 KB | Oui |
| `public/textures/corridor/backups/kratkawentylacyjna.webp` | 2495x1169 | 2048x1024 | 39.43 KB | Oui |
| `public/textures/corridor/backups/kwiatekwdoniczce.png` | 208x352 | 256x256 | 14.78 KB | Oui |
| `public/textures/corridor/backups/kwiatekwdoniczce.webp` | 208x352 | 256x256 | 16.04 KB | Oui |
| `public/textures/corridor/backups/pustatabliczka.png` | 2752x1536 | 2048x2048 | 1.53 MB | Oui |
| `public/textures/corridor/backups/pustatabliczka.webp` | 2752x1536 | 2048x2048 | 159.02 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza.png` | 3200x1792 | 4096x2048 | 102.79 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza.webp` | 3200x1792 | 4096x2048 | 115.72 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza_painted.png` | 2685x1517 | 2048x1024 | 3.27 MB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza_painted.webp` | 2685x1517 | 2048x1024 | 245.29 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjeciemala.png` | 849x1092 | 1024x1024 | 50.08 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjeciemala.webp` | 849x1092 | 1024x1024 | 57.44 KB | Oui |
| `public/textures/corridor/backups/rysuneknaobraz1.png` | 1747x2125 | 2048x2048 | 599.83 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/1.webp` | 1080x1080 | 1024x1024 | 36.18 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/2.webp` | 1080x1080 | 1024x1024 | 36.0 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/3.webp` | 1080x1080 | 1024x1024 | 36.92 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/4.webp` | 1080x1080 | 1024x1024 | 37.99 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/5.webp` | 1080x1080 | 1024x1024 | 37.79 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/6.webp` | 1080x1080 | 1024x1024 | 37.4 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/7.webp` | 1080x1080 | 1024x1024 | 37.13 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/8.webp` | 1080x1080 | 1024x1024 | 36.93 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/9.webp` | 1080x1080 | 1024x1024 | 38.21 KB | Oui |
| `public/textures/corridor/backups/decorations/coffee_debug.webp` | 2816x1536 | 2048x2048 | 163.75 KB | Oui |
| `public/textures/corridor/backups/decorations/idea_process.webp` | 1312x3264 | 1024x4096 | 515.33 KB | Oui |
| `public/textures/corridor/backups/decorations/while_true_loop.webp` | 2816x1536 | 2048x2048 | 247.5 KB | Oui |
| `public/textures/corridor/backups/doors/backsingledoors.webp` | 634x1685 | 512x2048 | 48.37 KB | Oui |
| `public/textures/corridor/backups/doors/doorrleft.webp` | 332x848 | 256x1024 | 29.35 KB | Oui |
| `public/textures/corridor/backups/doors/door_back.webp` | 332x848 | 256x1024 | 20.05 KB | Oui |
| `public/textures/corridor/backups/doors/dorright.webp` | 332x848 | 256x1024 | 28.53 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiabout.webp` | 634x1685 | 512x2048 | 67.95 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiabout_painted.webp` | 1245x3328 | 1024x4096 | 949.98 KB | Oui |
| `public/textures/corridor/backups/doors/drzwikontakt.webp` | 634x1685 | 512x2048 | 33.56 KB | Oui |
| `public/textures/corridor/backups/doors/drzwikontakt_painted.webp` | 1245x3328 | 1024x4096 | 696.31 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiprojekty.webp` | 634x1685 | 512x2048 | 137.77 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiprojekty_painted.webp` | 1260x3328 | 1024x4096 | 735.32 KB | Oui |
| `public/textures/corridor/backups/doors/drzwisocial.webp` | 1280x3296 | 1024x4096 | 126.25 KB | Oui |
| `public/textures/corridor/backups/doors/drzwisocial_painted.webp` | 1280x3328 | 1024x4096 | 671.56 KB | Oui |
| `public/textures/corridor/backups/doors/frame_sketch.webp` | 718x877 | 512x1024 | 20.68 KB | Oui |
| `public/textures/corridor/backups/doors/handle_left_sketch.webp` | 332x848 | 256x1024 | 2.73 KB | Oui |
| `public/textures/corridor/backups/doors/handle_right_sketch.webp` | 332x848 | 256x1024 | 2.92 KB | Oui |
| `public/textures/corridor/backups/doors/klamkadodrzwi.webp` | 674x1759 | 512x2048 | 11.84 KB | Oui |
| `public/textures/corridor/backups/doors/klamkadodrzwi_painted.webp` | 674x1759 | 512x2048 | 7.91 KB | Oui |
| `public/textures/corridor/backups/doors/pien.webp` | 44x391 | 32x512 | 2.25 KB | Oui |
| `public/textures/corridor/backups/doors/ramkasingledoors.webp` | 762x1759 | 512x2048 | 57.39 KB | Oui |
| `public/textures/corridor/decorations/coffee_debug.webp` | 1761x880 | 2048x1024 | 56.89 KB | Oui |
| `public/textures/corridor/decorations/idea_process.webp` | 604x1208 | 512x1024 | 92.87 KB | Oui |
| `public/textures/corridor/decorations/while_true_loop.webp` | 1249x624 | 1024x512 | 47.98 KB | Oui |
| `public/textures/corridor/doors/drzwikontakt_painted.webp` | 880x1761 | 1024x2048 | 73.64 KB | Oui |
| `public/textures/corridor/doors/drzwiprojekty_painted.webp` | 880x1761 | 1024x2048 | 89.33 KB | Oui |
| `public/textures/doors/door_back.webp` | 332x848 | 256x1024 | 20.05 KB | Oui |
| `public/textures/doors/door_back_left_sketch.webp` | 844x2196 | 1024x2048 | 75.95 KB | Oui |
| `public/textures/doors/door_left_painted.webp` | 810x2108 | 1024x2048 | 86.28 KB | Oui |
| `public/textures/doors/door_left_sketch.webp` | 332x848 | 256x1024 | 18.99 KB | Oui |
| `public/textures/doors/door_right_painted.webp` | 756x1949 | 512x2048 | 85.72 KB | Oui |
| `public/textures/doors/door_right_sketch.webp` | 332x848 | 256x1024 | 21.92 KB | Oui |
| `public/textures/doors/frame_sketch.webp` | 718x877 | 512x1024 | 20.68 KB | Oui |
| `public/textures/doors/handle_left_painted.webp` | 1280x3328 | 1024x4096 | 30.83 KB | Oui |
| `public/textures/doors/handle_left_sketch.webp` | 332x848 | 256x1024 | 2.73 KB | Oui |
| `public/textures/doors/handle_right_painted.webp` | 787x2048 | 1024x2048 | 10.09 KB | Oui |
| `public/textures/doors/handle_right_sketch.webp` | 332x848 | 256x1024 | 2.92 KB | Oui |
| `public/textures/doors/pien.webp` | 780x2030 | 1024x2048 | 75.8 KB | Oui |
| `public/textures/doors/pien_sketch.webp` | 44x391 | 32x512 | 2.26 KB | Oui |
| `public/textures/entrance/sign.webp` | 1802x901 | 2048x1024 | 89.39 KB | Oui |
| `public/textures/entrance/stone-path.webp` | 389x779 | 512x1024 | 92.28 KB | Oui |
| `public/textures/entrance/backups/avatar_window.webp` | 980x1024 | 1024x1024 | 37.45 KB | Oui |
| `public/textures/entrance/backups/belka.webp` | 1990x227 | 2048x256 | 54.91 KB | Oui |
| `public/textures/entrance/backups/bricks.webp` | 2816x1536 | 2048x2048 | 216.81 KB | Oui |
| `public/textures/entrance/backups/cat_sketch.webp` | 646x1024 | 512x1024 | 39.15 KB | Oui |
| `public/textures/entrance/backups/floor_paper.webp` | 1024x558 | 1024x512 | 95.49 KB | Oui |
| `public/textures/entrance/backups/mouse_hanging.webp` | 716x1024 | 512x1024 | 4.67 KB | Oui |
| `public/textures/entrance/backups/pot_with_duck.png` | 2760x1504 | 2048x1024 | 4.22 MB | Oui |
| `public/textures/entrance/backups/pot_with_duck.webp` | 2760x1504 | 2048x1024 | 380.22 KB | Oui |
| `public/textures/entrance/backups/pot_with_duck_painted.png` | 2760x1504 | 2048x1024 | 2.55 MB | Non |
| `public/textures/entrance/backups/pot_with_duck_painted.webp` | 2760x1504 | 2048x1024 | 307.49 KB | Non |
| `public/textures/entrance/backups/sign.webp` | 1470x823 | 1024x1024 | 125.87 KB | Oui |
| `public/textures/entrance/backups/stone-path.webp` | 1005x2317 | 1024x2048 | 503.4 KB | Oui |
| `public/textures/entrance/backups/stone-path_ORIGINAL.webp` | 1005x2317 | 1024x2048 | 503.4 KB | Non |
| `public/textures/entrance/backups/tree_sketch.webp` | 716x1024 | 512x1024 | 50.4 KB | Oui |
| `public/textures/entrance/backups/wall_bricks_2.webp` | 1536x768 | 2048x1024 | 174.55 KB | Oui |
| `public/textures/entrance/backups/wall_bricks_2_ORIGINAL.webp` | 6000x3000 | 4096x2048 | 1.4 MB | Non |
| `public/textures/entrance/backups/window_sketch.webp` | 2754x2862 | 2048x2048 | 300.79 KB | Oui |
| `public/textures/gallery/railing.webp` | 1228x614 | 1024x512 | 86.6 KB | Oui |
| `public/textures/gallery/domki.webp` | 1290x645 | 1024x512 | 49.3 KB | Oui |
| `public/textures/gallery/floor.webp` | 727x363 | 512x256 | 47.16 KB | Oui |
| `public/textures/studio/phone_back_painted.webp` | 716x716 | 512x512 | 46.41 KB | Oui |
| `public/textures/studio/tvfront_filmikedytowaniezdjec.webp` | 1474x737 | 1024x512 | 50.77 KB | Oui |
| `public/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp` | 1699x849 | 2048x1024 | 89.13 KB | Oui |
| `public/textures/studio/tvfront_filmikprojektdlamultiego.webp` | 1474x737 | 1024x512 | 51.39 KB | Oui |
| `public/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp` | 1576x788 | 2048x1024 | 89.19 KB | Oui |
| `public/textures/studio/tv_back_painted.webp` | 1679x839 | 2048x1024 | 84.28 KB | Oui |
| `public/textures/studio/tv_bottom.webp` | 1802x901 | 2048x1024 | 35.64 KB | Oui |
| `public/textures/studio/tv_front_painted.webp` | 1720x860 | 2048x1024 | 83.86 KB | Oui |
| `public/textures/studio/tv_top.webp` | 1310x655 | 1024x512 | 66.93 KB | Oui |
| `public/textures/studio/tv_top_painted.webp` | 1413x706 | 1024x512 | 61.06 KB | Oui |
| `public/textures/studio/monitorfront_postnafbdoublewinner_painted.webp` | 1679x839 | 2048x1024 | 40.22 KB | Oui |
| `public/ville-assets/kenney/preview-sample.png` | 918x515 | 1024x512 | 186.26 KB | Non |

## 4. Images de grande taille (> 1024px)

Ces images sont souvent trop lourdes pour un affichage sur mobile et doivent être redimensionnées.

| Fichier | Dimensions | Taille | Réf. |
|---------|------------|--------|------|
| `public/og-image.webp` | 1200x630 | 51.68 KB | Oui |
| `public/images/JSSREDNIBALON_painted.webp` | 675x1351 | 47.38 KB | Oui |
| `public/images/map.webp` | 1351x1290 | 80.88 KB | Oui |
| `public/images/map_about_painted.webp` | 1562x1491 | 95.63 KB | Oui |
| `public/images/map_contact_painted.webp` | 1229x1173 | 80.09 KB | Oui |
| `public/images/map_gallery_painted.webp` | 1265x1207 | 78.28 KB | Oui |
| `public/images/map_studio_painted.webp` | 1288x1229 | 84.4 KB | Oui |
| `public/textures/paper-texture.webp` | 1215x680 | 21.89 KB | Oui |
| `public/textures/about/backups/JSSREDNIBALON_painted.webp` | 1344x3168 | 402.36 KB | Oui |
| `public/textures/about/backups/nextjssrednibalon.webp` | 631x1486 | 65.4 KB | Oui |
| `public/textures/about/backups/nextjssrednibalon_painted.webp` | 1344x3168 | 387.92 KB | Oui |
| `public/textures/about/backups/reactduzybalon.webp` | 736x1447 | 98.15 KB | Oui |
| `public/textures/about/backups/reactduzybalon_painted.webp` | 1472x2912 | 407.3 KB | Oui |
| `public/textures/about/backups/SOTD.webp` | 2400x1760 | 152.38 KB | Oui |
| `public/textures/about/backups/SOTD_painted.webp` | 2400x1760 | 594.43 KB | Oui |
| `public/textures/about/backups/SOTM.webp` | 1830x1342 | 154.56 KB | Oui |
| `public/textures/about/backups/SOTM_painted.webp` | 2400x1760 | 706.15 KB | Oui |
| `public/textures/about/backups/SOTY.webp` | 2400x1760 | 224.93 KB | Oui |
| `public/textures/about/backups/SOTY_painted.webp` | 2400x1760 | 582.16 KB | Oui |
| `public/textures/about/backups/threejsduzybalon.webp` | 1141x1964 | 117.09 KB | Oui |
| `public/textures/about/backups/threejsduzybalon_painted.webp` | 784x1360 | 144.49 KB | Oui |
| `public/textures/about/backups/uowyspa.webp` | 2816x1536 | 235.75 KB | Oui |
| `public/textures/about/backups/awatarnachmurce.webp` | 2816x1536 | 138.06 KB | Oui |
| `public/textures/about/backups/csssrednibalon.webp` | 631x1482 | 75.23 KB | Oui |
| `public/textures/about/backups/csssrednibalon_painted.webp` | 1344x3168 | 330.49 KB | Oui |
| `public/textures/about/backups/figmamalybalon.webp` | 604x1421 | 68.81 KB | Oui |
| `public/textures/about/backups/figmamalybalon_painted.webp` | 1344x3168 | 443.66 KB | Oui |
| `public/textures/about/backups/firebasemalybalon.webp` | 609x1421 | 71.75 KB | Oui |
| `public/textures/about/backups/firebasemalybalon_painted.webp` | 1344x3168 | 383.39 KB | Oui |
| `public/textures/about/backups/freelancewyspa.webp` | 2816x1536 | 396.98 KB | Oui |
| `public/textures/about/backups/gitmalybalon.webp` | 597x1407 | 66.25 KB | Oui |
| `public/textures/about/backups/gitmalybalon_painted.webp` | 1344x3168 | 457.58 KB | Oui |
| `public/textures/about/backups/htmlmalybalon.webp` | 597x1405 | 71.19 KB | Oui |
| `public/textures/about/backups/htmlmalybalon_painted.webp` | 1344x3168 | 455.8 KB | Oui |
| `public/textures/about/backups/JSSREDNIBALON.webp` | 631x1484 | 69.79 KB | Oui |
| `public/textures/boutique/wall-art-back.jpg` | 896x1200 | 768.66 KB | Oui |
| `public/textures/boutique/wall-art-left.jpg` | 896x1200 | 976.27 KB | Oui |
| `public/textures/boutique/wall-art-right.jpg` | 896x1200 | 989.48 KB | Oui |
| `public/textures/contact/faletopdown.webp` | 1351x675 | 59.96 KB | Oui |
| `public/textures/contact/paper_form.webp` | 1197x1340 | 68.31 KB | Oui |
| `public/textures/contact/statek.webp` | 4096x1024 | 69.93 KB | Oui |
| `public/textures/contact/backups/beczka.png` | 1984x2144 | 5.26 MB | Oui |
| `public/textures/contact/backups/beczka.webp` | 1984x2144 | 214.18 KB | Oui |
| `public/textures/contact/backups/beczka_painted.png` | 1984x2144 | 4.06 MB | Oui |
| `public/textures/contact/backups/beczka_painted.webp` | 1984x2144 | 440.41 KB | Oui |
| `public/textures/contact/backups/czescglownabutelki.webp` | 1392x768 | 27.99 KB | Non |
| `public/textures/contact/backups/facebooklink.webp` | 1393x1495 | 148.9 KB | Non |
| `public/textures/contact/backups/fala1.webp` | 2525x202 | 72.2 KB | Non |
| `public/textures/contact/backups/fala2.webp` | 2525x160 | 54.77 KB | Non |
| `public/textures/contact/backups/faletopdown.webp` | 2816x1536 | 318.97 KB | Oui |
| `public/textures/contact/backups/faletopdown_black.webp` | 2816x1536 | 462.45 KB | Non |
| `public/textures/contact/backups/githublink.webp` | 1393x1494 | 162.05 KB | Non |
| `public/textures/contact/backups/instagramlink.webp` | 1389x1491 | 154.56 KB | Non |
| `public/textures/contact/backups/latarnia.png` | 1102x1225 | 1.47 MB | Oui |
| `public/textures/contact/backups/latarnia.webp` | 1102x1225 | 89.4 KB | Oui |
| `public/textures/contact/backups/linkedinlink.webp` | 1393x1491 | 152.79 KB | Non |
| `public/textures/contact/backups/maillink.webp` | 1391x1495 | 138.33 KB | Non |
| `public/textures/contact/backups/molo.webp` | 2735x1410 | 285.08 KB | Oui |
| `public/textures/contact/backups/paper_form.webp` | 1197x1340 | 68.31 KB | Oui |
| `public/textures/contact/backups/papiernabutelke.webp` | 1392x768 | 12.7 KB | Non |
| `public/textures/contact/backups/statek.webp` | 2525x978 | 199.46 KB | Oui |
| `public/textures/contact/backups/zakretkabutelki.webp` | 1392x768 | 9.56 KB | Non |
| `public/textures/corridor/drzewkowdoniczce.webp` | 1024x2048 | 257.34 KB | Oui |
| `public/textures/corridor/gorastolika.webp` | 2048x512 | 94.33 KB | Oui |
| `public/textures/corridor/kratanalampy.webp` | 1515x757 | 85.99 KB | Oui |
| `public/textures/corridor/kratkawentylacyjna.webp` | 2048x1024 | 34.85 KB | Oui |
| `public/textures/corridor/pustatabliczka.webp` | 2048x1024 | 90.15 KB | Oui |
| `public/textures/corridor/ramkanazdjecieduza.webp` | 2048x1024 | 65.65 KB | Oui |
| `public/textures/corridor/ramkanazdjecieduza_painted.webp` | 2048x1024 | 74.36 KB | Oui |
| `public/textures/corridor/texturadrewnadonozekbiurka.webp` | 2048x128 | 31.5 KB | Oui |
| `public/textures/corridor/zakonczeniepodlogi.webp` | 1474x737 | 92.48 KB | Non |
| `public/textures/corridor/backups/kawalekpodlogi.webp` | 1349x1792 | 238.94 KB | Oui |
| `public/textures/corridor/backups/rysuneknaobraz1.webp` | 1747x2125 | 619.02 KB | Oui |
| `public/textures/corridor/backups/rysuneknaobrazek2.png` | 2730x1536 | 6.02 MB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek2.webp` | 2730x1536 | 283.19 KB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.png` | 2730x1536 | 8.85 MB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.webp` | 2730x1536 | 627.84 KB | Non |
| `public/textures/corridor/backups/rysuneknaobrazek3.webp` | 1280x756 | 172.88 KB | Oui |
| `public/textures/corridor/backups/shakerholy.png` | 749x1571 | 674.0 KB | Non |
| `public/textures/corridor/backups/shakerholy.webp` | 749x1571 | 63.71 KB | Non |
| `public/textures/corridor/backups/szafkaprzod.png` | 1320x1639 | 146.74 KB | Oui |
| `public/textures/corridor/backups/szafkaprzod.webp` | 1320x1639 | 176.03 KB | Oui |
| `public/textures/corridor/backups/szafkaprzodgora.png` | 693x1639 | 70.44 KB | Oui |
| `public/textures/corridor/backups/szafkaprzodgora.webp` | 693x1639 | 83.74 KB | Oui |
| `public/textures/corridor/backups/texturadoprogow.png` | 1582x94 | 10.42 KB | Oui |
| `public/textures/corridor/backups/texturadoprogow.webp` | 1582x94 | 11.73 KB | Oui |
| `public/textures/corridor/backups/texturadrewnadonozekbiurka.png` | 2400x233 | 36.71 KB | Oui |
| `public/textures/corridor/backups/texturadrewnadonozekbiurka.webp` | 2400x233 | 43.72 KB | Oui |
| `public/textures/corridor/backups/thegallerysign.webp` | 2752x1536 | 294.2 KB | Non |
| `public/textures/corridor/backups/thestudiosign.webp` | 2752x1536 | 303.84 KB | Non |
| `public/textures/corridor/backups/zakonczeniepodlogi.png` | 2268x1792 | 6.14 MB | Non |
| `public/textures/corridor/backups/zakonczeniepodlogi.webp` | 2268x1792 | 474.0 KB | Non |
| `public/textures/corridor/backups/aboutsign.webp` | 2752x1536 | 273.04 KB | Non |
| `public/textures/corridor/backups/bokilampy.png` | 1600x100 | 2.92 KB | Oui |
| `public/textures/corridor/backups/bokilampy.webp` | 1600x100 | 1.13 KB | Oui |
| `public/textures/corridor/backups/contactsign.webp` | 2752x1536 | 303.72 KB | Non |
| `public/textures/corridor/backups/drzewkowdoniczce.png` | 1387x2485 | 290.96 KB | Oui |
| `public/textures/corridor/backups/drzewkowdoniczce.webp` | 1387x2485 | 329.19 KB | Oui |
| `public/textures/corridor/backups/gorastolika.png` | 2400x905 | 164.51 KB | Oui |
| `public/textures/corridor/backups/gorastolika.webp` | 2400x905 | 196.32 KB | Oui |
| `public/textures/corridor/backups/itom_text.webp` | 2329x765 | 92.99 KB | Non |
| `public/textures/corridor/backups/kawalekpodlogi.png` | 1349x1792 | 204.63 KB | Oui |
| `public/textures/corridor/backups/kratanalampy.png` | 2871x1390 | 194.92 KB | Oui |
| `public/textures/corridor/backups/kratanalampy.webp` | 2871x1390 | 215.65 KB | Oui |
| `public/textures/corridor/backups/kratkawentylacyjna.png` | 2495x1169 | 35.91 KB | Oui |
| `public/textures/corridor/backups/kratkawentylacyjna.webp` | 2495x1169 | 39.43 KB | Oui |
| `public/textures/corridor/backups/pustatabliczka.png` | 2752x1536 | 1.53 MB | Oui |
| `public/textures/corridor/backups/pustatabliczka.webp` | 2752x1536 | 159.02 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza.png` | 3200x1792 | 102.79 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza.webp` | 3200x1792 | 115.72 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza_painted.png` | 2685x1517 | 3.27 MB | Oui |
| `public/textures/corridor/backups/ramkanazdjecieduza_painted.webp` | 2685x1517 | 245.29 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjeciemala.png` | 849x1092 | 50.08 KB | Oui |
| `public/textures/corridor/backups/ramkanazdjeciemala.webp` | 849x1092 | 57.44 KB | Oui |
| `public/textures/corridor/backups/rysuneknaobraz1.png` | 1747x2125 | 599.83 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/1.webp` | 1080x1080 | 36.18 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/2.webp` | 1080x1080 | 36.0 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/3.webp` | 1080x1080 | 36.92 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/4.webp` | 1080x1080 | 37.99 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/5.webp` | 1080x1080 | 37.79 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/6.webp` | 1080x1080 | 37.4 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/7.webp` | 1080x1080 | 37.13 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/8.webp` | 1080x1080 | 36.93 KB | Oui |
| `public/textures/corridor/backups/avatar_anim/9.webp` | 1080x1080 | 38.21 KB | Oui |
| `public/textures/corridor/backups/decorations/coffee_debug.webp` | 2816x1536 | 163.75 KB | Oui |
| `public/textures/corridor/backups/decorations/idea_process.webp` | 1312x3264 | 515.33 KB | Oui |
| `public/textures/corridor/backups/decorations/while_true_loop.webp` | 2816x1536 | 247.5 KB | Oui |
| `public/textures/corridor/backups/doors/backsingledoors.webp` | 634x1685 | 48.37 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiabout.webp` | 634x1685 | 67.95 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiabout_painted.webp` | 1245x3328 | 949.98 KB | Oui |
| `public/textures/corridor/backups/doors/drzwikontakt.webp` | 634x1685 | 33.56 KB | Oui |
| `public/textures/corridor/backups/doors/drzwikontakt_painted.webp` | 1245x3328 | 696.31 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiprojekty.webp` | 634x1685 | 137.77 KB | Oui |
| `public/textures/corridor/backups/doors/drzwiprojekty_painted.webp` | 1260x3328 | 735.32 KB | Oui |
| `public/textures/corridor/backups/doors/drzwisocial.webp` | 1280x3296 | 126.25 KB | Oui |
| `public/textures/corridor/backups/doors/drzwisocial_painted.webp` | 1280x3328 | 671.56 KB | Oui |
| `public/textures/corridor/backups/doors/klamkadodrzwi.webp` | 674x1759 | 11.84 KB | Oui |
| `public/textures/corridor/backups/doors/klamkadodrzwi_painted.webp` | 674x1759 | 7.91 KB | Oui |
| `public/textures/corridor/backups/doors/ramkasingledoors.webp` | 762x1759 | 57.39 KB | Oui |
| `public/textures/corridor/decorations/coffee_debug.webp` | 1761x880 | 56.89 KB | Oui |
| `public/textures/corridor/decorations/idea_process.webp` | 604x1208 | 92.87 KB | Oui |
| `public/textures/corridor/decorations/while_true_loop.webp` | 1249x624 | 47.98 KB | Oui |
| `public/textures/corridor/doors/drzwiabout_painted.webp` | 1024x2048 | 81.75 KB | Oui |
| `public/textures/corridor/doors/drzwikontakt_painted.webp` | 880x1761 | 73.64 KB | Oui |
| `public/textures/corridor/doors/drzwiprojekty_painted.webp` | 880x1761 | 89.33 KB | Oui |
| `public/textures/corridor/doors/drzwisocial.webp` | 1024x2048 | 80.28 KB | Oui |
| `public/textures/corridor/doors/drzwisocial_painted.webp` | 1024x2048 | 92.66 KB | Oui |
| `public/textures/doors/door_back_left_sketch.webp` | 844x2196 | 75.95 KB | Oui |
| `public/textures/doors/door_left_painted.webp` | 810x2108 | 86.28 KB | Oui |
| `public/textures/doors/door_right_painted.webp` | 756x1949 | 85.72 KB | Oui |
| `public/textures/doors/handle_left_painted.webp` | 1280x3328 | 30.83 KB | Oui |
| `public/textures/doors/handle_right_painted.webp` | 787x2048 | 10.09 KB | Oui |
| `public/textures/doors/pien.webp` | 780x2030 | 75.8 KB | Oui |
| `public/textures/entrance/belka.webp` | 2048x256 | 61.21 KB | Oui |
| `public/textures/entrance/bricks.webp` | 2048x2048 | 217.52 KB | Oui |
| `public/textures/entrance/pot_with_duck.webp` | 2048x1024 | 175.11 KB | Oui |
| `public/textures/entrance/pot_with_duck1.webp` | 4096x2048 | 1.08 MB | Non |
| `public/textures/entrance/sign.webp` | 1802x901 | 89.39 KB | Oui |
| `public/textures/entrance/wall_bricks_2.webp` | 2048x1024 | 604.23 KB | Oui |
| `public/textures/entrance/wall_bricks_2_backup.webp` | 2048x1024 | 306.71 KB | Non |
| `public/textures/entrance/wall_bricks_2_ORIGINAL.webp` | 8192x4096 | 2.11 MB | Non |
| `public/textures/entrance/backups/belka.webp` | 1990x227 | 54.91 KB | Oui |
| `public/textures/entrance/backups/bricks.webp` | 2816x1536 | 216.81 KB | Oui |
| `public/textures/entrance/backups/pot_with_duck.png` | 2760x1504 | 4.22 MB | Oui |
| `public/textures/entrance/backups/pot_with_duck.webp` | 2760x1504 | 380.22 KB | Oui |
| `public/textures/entrance/backups/pot_with_duck_painted.png` | 2760x1504 | 2.55 MB | Non |
| `public/textures/entrance/backups/pot_with_duck_painted.webp` | 2760x1504 | 307.49 KB | Non |
| `public/textures/entrance/backups/sign.webp` | 1470x823 | 125.87 KB | Oui |
| `public/textures/entrance/backups/stone-path.webp` | 1005x2317 | 503.4 KB | Oui |
| `public/textures/entrance/backups/stone-path_ORIGINAL.webp` | 1005x2317 | 503.4 KB | Non |
| `public/textures/entrance/backups/wall_bricks_2.webp` | 1536x768 | 174.55 KB | Oui |
| `public/textures/entrance/backups/wall_bricks_2_ORIGINAL.webp` | 6000x3000 | 1.4 MB | Non |
| `public/textures/entrance/backups/window_sketch.webp` | 2754x2862 | 300.79 KB | Oui |
| `public/textures/gallery/miastotlo.webp` | 2048x1024 | 84.93 KB | Oui |
| `public/textures/gallery/openliveproject.webp` | 1024x2048 | 28.24 KB | Oui |
| `public/textures/gallery/railing.webp` | 1228x614 | 86.6 KB | Oui |
| `public/textures/gallery/tylkartki.webp` | 1024x2048 | 45.95 KB | Oui |
| `public/textures/gallery/tylkartki_painted.webp` | 1024x2048 | 82.04 KB | Oui |
| `public/textures/gallery/domki.webp` | 1290x645 | 49.3 KB | Oui |
| `public/textures/studio/phonefront_followmeontiktok.webp` | 1024x2048 | 32.66 KB | Oui |
| `public/textures/studio/phone_back.webp` | 1024x2048 | 19.48 KB | Oui |
| `public/textures/studio/phone_front.webp` | 1024x2048 | 9.9 KB | Oui |
| `public/textures/studio/phone_side.webp` | 2048x256 | 2.87 KB | Oui |
| `public/textures/studio/tvfront_filmikedytowaniezdjec.webp` | 1474x737 | 50.77 KB | Oui |
| `public/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp` | 1699x849 | 89.13 KB | Oui |
| `public/textures/studio/tvfront_filmikprojektdlamultiego.webp` | 1474x737 | 51.39 KB | Oui |
| `public/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp` | 1576x788 | 89.19 KB | Oui |
| `public/textures/studio/tv_back_painted.webp` | 1679x839 | 84.28 KB | Oui |
| `public/textures/studio/tv_bottom.webp` | 1802x901 | 35.64 KB | Oui |
| `public/textures/studio/tv_bottom_painted.webp` | 2048x1024 | 88.84 KB | Oui |
| `public/textures/studio/tv_front.webp` | 2048x1024 | 90.35 KB | Oui |
| `public/textures/studio/tv_front_painted.webp` | 1720x860 | 83.86 KB | Oui |
| `public/textures/studio/tv_side.webp` | 1024x2048 | 61.39 KB | Oui |
| `public/textures/studio/tv_side_painted.webp` | 512x2048 | 85.67 KB | Oui |
| `public/textures/studio/tv_top.webp` | 1310x655 | 66.93 KB | Oui |
| `public/textures/studio/tv_top_painted.webp` | 1413x706 | 61.06 KB | Oui |
| `public/textures/studio/monitorfront_postnafbdoublewinner_painted.webp` | 1679x839 | 40.22 KB | Oui |
| `public/textures/studio/monitor_front_painted.webp` | 2048x1024 | 76.35 KB | Oui |
| `public/textures/studio/monitor_top_painted.webp` | 2048x512 | 89.9 KB | Oui |
| `download:uploads/Screenshot_20260702_204924.png` | 1037x646 | 144.77 KB | Non |
| `download:uploads/Screenshot_20260702_205116.png` | 1040x632 | 243.68 KB | Non |
| `download:uploads/Screenshot_20260702_230112-75b690f0.png` | 1036x643 | 214.02 KB | Non |
| `download:uploads/Screenshot_20260702_230112.png` | 1036x643 | 214.02 KB | Non |
| `download:uploads/Screenshot_20260702_230526-771adc55.png` | 1037x641 | 130.62 KB | Non |
| `download:uploads/Screenshot_20260702_230526.png` | 1037x641 | 130.62 KB | Non |

## 5. Doublons de Fichiers (Même Hash MD5)

Fichiers identiques présents à plusieurs endroits, à consolider.

**Groupe 1 (MD5: `5c89269a65d65cdb33d018012f003ef7`, Taille: 517.67 KB chacun)** :
- `public/models/boutique/lamp/street_lamp_02.bin` (Emplacement: public)
- `public/ville-assets/models/street_lamp/street_lamp_02.bin.glb` (Emplacement: public)
- `download:assets/models/street_lamp/street_lamp_02.bin.glb` (Emplacement: download_zip)

**Groupe 2 (MD5: `d4d49b0153762ebe5ccde8e87af87dd5`, Taille: 642.29 KB chacun)** :
- `public/models/boutique/lamp/textures/street_lamp_02_arm_1k.jpg` (Emplacement: public)
- `public/ville-assets/models/street_lamp/textures/street_lamp_02_arm_1k.jpg` (Emplacement: public)
- `download:assets/models/street_lamp/textures/street_lamp_02_arm_1k.jpg` (Emplacement: download_zip)

**Groupe 3 (MD5: `381097a4c700b86b1c8f7e0d115b1a0a`, Taille: 296.6 KB chacun)** :
- `public/models/boutique/lamp/textures/street_lamp_02_diff_1k.jpg` (Emplacement: public)
- `public/ville-assets/models/street_lamp/textures/street_lamp_02_diff_1k.jpg` (Emplacement: public)
- `download:assets/models/street_lamp/textures/street_lamp_02_diff_1k.jpg` (Emplacement: download_zip)

**Groupe 4 (MD5: `39389c9a5c2c467ea559ac3ad3a03218`, Taille: 363.58 KB chacun)** :
- `public/models/boutique/lamp/textures/street_lamp_02_nor_gl_1k.jpg` (Emplacement: public)
- `public/ville-assets/models/street_lamp/textures/street_lamp_02_nor_gl_1k.jpg` (Emplacement: public)
- `download:assets/models/street_lamp/textures/street_lamp_02_nor_gl_1k.jpg` (Emplacement: download_zip)

**Groupe 5 (MD5: `ee7bd43b52b65b9e2aaa0ae8cf6e8042`, Taille: 318.13 KB chacun)** :
- `public/models/boutique/plant/celandine_01.bin` (Emplacement: public)
- `public/ville-assets/models/celandine/celandine_01.bin.glb` (Emplacement: public)
- `download:assets/models/celandine/celandine_01.bin.glb` (Emplacement: download_zip)

**Groupe 6 (MD5: `f56d64e9d0e313d118ab4103afb5a1ef`, Taille: 373.09 KB chacun)** :
- `public/models/boutique/plant/textures/celandine_01_arm_1k.jpg` (Emplacement: public)
- `public/ville-assets/models/celandine/textures/celandine_01_arm_1k.jpg` (Emplacement: public)
- `download:assets/models/celandine/textures/celandine_01_arm_1k.jpg` (Emplacement: download_zip)

**Groupe 7 (MD5: `d064076be42627d3e41e25af39131ae9`, Taille: 389.13 KB chacun)** :
- `public/models/boutique/plant/textures/celandine_01_diff_1k.jpg` (Emplacement: public)
- `public/ville-assets/models/celandine/textures/celandine_01_diff_1k.jpg` (Emplacement: public)
- `download:assets/models/celandine/textures/celandine_01_diff_1k.jpg` (Emplacement: download_zip)

**Groupe 8 (MD5: `ebc32eefb50c3da0159e5fa62248f561`, Taille: 400.89 KB chacun)** :
- `public/models/boutique/plant/textures/celandine_01_nor_gl_1k.jpg` (Emplacement: public)
- `public/ville-assets/models/celandine/textures/celandine_01_nor_gl_1k.jpg` (Emplacement: public)
- `download:assets/models/celandine/textures/celandine_01_nor_gl_1k.jpg` (Emplacement: download_zip)

**Groupe 9 (MD5: `03e264d6848381e671392c10d1ac251f`, Taille: 768.32 KB chacun)** :
- `public/textures/about/SOTD.webp` (Emplacement: public)
- `public/textures/about/SOTD_painted.webp` (Emplacement: public)
- `public/textures/about/SOTM.webp` (Emplacement: public)
- `public/textures/about/SOTM_painted.webp` (Emplacement: public)
- `public/textures/about/SOTY.webp` (Emplacement: public)
- `public/textures/about/SOTY_painted.webp` (Emplacement: public)
- `public/textures/about/awatarnachmurce.webp` (Emplacement: public)
- `public/textures/about/button.webp` (Emplacement: public)
- `public/textures/about/button_painted.webp` (Emplacement: public)

**Groupe 10 (MD5: `1a0ce06c52a834e9c8ae79575d6abf03`, Taille: 670.78 KB chacun)** :
- `public/textures/about/threejsduzybalon.webp` (Emplacement: public)
- `public/textures/about/threejsduzybalon_painted.webp` (Emplacement: public)
- `public/textures/about/csssrednibalon.webp` (Emplacement: public)
- `public/textures/about/csssrednibalon_painted.webp` (Emplacement: public)
- `public/textures/about/figmamalybalon.webp` (Emplacement: public)
- `public/textures/about/figmamalybalon_painted.webp` (Emplacement: public)
- `public/textures/about/firebasemalybalon.webp` (Emplacement: public)
- `public/textures/about/firebasemalybalon_painted.webp` (Emplacement: public)
- `public/textures/about/gitmalybalon.webp` (Emplacement: public)
- `public/textures/about/gitmalybalon_painted.webp` (Emplacement: public)
- `public/textures/about/GSAPduzybalon.webp` (Emplacement: public)
- `public/textures/about/GSAPduzybalon_painted.webp` (Emplacement: public)
- `public/textures/about/htmlmalybalon.webp` (Emplacement: public)
- `public/textures/about/htmlmalybalon_painted.webp` (Emplacement: public)
- `public/textures/about/JSSREDNIBALON.webp` (Emplacement: public)
- `public/textures/about/JSSREDNIBALON_painted.webp` (Emplacement: public)
- `public/textures/about/nextjssrednibalon.webp` (Emplacement: public)
- `public/textures/about/nextjssrednibalon_painted.webp` (Emplacement: public)
- `public/textures/about/reactduzybalon.webp` (Emplacement: public)
- `public/textures/about/reactduzybalon_painted.webp` (Emplacement: public)

**Groupe 11 (MD5: `eeec7cff6232a34acadbcd03b1cb4b56`, Taille: 835.15 KB chacun)** :
- `public/textures/about/uowyspa.webp` (Emplacement: public)
- `public/textures/about/freelancewyspa.webp` (Emplacement: public)
- `public/textures/gallery/monetuneprzod.webp` (Emplacement: public)
- `public/textures/gallery/monetuneprzod_painted.webp` (Emplacement: public)
- `public/textures/gallery/timberkittyprzod.webp` (Emplacement: public)
- `public/textures/gallery/timberkittyprzod_painted.webp` (Emplacement: public)
- `public/textures/gallery/youngmultiprzod.webp` (Emplacement: public)
- `public/textures/gallery/youngmultiprzod_painted.webp` (Emplacement: public)
- `public/textures/gallery/bioprzod.webp` (Emplacement: public)
- `public/textures/gallery/bioprzod_painted.webp` (Emplacement: public)

**Groupe 12 (MD5: `269c15aa76702dd68ec27007b091a622`, Taille: 68.31 KB chacun)** :
- `public/textures/contact/paper_form.webp` (Emplacement: public)
- `public/textures/contact/backups/paper_form.webp` (Emplacement: public)

**Groupe 13 (MD5: `afb3c2d80f48b49b2b22891bf35f9eb5`, Taille: 20.05 KB chacun)** :
- `public/textures/corridor/backups/doors/door_back.webp` (Emplacement: public)
- `public/textures/doors/door_back.webp` (Emplacement: public)

**Groupe 14 (MD5: `f2aed2e72859865e0cfb95136f31abe0`, Taille: 20.68 KB chacun)** :
- `public/textures/corridor/backups/doors/frame_sketch.webp` (Emplacement: public)
- `public/textures/doors/frame_sketch.webp` (Emplacement: public)

**Groupe 15 (MD5: `6eb0af3cbca735addd6cbb640514ed92`, Taille: 2.73 KB chacun)** :
- `public/textures/corridor/backups/doors/handle_left_sketch.webp` (Emplacement: public)
- `public/textures/doors/handle_left_sketch.webp` (Emplacement: public)

**Groupe 16 (MD5: `cadfacd0e8d9cfce0b564a494364df4d`, Taille: 2.92 KB chacun)** :
- `public/textures/corridor/backups/doors/handle_right_sketch.webp` (Emplacement: public)
- `public/textures/doors/handle_right_sketch.webp` (Emplacement: public)

**Groupe 17 (MD5: `34fd2d94d35d80b6777953f12b3cdea1`, Taille: 37.34 KB chacun)** :
- `public/textures/entrance/avatar_window.webp` (Emplacement: public)
- `public/textures/entrance/avatar_window_test.webp` (Emplacement: public)

**Groupe 18 (MD5: `3871f1d34abcd63e806ea9c412381db4`, Taille: 503.4 KB chacun)** :
- `public/textures/entrance/backups/stone-path.webp` (Emplacement: public)
- `public/textures/entrance/backups/stone-path_ORIGINAL.webp` (Emplacement: public)

## 6. Fichiers Présents sur Disque mais Non Référencés dans le Code

Ces fichiers ne semblent pas être directement importés ou référencés dans `src/` ou `index.html`. Ils doivent être validés avant suppression.

| Fichier | Taille | Type | Statut Suggéré |
|---------|--------|------|----------------|
| `public/cursors/cursor-default.webp` | 730.0 B | image | À valider |
| `public/cursors/cursor-pointer.webp` | 680.0 B | image | À valider |
| `public/models/boutique/armchair/textures/Armchair_01_arm_1k.jpg` | 135.08 KB | image | À valider |
| `public/models/boutique/armchair/textures/Armchair_01_diff_1k.jpg` | 179.93 KB | image | À valider |
| `public/models/boutique/armchair/textures/Armchair_01_nor_gl_1k.jpg` | 283.12 KB | image | À valider |
| `public/models/boutique/desk/textures/metal_office_desk_arm_1k.jpg` | 704.7 KB | image | À valider |
| `public/models/boutique/desk/textures/metal_office_desk_diff_1k.jpg` | 459.8 KB | image | À valider |
| `public/models/boutique/desk/textures/metal_office_desk_nor_gl_1k.jpg` | 166.87 KB | image | À valider |
| `public/models/boutique/lamp/textures/street_lamp_02_arm_1k.jpg` | 642.29 KB | image | À valider |
| `public/models/boutique/lamp/textures/street_lamp_02_diff_1k.jpg` | 296.6 KB | image | À valider |
| `public/models/boutique/lamp/textures/street_lamp_02_nor_gl_1k.jpg` | 363.58 KB | image | À valider |
| `public/models/boutique/plant/textures/celandine_01_arm_1k.jpg` | 373.09 KB | image | À valider |
| `public/models/boutique/plant/textures/celandine_01_diff_1k.jpg` | 389.13 KB | image | À valider |
| `public/models/boutique/plant/textures/celandine_01_nor_gl_1k.jpg` | 400.89 KB | image | À valider |
| `public/sounds/szummonitorow.mp3` | 2.29 MB | audio | À valider |
| `public/textures/contact/backups/czescglownabutelki.webp` | 27.99 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/facebooklink.webp` | 148.9 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/fala1.webp` | 72.2 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/fala2.webp` | 54.77 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/faletopdown_black.webp` | 462.45 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/githublink.webp` | 162.05 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/instagramlink.webp` | 154.56 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/linkedinlink.webp` | 152.79 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/maillink.webp` | 138.33 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/papiernabutelke.webp` | 12.7 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/contact/backups/zakretkabutelki.webp` | 9.56 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/floor_wood.webp` | 51.3 KB | image | À valider |
| `public/textures/corridor/zakonczeniepodlogi.webp` | 92.48 KB | image | À valider |
| `public/textures/corridor/backups/rysuneknaobrazek2.png` | 6.02 MB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/rysuneknaobrazek2.webp` | 283.19 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.png` | 8.85 MB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.webp` | 627.84 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/shakerholy.png` | 674.0 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/shakerholy.webp` | 63.71 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/thegallerysign.webp` | 294.2 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/thestudiosign.webp` | 303.84 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/zakonczeniepodlogi.png` | 6.14 MB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/zakonczeniepodlogi.webp` | 474.0 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/aboutsign.webp` | 273.04 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/contactsign.webp` | 303.72 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/floor_wood.webp` | 38.96 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/corridor/backups/itom_text.webp` | 92.99 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/entrance/avatar_window_test.webp` | 37.34 KB | image | À valider |
| `public/textures/entrance/cat_blink.webp` | 44.82 KB | image | À valider |
| `public/textures/entrance/cat_meow_body.webp` | 42.0 KB | image | À valider |
| `public/textures/entrance/pot_with_duck1.webp` | 1.08 MB | image | À valider |
| `public/textures/entrance/wall_bricks_2_backup.webp` | 306.71 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/entrance/wall_bricks_2_ORIGINAL.webp` | 2.11 MB | image | À valider |
| `public/textures/entrance/window_bg.webp` | 1.88 KB | image | À valider |
| `public/textures/entrance/backups/pot_with_duck_painted.png` | 2.55 MB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/entrance/backups/pot_with_duck_painted.webp` | 307.49 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/entrance/backups/stone-path_ORIGINAL.webp` | 503.4 KB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/entrance/backups/wall_bricks_2_ORIGINAL.webp` | 1.4 MB | image | À supprimer (Fichier temporaire / Backup) |
| `public/textures/gallery/netlifylogo_painted.webp` | 5.1 KB | image | À valider |
| `public/textures/gallery/phplogo_painted.webp` | 4.74 KB | image | À valider |
| `public/textures/gallery/reactlogo_painted.webp` | 9.56 KB | image | À valider |
| `public/textures/gallery/tailwindlogo_painted.webp` | 4.79 KB | image | À valider |
| `public/textures/gallery/wordpresslogo_painted.webp` | 8.34 KB | image | À valider |
| `public/textures/gallery/elementorlogo_painted.webp` | 12.92 KB | image | À valider |
| `public/textures/gallery/firebaselogo_painted.webp` | 5.89 KB | image | À valider |
| `public/textures/gallery/htmllogo_painted.webp` | 6.98 KB | image | À valider |
| `public/textures/gallery/jslogo_painted.webp` | 8.38 KB | image | À valider |
| `public/ville-assets/kenney/preview-sample.png` | 186.26 KB | image | À valider |
| `public/ville-assets/kenney/Textures/colormap.png` | 10.74 KB | image | À valider |
| `public/ville-assets/models/celandine/celandine_01.bin.glb` | 318.13 KB | model | À valider |
| `public/ville-assets/models/celandine/textures/celandine_01_arm_1k.jpg` | 373.09 KB | image | À valider |
| `public/ville-assets/models/celandine/textures/celandine_01_diff_1k.jpg` | 389.13 KB | image | À valider |
| `public/ville-assets/models/celandine/textures/celandine_01_nor_gl_1k.jpg` | 400.89 KB | image | À valider |
| `public/ville-assets/models/street_lamp/street_lamp_02.bin.glb` | 517.67 KB | model | À valider |
| `public/ville-assets/models/street_lamp/textures/street_lamp_02_arm_1k.jpg` | 642.29 KB | image | À valider |
| `public/ville-assets/models/street_lamp/textures/street_lamp_02_diff_1k.jpg` | 296.6 KB | image | À valider |
| `public/ville-assets/models/street_lamp/textures/street_lamp_02_nor_gl_1k.jpg` | 363.58 KB | image | À valider |

## 7. Recommandations d'Optimisation et Gains Estimés

| Fichier | Taille Actuelle | Action Recommandée | Gain Estimé | Justification |
|---------|-----------------|---------------------|-------------|---------------|
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.png` | 8.85 MB | Supprimer (non référencé) | **8.85 MB** (~100%) | Non utilisé dans le code |
| `public/textures/corridor/backups/rysuneknaobrazek2_painted.png` | 8.85 MB | Resize to max 1024px (1024x576) + Convert to WebP | **8.19 MB** (~92%) | Original: 2730x1536 .png |
| `public/textures/corridor/backups/zakonczeniepodlogi.png` | 6.14 MB | Supprimer (non référencé) | **6.14 MB** (~100%) | Non utilisé dans le code |
| `public/textures/corridor/backups/rysuneknaobrazek2.png` | 6.02 MB | Supprimer (non référencé) | **6.02 MB** (~100%) | Non utilisé dans le code |
| `public/textures/corridor/backups/zakonczeniepodlogi.png` | 6.14 MB | Resize to max 1024px (1024x809) + Convert to WebP | **5.68 MB** (~92%) | Original: 2268x1792 .png |
| `public/textures/corridor/backups/rysuneknaobrazek2.png` | 6.02 MB | Resize to max 1024px (1024x576) + Convert to WebP | **5.57 MB** (~92%) | Original: 2730x1536 .png |
| `public/textures/contact/backups/beczka.png` | 5.26 MB | Resize to max 1024px (947x1024) + Convert to WebP | **4.87 MB** (~92%) | Original: 1984x2144 .png |
| `public/textures/entrance/backups/pot_with_duck.png` | 4.22 MB | Resize to max 1024px (1024x558) + Convert to WebP | **3.91 MB** (~92%) | Original: 2760x1504 .png |
| `public/textures/contact/backups/beczka_painted.png` | 4.06 MB | Resize to max 1024px (947x1024) + Convert to WebP | **3.76 MB** (~92%) | Original: 1984x2144 .png |
| `public/textures/corridor/backups/ramkanazdjecieduza_painted.png` | 3.27 MB | Resize to max 1024px (1024x578) + Convert to WebP | **3.03 MB** (~92%) | Original: 2685x1517 .png |
| `public/textures/entrance/backups/pot_with_duck_painted.png` | 2.55 MB | Supprimer (non référencé) | **2.55 MB** (~100%) | Non utilisé dans le code |
| `public/textures/entrance/backups/pot_with_duck_painted.png` | 2.55 MB | Resize to max 1024px (1024x558) + Convert to WebP | **2.36 MB** (~92%) | Original: 2760x1504 .png |
| `public/sounds/szummonitorow.mp3` | 2.29 MB | À valider & supprimer | **2.29 MB** (~100%) | Non utilisé dans le code |
| `public/textures/entrance/wall_bricks_2_ORIGINAL.webp` | 2.11 MB | À valider & supprimer | **2.11 MB** (~100%) | Non utilisé dans le code |
| `public/models/boutique/sofa.glb` | 3.0 MB | Compression Draco / gltf-transform | **1.8 MB** (~60%) | Compression géométrie & textures du modèle |
| `public/textures/entrance/wall_bricks_2_ORIGINAL.webp` | 2.11 MB | Resize to max 1024px (1024x512) | **1.74 MB** (~82%) | Original: 8192x4096 .webp |
| `public/textures/corridor/backups/pustatabliczka.png` | 1.53 MB | Resize to max 1024px (1024x571) + Convert to WebP | **1.42 MB** (~92%) | Original: 2752x1536 .png |
| `public/textures/entrance/backups/wall_bricks_2_ORIGINAL.webp` | 1.4 MB | Supprimer (non référencé) | **1.4 MB** (~100%) | Non utilisé dans le code |
| `public/textures/contact/backups/latarnia.png` | 1.47 MB | Resize to max 1024px (921x1024) + Convert to WebP | **1.36 MB** (~92%) | Original: 1102x1225 .png |
| `public/textures/entrance/backups/wall_bricks_2_ORIGINAL.webp` | 1.4 MB | Resize to max 1024px (1024x512) | **1.16 MB** (~82%) | Original: 6000x3000 .webp |
| `public/textures/entrance/pot_with_duck1.webp` | 1.08 MB | À valider & supprimer | **1.08 MB** (~100%) | Non utilisé dans le code |
| `public/textures/entrance/pot_with_duck1.webp` | 1.08 MB | Resize to max 1024px (1024x512) | **916.17 KB** (~82%) | Original: 4096x2048 .webp |
| `public/textures/boutique/wall-art-right.jpg` | 989.48 KB | Resize to max 1024px (764x1024) + Convert to WebP | **915.27 KB** (~92%) | Original: 896x1200 .jpg |
| `public/textures/boutique/wall-art-left.jpg` | 976.27 KB | Resize to max 1024px (764x1024) + Convert to WebP | **903.05 KB** (~92%) | Original: 896x1200 .jpg |
| `public/textures/about/freelancewyspa.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/monetuneprzod.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/monetuneprzod_painted.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/timberkittyprzod.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/timberkittyprzod_painted.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/youngmultiprzod.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/youngmultiprzod_painted.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/bioprzod.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/gallery/bioprzod_painted.webp` | 835.15 KB | Supprimer doublon | **835.15 KB** (~100%) | Doublon exact de public/textures/about/uowyspa.webp |
| `public/textures/corridor/backups/doors/drzwiabout_painted.webp` | 949.98 KB | Resize to max 1024px (383x1024) | **783.74 KB** (~82%) | Original: 1245x3328 .webp |
| `public/ville-assets/models/m1.glb` | 1.27 MB | Compression Draco / gltf-transform | **781.78 KB** (~60%) | Compression géométrie & textures du modèle |
| `public/textures/about/SOTD_painted.webp` | 768.32 KB | Supprimer doublon | **768.32 KB** (~100%) | Doublon exact de public/textures/about/SOTD.webp |
| `public/textures/about/SOTM.webp` | 768.32 KB | Supprimer doublon | **768.32 KB** (~100%) | Doublon exact de public/textures/about/SOTD.webp |
| `public/textures/about/SOTM_painted.webp` | 768.32 KB | Supprimer doublon | **768.32 KB** (~100%) | Doublon exact de public/textures/about/SOTD.webp |
| `public/textures/about/SOTY.webp` | 768.32 KB | Supprimer doublon | **768.32 KB** (~100%) | Doublon exact de public/textures/about/SOTD.webp |
| `public/textures/about/SOTY_painted.webp` | 768.32 KB | Supprimer doublon | **768.32 KB** (~100%) | Doublon exact de public/textures/about/SOTD.webp |

### Résumé du Plan d'Optimisation

1. **Compression Draco sur les modèles GLB** : Réduit de 60% le poids des bâtiments et objets 3D de la mini-ville.
2. **Redimensionnement POT & WebP pour les textures** : Optimise le chargement GPU et mémoire en convertissant en formats compressés modernes.
3. **Nettoyage des sauvegardes et fichiers temporaires** : Libère de l'espace inutile dans le bundle de production.
4. **Consolidation des doublons** : Référencer une seule copie des fichiers identiques.
