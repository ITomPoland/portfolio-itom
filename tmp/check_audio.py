import os
import subprocess
import json

SOUNDS_DIR = '/run/media/Aristide/Nouveau nom/3D/inspiration/portfolio-itom/public/sounds'

for file in sorted(os.listdir(SOUNDS_DIR)):
    if file.endswith(('.mp3', '.ogg')):
        path = os.path.join(SOUNDS_DIR, file)
        # Run ffprobe to get channels, sample_rate, bitrate
        cmd = [
            'ffprobe', '-v', 'error', 
            '-select_streams', 'a:0', 
            '-show_entries', 'stream=channels,sample_rate,bit_rate', 
            '-of', 'json', 
            path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        data = json.loads(res.stdout)
        stream = data.get('streams', [{}])[0]
        
        channels = stream.get('channels', 'unknown')
        sample_rate = stream.get('sample_rate', 'unknown')
        bit_rate = stream.get('bit_rate', 'unknown')
        if bit_rate != 'unknown':
            bit_rate = f"{int(bit_rate)/1000:.1f} kbps"
            
        size = os.path.getsize(path)
        size_str = f"{size/1024:.1f} KB"
        
        print(f"{file}: Channels={channels}, SampleRate={sample_rate}, BitRate={bit_rate}, Size={size_str}")
