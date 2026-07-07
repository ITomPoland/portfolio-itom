# Rapport de Compression des Textures — Tâche 022

Ce rapport présente les résultats de la compression in-place des textures référencées lourdes (>300 KB ou >1024px).

## Métriques Globales

- **Nombre de textures traitées** : 99
- **Taille totale initiale** : 35.24 MB
- **Taille totale après compression** : 6.11 MB
- **Taille totale économisée** : **29.13 MB** (Réduction de **82.7%**)

## Détails par Fichier

| Texture | Dimensions Initiales | Dimensions Finales | Taille Initiale | Taille Finale | Gain | Réduction |
|---------|----------------------|--------------------|-----------------|---------------|------|-----------|
| `public/textures/boutique/wall-art-right.jpg` | 896x1200 | 765x1024 | 989.48 KB | 177.57 KB | 811.9 KB | 82.1% |
| `public/textures/boutique/wall-art-left.jpg` | 896x1200 | 765x1024 | 976.27 KB | 182.67 KB | 793.59 KB | 81.3% |
| `public/textures/about/freelancewyspa.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/about/uowyspa.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/monetuneprzod.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/monetuneprzod_painted.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/timberkittyprzod.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/timberkittyprzod_painted.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/youngmultiprzod.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/youngmultiprzod_painted.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/bioprzod.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/gallery/bioprzod_painted.webp` | 1024x1024 | 1024x1024 | 835.15 KB | 86.54 KB | 748.61 KB | 89.6% |
| `public/textures/about/awatarnachmurce.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/button.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/button_painted.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/SOTD.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/SOTD_painted.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/SOTM.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/SOTM_painted.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/SOTY.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/about/SOTY_painted.webp` | 1024x1024 | 1024x1024 | 768.32 KB | 84.04 KB | 684.29 KB | 89.1% |
| `public/textures/boutique/wall-art-back.jpg` | 896x1200 | 765x1024 | 768.66 KB | 128.58 KB | 640.08 KB | 83.3% |
| `public/textures/about/csssrednibalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/csssrednibalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/figmamalybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/figmamalybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/firebasemalybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/firebasemalybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/gitmalybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/gitmalybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/GSAPduzybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/GSAPduzybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/htmlmalybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/htmlmalybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/JSSREDNIBALON.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/JSSREDNIBALON_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/nextjssrednibalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/nextjssrednibalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/reactduzybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/reactduzybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/threejsduzybalon.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/about/threejsduzybalon_painted.webp` | 1024x1024 | 1024x1024 | 670.78 KB | 54.99 KB | 615.79 KB | 91.8% |
| `public/textures/entrance/wall_bricks_2.webp` | 2048x1024 | 1024x512 | 604.23 KB | 97.05 KB | 507.18 KB | 83.9% |
| `public/textures/corridor/drzewkowdoniczce.webp` | 1024x2048 | 512x1024 | 257.34 KB | 94.0 KB | 163.34 KB | 63.5% |
| `public/textures/entrance/bricks.webp` | 2048x2048 | 1024x1024 | 217.52 KB | 91.63 KB | 125.89 KB | 57.9% |
| `public/textures/entrance/pot_with_duck.webp` | 2048x1024 | 1024x512 | 175.11 KB | 81.29 KB | 93.83 KB | 53.6% |
| `public/textures/studio/monitor_top_painted.webp` | 2048x512 | 1024x256 | 89.9 KB | 23.28 KB | 66.62 KB | 74.1% |
| `public/textures/studio/tv_side_painted.webp` | 512x2048 | 256x1024 | 85.67 KB | 23.72 KB | 61.95 KB | 72.3% |
| `public/textures/corridor/pustatabliczka.webp` | 2048x1024 | 1024x512 | 90.15 KB | 33.28 KB | 56.87 KB | 63.1% |
| `public/textures/studio/tv_front.webp` | 2048x1024 | 1024x512 | 90.35 KB | 37.6 KB | 52.74 KB | 58.4% |
| `public/textures/corridor/doors/drzwisocial.webp` | 1024x2048 | 512x1024 | 80.28 KB | 30.87 KB | 49.41 KB | 61.5% |
| `public/textures/corridor/gorastolika.webp` | 2048x512 | 1024x256 | 94.33 KB | 46.82 KB | 47.51 KB | 50.4% |
| `public/textures/contact/statek.webp` | 4096x1024 | 1024x256 | 69.93 KB | 22.88 KB | 47.05 KB | 67.3% |
| `public/textures/gallery/miastotlo.webp` | 2048x1024 | 1024x512 | 84.93 KB | 39.83 KB | 45.1 KB | 53.1% |
| `public/textures/studio/tv_side.webp` | 1024x2048 | 512x1024 | 61.39 KB | 17.65 KB | 43.74 KB | 71.3% |
| `public/textures/corridor/ramkanazdjecieduza.webp` | 2048x1024 | 1024x512 | 65.65 KB | 22.29 KB | 43.36 KB | 66.0% |
| `public/textures/entrance/belka.webp` | 2048x256 | 1024x128 | 61.21 KB | 27.4 KB | 33.81 KB | 55.2% |
| `public/textures/corridor/ramkanazdjecieduza_painted.webp` | 2048x1024 | 1024x512 | 74.36 KB | 41.62 KB | 32.73 KB | 44.0% |
| `public/textures/studio/tv_bottom_painted.webp` | 2048x1024 | 1024x512 | 88.84 KB | 57.99 KB | 30.85 KB | 34.7% |
| `public/textures/gallery/tylkartki.webp` | 1024x2048 | 512x1024 | 45.95 KB | 15.91 KB | 30.03 KB | 65.4% |
| `public/textures/studio/monitor_front_painted.webp` | 2048x1024 | 1024x512 | 76.35 KB | 47.75 KB | 28.6 KB | 37.5% |
| `public/textures/doors/handle_left_painted.webp` | 1280x3328 | 394x1024 | 30.83 KB | 3.92 KB | 26.91 KB | 87.3% |
| `public/textures/gallery/tylkartki_painted.webp` | 1024x2048 | 512x1024 | 82.04 KB | 57.47 KB | 24.57 KB | 29.9% |
| `public/textures/corridor/decorations/coffee_debug.webp` | 1761x880 | 1024x512 | 56.89 KB | 33.21 KB | 23.68 KB | 41.6% |
| `public/textures/corridor/kratkawentylacyjna.webp` | 2048x1024 | 1024x512 | 34.85 KB | 11.49 KB | 23.36 KB | 67.0% |
| `public/textures/corridor/texturadrewnadonozekbiurka.webp` | 2048x128 | 1024x64 | 31.5 KB | 11.01 KB | 20.49 KB | 65.0% |
| `public/textures/contact/paper_form.webp` | 1197x1340 | 915x1024 | 68.31 KB | 48.1 KB | 20.21 KB | 29.6% |
| `public/textures/gallery/openliveproject.webp` | 1024x2048 | 512x1024 | 28.24 KB | 10.72 KB | 17.52 KB | 62.0% |
| `public/textures/paper-texture.webp` | 1215x680 | 1024x573 | 21.89 KB | 5.3 KB | 16.59 KB | 75.8% |
| `public/textures/studio/phonefront_followmeontiktok.webp` | 1024x2048 | 512x1024 | 32.66 KB | 17.81 KB | 14.85 KB | 45.5% |
| `public/textures/doors/door_back_left_sketch.webp` | 844x2196 | 394x1024 | 75.95 KB | 63.42 KB | 12.53 KB | 16.5% |
| `public/textures/studio/phone_back.webp` | 1024x2048 | 512x1024 | 19.48 KB | 7.02 KB | 12.46 KB | 63.9% |
| `public/textures/entrance/sign.webp` | 1802x901 | 1024x512 | 89.39 KB | 77.41 KB | 11.99 KB | 13.4% |
| `public/textures/corridor/kratanalampy.webp` | 1515x757 | 1024x512 | 85.99 KB | 74.08 KB | 11.91 KB | 13.9% |
| `public/textures/doors/door_left_painted.webp` | 810x2108 | 393x1024 | 86.28 KB | 74.71 KB | 11.57 KB | 13.4% |
| `public/textures/studio/phone_front.webp` | 1024x2048 | 512x1024 | 9.9 KB | 2.79 KB | 7.11 KB | 71.8% |
| `public/textures/corridor/doors/drzwiabout_painted.webp` | 1024x2048 | 512x1024 | 81.75 KB | 75.23 KB | 6.52 KB | 8.0% |
| `public/textures/doors/handle_right_painted.webp` | 787x2048 | 394x1024 | 10.09 KB | 3.87 KB | 6.22 KB | 61.6% |
| `public/textures/doors/door_right_painted.webp` | 756x1949 | 397x1024 | 85.72 KB | 79.95 KB | 5.78 KB | 6.7% |
| `public/textures/doors/pien.webp` | 780x2030 | 393x1024 | 75.8 KB | 70.88 KB | 4.93 KB | 6.5% |
| `public/textures/corridor/doors/drzwisocial_painted.webp` | 1024x2048 | 512x1024 | 92.66 KB | 87.92 KB | 4.74 KB | 5.1% |
| `public/textures/studio/phone_side.webp` | 2048x256 | 1024x128 | 2.87 KB | 1.1 KB | 1.77 KB | 61.6% |
| `public/textures/studio/tv_bottom.webp` | 1802x901 | 1024x512 | 35.64 KB | 34.42 KB | 1.22 KB | 3.4% |
| `public/textures/studio/tv_front_painted.webp` | 1720x860 | 1024x512 | 83.86 KB | 88.66 KB | -4.8 KB | -5.7% |
| `public/textures/studio/tvfront_filmikedytowaniezdjec_painted.webp` | 1699x849 | 1024x512 | 89.13 KB | 94.72 KB | -5.58 KB | -6.3% |
| `public/textures/corridor/doors/drzwiprojekty_painted.webp` | 880x1761 | 512x1024 | 89.33 KB | 95.14 KB | -5.81 KB | -6.5% |
| `public/textures/corridor/decorations/while_true_loop.webp` | 1249x624 | 1024x512 | 47.98 KB | 53.79 KB | -5.81 KB | -12.1% |
| `public/textures/corridor/doors/drzwikontakt_painted.webp` | 880x1761 | 512x1024 | 73.64 KB | 80.16 KB | -6.52 KB | -8.9% |
| `public/textures/studio/tv_back_painted.webp` | 1679x839 | 1024x512 | 84.28 KB | 91.29 KB | -7.02 KB | -8.3% |
| `public/textures/studio/tvfront_filmikedytowaniezdjec.webp` | 1474x737 | 1024x512 | 50.77 KB | 59.65 KB | -8.87 KB | -17.5% |
| `public/textures/studio/monitorfront_postnafbdoublewinner_painted.webp` | 1679x839 | 1024x512 | 40.22 KB | 49.63 KB | -9.41 KB | -23.4% |
| `public/textures/studio/tvfront_filmikprojektdlamultiego.webp` | 1474x737 | 1024x512 | 51.39 KB | 60.87 KB | -9.48 KB | -18.4% |
| `public/textures/corridor/decorations/idea_process.webp` | 604x1208 | 512x1024 | 92.87 KB | 103.0 KB | -10.14 KB | -10.9% |
| `public/textures/studio/tvfront_filmikprojektdlamultiego_painted.webp` | 1576x788 | 1024x512 | 89.19 KB | 103.95 KB | -14.76 KB | -16.6% |
| `public/textures/gallery/domki.webp` | 1290x645 | 1024x512 | 49.3 KB | 71.59 KB | -22.29 KB | -45.2% |
| `public/textures/studio/tv_top.webp` | 1310x655 | 1024x512 | 66.93 KB | 90.71 KB | -23.78 KB | -35.5% |
| `public/textures/studio/tv_top_painted.webp` | 1413x706 | 1024x512 | 61.06 KB | 85.45 KB | -24.38 KB | -39.9% |
| `public/textures/contact/faletopdown.webp` | 1351x675 | 1024x512 | 59.96 KB | 89.08 KB | -29.12 KB | -48.6% |
| `public/textures/gallery/railing.webp` | 1228x614 | 1024x512 | 86.6 KB | 119.9 KB | -33.3 KB | -38.5% |
