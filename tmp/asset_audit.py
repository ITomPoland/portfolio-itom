import os
import hashlib
import zipfile
import re
import math
from PIL import Image

# Directories to scan
PORTFOLIO_DIR = '/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom'
PUBLIC_DIR = os.path.join(PORTFOLIO_DIR, 'public')
SRC_DIR = os.path.join(PORTFOLIO_DIR, 'src')
DOWNLOAD_ZIP = os.path.join(PORTFOLIO_DIR, 'download')

IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp')
MODEL_EXTS = ('.glb', '.gltf', '.bin', '.obj', '.fbx')
AUDIO_EXTS = ('.mp3', '.wav', '.ogg')
VIDEO_EXTS = ('.mp4', '.webm')
ALL_ASSET_EXTS = IMAGE_EXTS + MODEL_EXTS + AUDIO_EXTS + VIDEO_EXTS

def get_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def get_zip_member_md5(zip_ref, member_name):
    hash_md5 = hashlib.md5()
    with zip_ref.open(member_name) as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

def get_nearest_pot(n):
    if n <= 0:
        return 1
    # Find nearest power of 2
    p1 = 2 ** int(math.floor(math.log2(n)))
    p2 = 2 ** int(math.ceil(math.log2(n)))
    return p1 if abs(n - p1) < abs(n - p2) else p2

def run_audit():
    assets = []
    
    # 1. Read all source files to find references
    source_files = []
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.js', '.jsx', '.html', '.css', '.scss')):
                source_files.append(os.path.join(root, file))
    
    # Also add index.html in portfolio-itom
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

    # Helper function to check if asset is referenced
    def is_referenced(basename):
        # We search for the exact basename or the basename without extension
        name_no_ext = os.path.splitext(basename)[0]
        # Skip checking very short names or common words
        if len(name_no_ext) < 3:
            return True
            
        for sf, content in source_contents.items():
            if basename in content or name_no_ext in content:
                return True
        return False

    # 2. Scan public directory
    for root, dirs, files in os.walk(PUBLIC_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, PORTFOLIO_DIR)
            ext = os.path.splitext(file)[1].lower()
            
            if ext in ALL_ASSET_EXTS:
                size = os.path.getsize(file_path)
                md5 = get_md5(file_path)
                
                asset_type = 'other'
                if ext in IMAGE_EXTS:
                    asset_type = 'image'
                elif ext in MODEL_EXTS:
                    asset_type = 'model'
                elif ext in AUDIO_EXTS:
                    asset_type = 'audio'
                elif ext in VIDEO_EXTS:
                    asset_type = 'video'
                
                width, height = None, None
                pot_status = None
                
                if asset_type == 'image':
                    try:
                        with Image.open(file_path) as img:
                            width, height = img.size
                            w_pot = is_power_of_two(width)
                            h_pot = is_power_of_two(height)
                            if w_pot and h_pot:
                                pot_status = 'POT'
                            else:
                                pot_status = 'NPOT'
                    except Exception as e:
                        print(f"Error reading image dimensions for {file_path}: {e}")
                        pot_status = 'CORRUPTED'
                
                assets.append({
                    'path': rel_path,
                    'location': 'public',
                    'size': size,
                    'md5': md5,
                    'type': asset_type,
                    'ext': ext,
                    'width': width,
                    'height': height,
                    'pot_status': pot_status,
                    'referenced': is_referenced(file)
                })

    # 3. Scan src directory
    for root, dirs, files in os.walk(SRC_DIR):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, PORTFOLIO_DIR)
            ext = os.path.splitext(file)[1].lower()
            
            if ext in ALL_ASSET_EXTS:
                size = os.path.getsize(file_path)
                md5 = get_md5(file_path)
                
                asset_type = 'other'
                if ext in IMAGE_EXTS:
                    asset_type = 'image'
                elif ext in MODEL_EXTS:
                    asset_type = 'model'
                elif ext in AUDIO_EXTS:
                    asset_type = 'audio'
                elif ext in VIDEO_EXTS:
                    asset_type = 'video'
                
                width, height = None, None
                pot_status = None
                
                if asset_type == 'image':
                    try:
                        with Image.open(file_path) as img:
                            width, height = img.size
                            w_pot = is_power_of_two(width)
                            h_pot = is_power_of_two(height)
                            if w_pot and h_pot:
                                pot_status = 'POT'
                            else:
                                pot_status = 'NPOT'
                    except Exception as e:
                        print(f"Error reading image dimensions for {file_path}: {e}")
                        pot_status = 'CORRUPTED'
                
                assets.append({
                    'path': rel_path,
                    'location': 'src',
                    'size': size,
                    'md5': md5,
                    'type': asset_type,
                    'ext': ext,
                    'width': width,
                    'height': height,
                    'pot_status': pot_status,
                    'referenced': is_referenced(file)
                })

    # 4. Scan download zip
    if os.path.exists(DOWNLOAD_ZIP):
        zip_size = os.path.getsize(DOWNLOAD_ZIP)
        zip_md5 = get_md5(DOWNLOAD_ZIP)
        assets.append({
            'path': 'download',
            'location': 'root',
            'size': zip_size,
            'md5': zip_md5,
            'type': 'zip_archive',
            'ext': '.zip',
            'width': None,
            'height': None,
            'pot_status': None,
            'referenced': is_referenced('download')
        })
        
        try:
            with zipfile.ZipFile(DOWNLOAD_ZIP, 'r') as z:
                for member in z.infolist():
                    if member.is_dir():
                        continue
                    name = member.filename
                    ext = os.path.splitext(name)[1].lower()
                    
                    if ext in ALL_ASSET_EXTS:
                        size = member.file_size
                        md5 = get_zip_member_md5(z, name)
                        
                        asset_type = 'other'
                        if ext in IMAGE_EXTS:
                            asset_type = 'image'
                        elif ext in MODEL_EXTS:
                            asset_type = 'model'
                        elif ext in AUDIO_EXTS:
                            asset_type = 'audio'
                        elif ext in VIDEO_EXTS:
                            asset_type = 'video'
                        
                        width, height = None, None
                        pot_status = None
                        
                        if asset_type == 'image':
                            try:
                                with z.open(name) as f_img:
                                    with Image.open(f_img) as img:
                                        width, height = img.size
                                        w_pot = is_power_of_two(width)
                                        h_pot = is_power_of_two(height)
                                        if w_pot and h_pot:
                                            pot_status = 'POT'
                                        else:
                                            pot_status = 'NPOT'
                            except Exception as e:
                                pot_status = 'ERROR'
                        
                        assets.append({
                            'path': f"download:{name}",
                            'location': 'download_zip',
                            'size': size,
                            'md5': md5,
                            'type': asset_type,
                            'ext': ext,
                            'width': width,
                            'height': height,
                            'pot_status': pot_status,
                            'referenced': is_referenced(os.path.basename(name))
                        })
        except Exception as e:
            print(f"Error opening zip file {DOWNLOAD_ZIP}: {e}")

    return assets

if __name__ == '__main__':
    print("Running asset audit script...")
    assets = run_audit()
    print(f"Found {len(assets)} assets total.")
    
    # Save the raw assets data for generation
    import json
    with open('/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom/tmp/assets_raw.json', 'w') as f:
        json.dump(assets, f, indent=2)
    print("Raw assets data saved to tmp/assets_raw.json")
