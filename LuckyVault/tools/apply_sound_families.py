# Writes each game's sound family (tools/sound_families.json) into assets/manifest.json
import json, re
A = '/home/claude/slots/assets/manifest.json'; m = json.load(open(A)); F = json.load(open('/home/claude/slots/tools/sound_families.json'))
for f, names in F.items():
    for nm in names: m['games'].setdefault(re.sub(r'[^a-z0-9]+', '-', nm.lower()).strip('-'), {})['snd'] = f
m.setdefault('audio', {})['music'] = 'assets/audio/casino/music.mp3'
json.dump(m, open(A, 'w'), indent=1, ensure_ascii=False); print('sound families applied')
# lobby music = the casino family track
import shutil, os
_a = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'audio')
if os.path.exists(os.path.join(_a, 'casino', 'music.mp3')): shutil.copy(os.path.join(_a, 'casino', 'music.mp3'), os.path.join(_a, 'music.mp3'))
