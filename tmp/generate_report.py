import json
import os
import math

RAW_JSON_PATH = '/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom/tmp/assets_raw.json'
REPORT_PATH = '/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom/tmp/asset_audit_021.md'

def format_size(bytes_size):
    if bytes_size == 0:
        return "0 B"
    sizes = ["B", "KB", "MB", "GB"]
    i = int(math.floor(math.log(bytes_size, 1024)))
    p = math.pow(1024, i)
    s = round(bytes_size / p, 2)
    return f"{s} {sizes[i]}"

def get_nearest_pot(n):
    if n <= 0:
        return 1
    p1 = 2 ** int(math.floor(math.log2(n)))
    p2 = 2 ** int(math.ceil(math.log2(n)))
    return p1 if abs(n - p1) < abs(n - p2) else p2

def generate():
    with open(RAW_JSON_PATH, 'r') as f:
        assets = json.load(f)
        
    # Categorize assets
    images = [a for a in assets if a['type'] == 'image']
    models = [a for a in assets if a['type'] == 'model']
    audios = [a for a in assets if a['type'] == 'audio']
    videos = [a for a in assets if a['type'] == 'video']
    zips = [a for a in assets if a['type'] == 'zip_archive']
    others = [a for a in assets if a['type'] == 'other']
    
    total_size = sum(a['size'] for a in assets)
    
    # 1. Top 20 Heaviest Files
    # Exclude zip members if they are redundant with public/src, but wait!
    # Let's list files that are on disk (location != 'download_zip') first for actual disk usage,
    # and zip members separately, or include all. Let's do a top 20 disk files, as these are the ones
    # affecting the server and the download. Let's keep the zip archive itself as one file,
    # but filter out the individual members of the zip from the "Top 20 disk files", or list them if they are huge.
    # Actually, let's rank all files including zip members but clearly mark their location.
    top_20 = sorted(assets, key=lambda x: x['size'], reverse=True)[:20]
    
    # 2. NPOT Textures
    # Let's find images that have pot_status == 'NPOT' and are textures.
    # Textures are files containing "textures" in their path, or under "public/textures".
    npot_textures = []
    for img in images:
        is_tex = 'textures' in img['path'].lower() or 'public/textures' in img['path'].lower() or 'ville-assets' in img['path'].lower()
        if img['pot_status'] == 'NPOT' and is_tex:
            npot_textures.append(img)
            
    # 3. Images > 1024px
    large_images = [img for img in images if img['width'] and (img['width'] > 1024 or img['height'] > 1024)]
    
    # 4. Duplicates
    # Group by md5
    md5_map = {}
    for a in assets:
        # Skip zip itself if we compare with its content, but comparing zip members and disk files is good
        md5_map.setdefault(a['md5'], []).append(a)
        
    duplicates = {}
    for md5, files in md5_map.items():
        if len(files) > 1:
            duplicates[md5] = files
            
    # 5. Non-referenced files
    # Only check files on actual disk (location in ['public', 'src'])
    unreferenced = [a for a in assets if a['location'] in ['public', 'src'] and not a['referenced']]
    
    # Recommendations & savings calculations
    rec_rows = []
    total_est_savings = 0
    
    # GLB models compression recommendation
    for m in models:
        # If model is on disk and is larger than 100 KB
        if m['location'] in ['public', 'src'] and m['size'] > 100 * 1024:
            # Estimate 60% reduction with compression (Draco / optimization)
            saving = int(m['size'] * 0.60)
            total_est_savings += saving
            rec_rows.append({
                'file': m['path'],
                'size': m['size'],
                'action': 'Compression Draco / gltf-transform',
                'est_saving': saving,
                'note': f"Compression géométrie & textures du modèle"
            })
            
    # NPOT & Large images resize/webp recommendation
    for img in images:
        if img['location'] not in ['public', 'src']:
            continue
        
        need_resize = img['width'] and (img['width'] > 1024 or img['height'] > 1024)
        need_pot = img['pot_status'] == 'NPOT' and ('textures' in img['path'].lower() or 'ville-assets' in img['path'].lower())
        need_webp = not img['path'].endswith('.webp')
        
        if need_resize or need_pot or need_webp:
            action_parts = []
            target_w, target_h = img['width'], img['height']
            
            # Estimate savings
            factor = 1.0
            if need_resize:
                # Resize to max 1024
                scale = min(1024 / img['width'], 1024 / img['height'])
                target_w = int(img['width'] * scale)
                target_h = int(img['height'] * scale)
                factor *= 0.25 # Area is 1/4 or less
                action_parts.append(f"Resize to max 1024px ({target_w}x{target_h})")
                
            if need_pot and not need_resize:
                # Resize to nearest POT
                target_w = get_nearest_pot(img['width'])
                target_h = get_nearest_pot(img['height'])
                # POT scaling is usually small, area ratio:
                factor *= (target_w * target_h) / (img['width'] * img['height'])
                action_parts.append(f"Resize to POT ({target_w}x{target_h})")
                
            if need_webp:
                factor *= 0.3 # WebP is ~30% size of PNG/JPG
                action_parts.append("Convert to WebP")
            else:
                factor *= 0.7 # If already WebP, optimization / resize saving
                
            saving = int(img['size'] * (1 - factor))
            # Limit saving to size of file
            saving = max(0, min(img['size'] - 100, saving))
            
            if saving > 1024: # Only list significant savings (>1KB)
                total_est_savings += saving
                rec_rows.append({
                    'file': img['path'],
                    'size': img['size'],
                    'action': ' + '.join(action_parts),
                    'est_saving': saving,
                    'note': f"Original: {img['width']}x{img['height']} {img['ext']}"
                })
                
    # Duplicates removal recommendation
    for md5, files in duplicates.items():
        # Keep one, remove others if they are on disk
        disk_files = [f for f in files if f['location'] in ['public', 'src']]
        if len(disk_files) > 1:
            # Keep the first one, remove others
            for f in disk_files[1:]:
                saving = f['size']
                total_est_savings += saving
                rec_rows.append({
                    'file': f['path'],
                    'size': f['size'],
                    'action': 'Supprimer doublon',
                    'est_saving': saving,
                    'note': f"Doublon exact de {disk_files[0]['path']}"
                })

    # Unreferenced files removal
    for f in unreferenced:
        # If it's a backup or tmp file
        is_backup = 'backup' in f['path'].lower() or 'tmp' in f['path'].lower() or f['path'].endswith('.tmp')
        action = "Supprimer (non référencé)" if is_backup else "À valider & supprimer"
        saving = f['size']
        total_est_savings += saving
        rec_rows.append({
            'file': f['path'],
            'size': f['size'],
            'action': action,
            'est_saving': saving,
            'note': "Non utilisé dans le code"
        })

    # Build Markdown Report
    with open(REPORT_PATH, 'w', encoding='utf-8') as md:
        md.write("# Rapport d'Audit des Assets — Hakkilo XR\n\n")
        
        md.write("Ce rapport présente un inventaire détaillé des ressources (images, modèles 3D, sons, zips) ")
        md.write("du site afin de guider les optimisations de performance de chargement mobile-first.\n\n")
        
        md.write("## 1. Métriques Globales\n\n")
        md.write(f"- **Nombre total d'assets inventoriés** : {len(assets)}\n")
        md.write(f"- **Taille totale sur disque** : {format_size(total_size)}\n")
        md.write(f"- **Gain potentiel total estimé** : **{format_size(total_est_savings)}**\n\n")
        
        # Summary table by category
        md.write("### Répartition par catégorie\n\n")
        md.write("| Catégorie | Nombre | Taille totale | Description |\n")
        md.write("|-----------|--------|---------------|-------------|\n")
        md.write(f"| Images | {len(images)} | {format_size(sum(i['size'] for i in images))} | Textures, illustrations, UI |\n")
        md.write(f"| Modèles 3D | {len(models)} | {format_size(sum(m['size'] for m in models))} | GLB, GLTF et buffers binaires |\n")
        md.write(f"| Audio | {len(audios)} | {format_size(sum(a['size'] for a in audios))} | Sons d'ambiance et effets |\n")
        md.write(f"| Vidéos | {len(videos)} | {format_size(sum(v['size'] for v in videos))} | Séquences vidéo |\n")
        md.write(f"| Zips / Archives | {len(zips)} | {format_size(sum(z['size'] for z in zips))} | Sources d'assets ou téléchargements |\n")
        md.write(f"| Autres | {len(others)} | {format_size(sum(o['size'] for o in others))} | Fichiers divers |\n\n")
        
        # 2. Top 20 Heaviest Files
        md.write("## 2. Top 20 des Fichiers les plus Lourds\n\n")
        md.write("Ces fichiers représentent la priorité absolue pour les actions de compression.\n\n")
        md.write("| Rang | Fichier | Taille | Emplacement | Type | Réf. dans le code |\n")
        md.write("|------|---------|--------|-------------|------|-------------------|\n")
        for i, a in enumerate(top_20, 1):
            ref_str = "Oui" if a['referenced'] else "Non (à confirmer)"
            md.write(f"| {i} | `{a['path']}` | {format_size(a['size'])} | {a['location']} | {a['type']} | {ref_str} |\n")
        md.write("\n")
        
        # 3. NPOT Textures
        md.write("## 3. Images Non-Power-of-Two (NPOT) Utilisées comme Textures\n\n")
        md.write("Les textures NPOT empêchent WebGL d'utiliser le mipmapping efficace et peuvent causer du gaspillage de mémoire GPU.\n\n")
        if not npot_textures:
            md.write("*Aucune texture NPOT détectée.*\n\n")
        else:
            md.write("| Fichier | Dimensions | POT Recommandé | Taille | Réf. |\n")
            md.write("|---------|------------|----------------|--------|------|\n")
            for img in npot_textures:
                ref_str = "Oui" if img['referenced'] else "Non"
                pot_w = get_nearest_pot(img['width'])
                pot_h = get_nearest_pot(img['height'])
                md.write(f"| `{img['path']}` | {img['width']}x{img['height']} | {pot_w}x{pot_h} | {format_size(img['size'])} | {ref_str} |\n")
            md.write("\n")
            
        # 4. Images > 1024px
        md.write("## 4. Images de grande taille (> 1024px)\n\n")
        md.write("Ces images sont souvent trop lourdes pour un affichage sur mobile et doivent être redimensionnées.\n\n")
        if not large_images:
            md.write("*Aucune image > 1024px détectée.*\n\n")
        else:
            md.write("| Fichier | Dimensions | Taille | Réf. |\n")
            md.write("|---------|------------|--------|------|\n")
            for img in large_images:
                ref_str = "Oui" if img['referenced'] else "Non"
                md.write(f"| `{img['path']}` | {img['width']}x{img['height']} | {format_size(img['size'])} | {ref_str} |\n")
            md.write("\n")
            
        # 5. Duplications (MD5 identiques)
        md.write("## 5. Doublons de Fichiers (Même Hash MD5)\n\n")
        md.write("Fichiers identiques présents à plusieurs endroits, à consolider.\n\n")
        dup_count = 0
        for md5, files in duplicates.items():
            disk_files = [f for f in files if f['location'] in ['public', 'src']]
            if len(disk_files) > 1:
                dup_count += 1
                md.write(f"**Groupe {dup_count} (MD5: `{md5}`, Taille: {format_size(files[0]['size'])} chacun)** :\n")
                for f in files:
                    md.write(f"- `{f['path']}` (Emplacement: {f['location']})\n")
                md.write("\n")
        if dup_count == 0:
            md.write("*Aucun doublon exact détecté sur disque.*\n\n")
            
        # 6. Unreferenced files
        md.write("## 6. Fichiers Présents sur Disque mais Non Référencés dans le Code\n\n")
        md.write("Ces fichiers ne semblent pas être directement importés ou référencés dans `src/` ou `index.html`. ")
        md.write("Ils doivent être validés avant suppression.\n\n")
        if not unreferenced:
            md.write("*Tous les fichiers de la base de code sont référencés.*\n\n")
        else:
            md.write("| Fichier | Taille | Type | Statut Suggéré |\n")
            md.write("|---------|--------|------|----------------|\n")
            for f in unreferenced:
                is_backup = 'backup' in f['path'].lower() or 'tmp' in f['path'].lower() or f['path'].endswith('.tmp')
                status = "À supprimer (Fichier temporaire / Backup)" if is_backup else "À valider"
                md.write(f"| `{f['path']}` | {format_size(f['size'])} | {f['type']} | {status} |\n")
            md.write("\n")
            
        # 7. Actions Recommandées
        md.write("## 7. Recommandations d'Optimisation et Gains Estimés\n\n")
        md.write("| Fichier | Taille Actuelle | Action Recommandée | Gain Estimé | Justification |\n")
        md.write("|---------|-----------------|---------------------|-------------|---------------|\n")
        
        # Sort recommendations by savings (descending)
        sorted_recs = sorted(rec_rows, key=lambda x: x['est_saving'], reverse=True)
        for r in sorted_recs[:40]: # Top 40 recommendations
            md.write(f"| `{r['file']}` | {format_size(r['size'])} | {r['action']} | **{format_size(r['est_saving'])}** (~{round(r['est_saving']/r['size']*100)}%) | {r['note']} |\n")
        
        md.write("\n### Résumé du Plan d'Optimisation\n\n")
        md.write("1. **Compression Draco sur les modèles GLB** : Réduit de 60% le poids des bâtiments et objets 3D de la mini-ville.\n")
        md.write("2. **Redimensionnement POT & WebP pour les textures** : Optimise le chargement GPU et mémoire en convertissant en formats compressés modernes.\n")
        md.write("3. **Nettoyage des sauvegardes et fichiers temporaires** : Libère de l'espace inutile dans le bundle de production.\n")
        md.write("4. **Consolidation des doublons** : Référencer une seule copie des fichiers identiques.\n")

    print(f"Report generated successfully at {REPORT_PATH}")

if __name__ == '__main__':
    generate()
