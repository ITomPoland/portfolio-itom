import json
import os

RAW_JSON_PATH = '/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom/tmp/assets_raw.json'

with open(RAW_JSON_PATH, 'r') as f:
    assets = json.load(f)

candidates = []
for a in assets:
    if a['location'] == 'public' and a['path'].startswith('public/textures/'):
        if 'backups' in a['path']:
            continue
        if a['type'] == 'image':
            # Check size > 300KB or dimensions > 1024px
            size_kb = a['size'] / 1024
            large = a['width'] and (a['width'] > 1024 or a['height'] > 1024)
            heavy = size_kb > 300
            if (large or heavy) and a['referenced']:
                candidates.append(a)

print(f"Found {len(candidates)} candidate images for compression:")
for c in candidates:
    print(f"- {c['path']}: {c['width']}x{c['height']}, {c['size']/1024:.1f} KB, Referenced={c['referenced']}")
