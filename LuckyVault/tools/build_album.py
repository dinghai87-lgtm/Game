# Collection album: 8 sets x 10 cards rendered from purchased CraftPix icon packs -> assets/album/<set>/<n>.webp + album.json
import os, glob, json
from PIL import Image, ImageDraw, ImageFilter, ImageFont
P = '/tmp/packs/'; O = '/home/claude/slots/assets/album/'
F = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Black.otf', 20)
def pick(d, names): return [d + n for n in names]
SETS = [
 ('gems', 'Gem Vault', '#2b1055', '#7c3aed', pick(P + 'rpg-gems-icons-pack/PNG/', ['1.png', '18.png', '12.png', '58.png', '55.png', '6.png', '27.png', '42.png', '62.png', '88.png'])),
 ('pirate', 'Pirate Cove', '#062a3a', '#0e7490', pick(P + 'pirate-loot-vector-rpg-icons/PNG/without_shadow/', ['1.png', '33.png', '26.png', '29.png', '15.png', '16.png', '25.png', '20.png', '2.png', '3.png'])),
 ('magic', 'Wizard Study', '#1a0b3a', '#6d28d9', pick(P + 'magic-artifact-rpg-icons/PNG/without_shadow/', ['13.png', '22.png', '25.png', '10.png', '27.png', '2.png', '18.png', '42.png', '40.png', '48.png'])),
 ('candy', 'Candy Shop', '#4a0d3a', '#db2777', pick(P + 'candies-crush-match-3-game-assets-pack/PNG/', ['candy1.png', 'candy2.png', 'candy3.png', 'candy4.png', 'candy9.png', 'candy5.png', 'candy8.png', 'candy10.png', 'candy7.png', 'game-booster1.png'])),
 ('treasure', 'Treasure Room', '#2a1606', '#b45309', pick(P + 'chests-and-treasures-2d-game-objects/PNG/full/', ['2.png', '13.png', '5.png', '6.png', '12.png', '10.png', '18.png', '3.png', '16.png', '7.png'])),
 ('jewels', 'Royal Jewels', '#0b2240', '#1d4ed8', pick(P + 'chests-and-treasures-2d-game-objects/PNG/jewelry/', ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png']) + pick(P + 'match-3-game-asset-set/PNG/', ['3.png', '4.png', '2.png', '1.png'])),
 ('coins', 'Coin Collection', '#2a2206', '#ca8a04', sorted(glob.glob(P + 'currency/PNG/without_shadow/*.png'), key=lambda x: int(''.join(c for c in os.path.basename(x) if c.isdigit()) or 0))[:10]),
 ('bags', 'Adventurer Bags', '#1f1206', '#92400e', sorted(glob.glob(P + 'premium-game-icons-of-fantasy-bags-chests-pack-10/Bags_chests/PNG/*.png'))[:10]),
]
STARS = [1, 1, 1, 1, 2, 2, 2, 3, 4, 5]
RC = {1: ((90, 110, 140), (40, 50, 70)), 2: ((60, 170, 90), (20, 70, 40)), 3: ((70, 130, 240), (20, 40, 110)), 4: ((180, 80, 240), (70, 20, 110)), 5: ((255, 190, 40), (140, 70, 0))}
def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def card(src, st, dst):
    W, H = 200, 260; c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c); a, b = RC[st]
    g = Image.new('RGBA', (W, H)); gd = ImageDraw.Draw(g)
    for y in range(H): t = y / H; gd.line([(0, y), (W, y)], fill=tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3)) + (255,))
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).rounded_rectangle((4, 4, W - 5, H - 5), 18, fill=255); c.paste(g, (0, 0), m)
    d.rounded_rectangle((4, 4, W - 5, H - 5), 18, outline=(255, 236, 170) if st >= 4 else (230, 230, 240), width=4)
    gl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(gl).ellipse((30, 30, 170, 170), fill=(255, 255, 255, 70)); c = Image.alpha_composite(c, gl.filter(ImageFilter.GaussianBlur(22)))
    im = Image.open(src).convert('RGBA'); bb = im.getbbox(); im = im.crop(bb) if bb else im; im.thumbnail((150, 150), Image.LANCZOS)
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(im.split()[3].point(lambda v: v * .5)); sh = sh.filter(ImageFilter.GaussianBlur(6))
    c.alpha_composite(sh, ((W - im.size[0]) // 2 + 4, 100 - im.size[1] // 2 + 8)); c.alpha_composite(im, ((W - im.size[0]) // 2, 100 - im.size[1] // 2))
    d = ImageDraw.Draw(c); s = '★' * st
    try: sf = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
    except Exception: sf = F
    w = d.textlength(s, font=sf); d.text(((W - w) / 2 + 1, 207), s, font=sf, fill=(0, 0, 0, 160)); d.text(((W - w) / 2, 205), s, font=sf, fill=(255, 220, 80))
    c.save(dst, 'WEBP', quality=88)
meta = []
for k, name, c1, c2, srcs in SETS:
    os.makedirs(O + k, exist_ok=True); assert len(srcs) == 10, (k, len(srcs))
    for i, s in enumerate(srcs): card(s, STARS[i], O + k + '/%d.webp' % i)
    meta.append({'id': k, 'name': name, 'c1': c1, 'c2': c2, 'stars': STARS})
json.dump({'sets': meta}, open(O + 'album.json', 'w'), indent=1); print('album', len(meta), 'sets')
