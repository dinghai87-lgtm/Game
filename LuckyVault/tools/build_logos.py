# Generates title logos (gradient fill, stroke, 3D extrusion, glow) for skinned games that don't ship a kit logo
import json, os, sys, re
sys.path.insert(0, '/home/claude/slots/js')
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
A = '/home/claude/slots/assets/'; man = json.load(open(A + 'manifest.json'))
F = '/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf'
import subprocess
cat = json.loads(subprocess.run(['node', '-e', "const c=require('/home/claude/slots/js/catalog.js');console.log(JSON.stringify(c.SLOT_LIST.map(([i,t])=>[t[0],t[2],t[3]])))"], capture_output=True, text=True).stdout)
def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def mixc(a, b, t): return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))
def logo(name, c2, dst):
    words = name.upper().split(); lines = [name.upper()] if len(name) <= 13 else [' '.join(words[:len(words) // 2 + (len(words) % 2)]), ' '.join(words[len(words) // 2 + (len(words) % 2):])]
    W, H = 1100, 260 if len(lines) == 1 else 400; size = 150 if len(lines) == 1 else 140
    font = ImageFont.truetype(F, size)
    while max(font.getbbox(l)[2] for l in lines) > W - 80: size -= 6; font = ImageFont.truetype(F, size)
    mask = Image.new('L', (W, H), 0); d = ImageDraw.Draw(mask); y = 30
    for l in lines:
        w = font.getbbox(l)[2]; d.text(((W - w) // 2, y), l, font=font, fill=255); y += int(size * 1.05)
    bb = mask.getbbox(); 
    stroke = mask.filter(ImageFilter.MaxFilter(15)); outer = stroke.filter(ImageFilter.MaxFilter(9))
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glowc = mixc(c2, (255, 220, 120), .35)
    g = Image.new('RGBA', (W, H), glowc + (0,)); g.putalpha(outer.filter(ImageFilter.GaussianBlur(18)).point(lambda v: int(v * .8))); out = Image.alpha_composite(out, g)
    for k in range(10, 0, -1):  # extrusion
        sh = Image.new('RGBA', (W, H), mixc(c2, (0, 0, 0), .75) + (0,)); sh.putalpha(stroke); out.alpha_composite(sh, (0, k))
    st = Image.new('RGBA', (W, H), (25, 12, 4, 255)); st.putalpha(stroke); out = Image.alpha_composite(out, st)
    rim = Image.new('RGBA', (W, H), (255, 236, 170, 255)); rim.putalpha(mask.filter(ImageFilter.MaxFilter(5))); out = Image.alpha_composite(out, rim)
    grad = Image.new('RGBA', (W, H)); gd = ImageDraw.Draw(grad); top, bot = bb[1], bb[3]
    for yy in range(H):
        t = min(1, max(0, (yy - top) / max(1, bot - top)))
        col = mixc((255, 255, 240), (255, 214, 90), t / .5) if t < .5 else mixc((255, 190, 40), mixc(c2, (255, 120, 0), .5), (t - .5) / .5)
        gd.line([(0, yy), (W, yy)], fill=col + (255,))
    grad.putalpha(mask); out = Image.alpha_composite(out, grad)
    hl = Image.new('RGBA', (W, H), (255, 255, 255, 0)); hd = ImageDraw.Draw(hl)
    for yy in range(top, top + (bot - top) * 2 // 5): hd.line([(0, yy), (W, yy)], fill=(255, 255, 255, int(90 * (1 - (yy - top) / max(1, (bot - top) * 2 / 5)))))
    hl.putalpha(ImageChops.multiply(hl.split()[3], mask)); out = Image.alpha_composite(out, hl)
    out = out.crop(out.getbbox()); out.thumbnail((900, 200)); out.save(dst, 'WEBP', quality=90)
n = 0
for name, c1, c2 in cat:
    s = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'); e = man['games'].get(s)
    if not e or 'logo' in e and not e.get('autologo'): continue
    logo(name, hx(c2), A + 'games/' + s + '/logo.webp'); e['logo'] = 'logo.webp'; e['autologo'] = True; n += 1
json.dump(man, open(A + 'manifest.json', 'w'), indent=1, ensure_ascii=False); print('logos', n)
# covers for background-only skins (scene + logo)
for s in [k for k, e in man['games'].items() if 'bg' in e and not any(x.startswith('sym_') for x in e)]:
    d = A + 'games/' + s + '/'; b = Image.open(d + 'bg.webp').convert('RGB'); W, H = 600, 800; r = max(W / b.size[0], H / b.size[1]); b = b.resize((int(b.size[0] * r) + 1, int(b.size[1] * r) + 1)); x = (b.size[0] - W) // 2; b = b.crop((x, 0, x + W, H)).convert('RGBA')
    lg = Image.open(d + 'logo.webp').convert('RGBA'); lg.thumbnail((540, 260)); b.alpha_composite(lg, ((W - lg.size[0]) // 2, int(H * .3) - lg.size[1] // 2))
    b.convert('RGB').save(d + 'cover.webp', 'WEBP', quality=86); man['games'][s]['cover'] = 'cover.webp'
json.dump(man, open(A + 'manifest.json', 'w'), indent=1, ensure_ascii=False)
