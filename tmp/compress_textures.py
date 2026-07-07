import os
import math
import hashlib
from PIL import Image

PORTFOLIO_DIR = '/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom'
PUBLIC_TEXTURES_DIR = os.path.join(PORTFOLIO_DIR, 'public', 'textures')
SRC_DIR = os.path.join(PORTFOLIO_DIR, 'src')
REPORT_PATH = os.path.join(PORTFOLIO_DIR, 'tmp', '022_report.md')

IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.webp')

def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

def get_nearest_pot(n):
    if n <= 0:
        return 1
    p1 = 2 ** int(math.floor(math.log2(n)))
    p2 = 2 ** int(math.ceil(math.log2(n)))
    return p1 if abs(n - p1) < abs(n - p2) else p2

def format_size(bytes_size):
    if bytes_size == 0:
        return "0 B"
    prefix = ""
    if bytes_size < 0:
        prefix = "-"
        bytes_size = abs(bytes_size)
    sizes = ["B", "KB", "MB", "GB"]
    i = int(math.floor(math.log(bytes_size, 1024)))
    p = math.pow(1024, i)
    s = round(bytes_size / p, 2)
    return f"{prefix}{s} {sizes[i]}"

def main():
    print("Starting W22 texture compression script...")
    
    # 1. Read all source files to find references
    source_files = []
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.js', '.jsx', '.html', '.css', '.scss')):
                source_files.append(os.path.join(root, file))
    
    index_html = os.path.join(PORTFOLIO_DIR, 'index.html')
    if os.path.exists(index_html):
        source_files.append(index_html)
        
    source_contents = {}
    for sf in source_files:
        try:
            with open(sf, 'r', encoding='utf-8', errors='ignore') as f:
                source_contents[sf] = f.read()
        except Exception as e:
            print(f"Error reading source file {sf}: {e}")

    # Helper function to check if file is referenced
    def is_referenced(basename):
        name_no_ext = os.path.splitext(basename)[0]
        if len(name_no_ext) < 3:
            return True
            
        for sf, content in source_contents.items():
            if basename in content or name_no_ext in content:
                return True
        return False

    # 2. Find candidate images in public/textures/
    candidates = []
    for root, dirs, files in os.walk(PUBLIC_TEXTURES_DIR):
        # SKIP backups directories
        if 'backups' in os.path.relpath(root, PUBLIC_TEXTURES_DIR).split(os.sep):
            continue
            
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in IMAGE_EXTS:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, PORTFOLIO_DIR)
                
                # Check reference
                if not is_referenced(file):
                    continue
                    
                size = os.path.getsize(file_path)
                
                try:
                    with Image.open(file_path) as img:
                        width, height = img.size
                except Exception as e:
                    print(f"Error reading image {file_path}: {e}")
                    continue
                
                # Check thresholds: size > 300KB or max side > 1024
                size_kb = size / 1024
                max_side = max(width, height)
                
                if size_kb > 300 or max_side > 1024:
                    candidates.append({
                        'path': file_path,
                        'rel_path': rel_path,
                        'filename': file,
                        'ext': ext,
                        'orig_size': size,
                        'orig_w': width,
                        'orig_h': height
                    })

    print(f"Found {len(candidates)} candidate textures to compress.")
    
    results = []
    total_before = 0
    total_after = 0
    
    for c in candidates:
        file_path = c['path']
        ext = c['ext']
        w, h = c['orig_w'], c['orig_h']
        is_pot = is_power_of_two(w) and is_power_of_two(h)
        
        # Calculate target dimensions
        max_side = max(w, h)
        if max_side > 1024:
            scale = 1024 / max_side
            new_w = int(round(w * scale))
            new_h = int(round(h * scale))
            
            # Keep POT if original was POT
            if is_pot:
                new_w = get_nearest_pot(new_w)
                new_h = get_nearest_pot(new_h)
        else:
            new_w, new_h = w, h
            
        print(f"Compressing {c['rel_path']}: {w}x{h} -> {new_w}x{new_h}...")
        
        try:
            # Load image
            img = Image.open(file_path)
            
            # Resize if dimensions changed
            if (new_w != w) or (new_h != h):
                # Use high-quality Resampling.LANCZOS
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
            # Keep a backup of original size
            orig_size = c['orig_size']
            total_before += orig_size
            
            # Save image in-place
            if ext == '.webp':
                img.save(file_path, 'WEBP', quality=80)
            elif ext in ('.jpg', '.jpeg'):
                img.save(file_path, 'JPEG', quality=80, optimize=True)
            elif ext == '.png':
                # Convert PNG to quantized palette mode to compress
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    quantized = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
                else:
                    quantized = img.quantize(colors=256)
                quantized.save(file_path, 'PNG', optimize=True)
                
            # Get new size
            new_size = os.path.getsize(file_path)
            total_after += new_size
            
            saving = orig_size - new_size
            pct = (saving / orig_size) * 100 if orig_size > 0 else 0
            
            results.append({
                'rel_path': c['rel_path'],
                'orig_size': orig_size,
                'new_size': new_size,
                'orig_dims': f"{w}x{h}",
                'new_dims': f"{new_w}x{new_h}",
                'savings': saving,
                'pct': pct
            })
            print(f"Done: {format_size(orig_size)} -> {format_size(new_size)} (Saved {pct:.1f}%)")
            
        except Exception as e:
            print(f"Error compressing {file_path}: {e}")
            total_before += c['orig_size']
            total_after += c['orig_size'] # assume no change
            results.append({
                'rel_path': c['rel_path'],
                'orig_size': c['orig_size'],
                'new_size': c['orig_size'],
                'orig_dims': f"{w}x{h}",
                'new_dims': f"{w}x{h}",
                'savings': 0,
                'pct': 0
            })
            
    # Write report
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write("# Rapport de Compression des Textures — Tâche 022\n\n")
        f.write("Ce rapport présente les résultats de la compression in-place des textures référencées lourdes (>300 KB ou >1024px).\n\n")
        
        f.write("## Métriques Globales\n\n")
        f.write(f"- **Nombre de textures traitées** : {len(results)}\n")
        f.write(f"- **Taille totale initiale** : {format_size(total_before)}\n")
        f.write(f"- **Taille totale après compression** : {format_size(total_after)}\n")
        
        saved_bytes = total_before - total_after
        saved_pct = (saved_bytes / total_before) * 100 if total_before > 0 else 0
        f.write(f"- **Taille totale économisée** : **{format_size(saved_bytes)}** (Réduction de **{saved_pct:.1f}%**)\n\n")
        
        f.write("## Détails par Fichier\n\n")
        f.write("| Texture | Dimensions Initiales | Dimensions Finales | Taille Initiale | Taille Finale | Gain | Réduction |\n")
        f.write("|---------|----------------------|--------------------|-----------------|---------------|------|-----------|\n")
        
        # Sort results by size reduction (descending)
        sorted_results = sorted(results, key=lambda x: x['savings'], reverse=True)
        for r in sorted_results:
            f.write(f"| `{r['rel_path']}` | {r['orig_dims']} | {r['new_dims']} | {format_size(r['orig_size'])} | {format_size(r['new_size'])} | {format_size(r['savings'])} | {r['pct']:.1f}% |\n")
            
    print(f"Report written to {REPORT_PATH}")
    print(f"Overall savings: {format_size(total_before - total_after)} ({saved_pct:.1f}%)")

if __name__ == '__main__':
    main()
