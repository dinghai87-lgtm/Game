# Lobby thumbnails: assets/games/<slug>/thumb.webp (300x400) from cover.webp, recorded in the manifest as "thumb".
# Lobby tiles show ~150-200 px wide, so the 600x800 cover is 4x the pixels needed.
import json, os
from PIL import Image
A = os.path.join(os.path.dirname(__file__), '..', 'assets') + '/'
man = json.load(open(A + 'manifest.json')); n = 0; before = after = 0
for slug, g in man['games'].items():
    c = A + 'games/' + slug + '/' + g.get('cover', '')
    if not g.get('cover') or not os.path.exists(c): continue
    im = Image.open(c).convert('RGB'); im.thumbnail((300, 400), Image.LANCZOS)
    t = A + 'games/' + slug + '/thumb.webp'; im.save(t, 'WEBP', quality=74, method=6)
    g['thumb'] = 'thumb.webp'; n += 1; before += os.path.getsize(c); after += os.path.getsize(t)
json.dump(man, open(A + 'manifest.json', 'w'), indent=1, ensure_ascii=False)
print('thumbs', n, 'covers %.1f MB -> thumbs %.1f MB' % (before / 1e6, after / 1e6))
