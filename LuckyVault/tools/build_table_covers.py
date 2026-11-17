# Lobby covers for table games composed from the casino kit art
import json, re, subprocess, math, random
from PIL import Image, ImageDraw, ImageFilter
A = '/home/claude/slots/assets/'; T = A + 'tables/'; man = json.load(open(A + 'manifest.json'))
tabs = json.loads(subprocess.run(['node', '-e', "const c=require('/home/claude/slots/js/catalog.js');console.log(JSON.stringify(c.TABLE_LIST.map(x=>x[1])))"], capture_output=True, text=True).stdout)
W, H = 600, 800
def base(bg, felt=None, tint=None):
    b = Image.open(T + bg).convert('RGB'); r = max(W / b.size[0], H / b.size[1]); b = b.resize((int(b.size[0] * r) + 1, int(b.size[1] * r) + 1)); x = (b.size[0] - W) // 2; b = b.crop((x, 0, x + W, H)).convert('RGBA')
    if felt:
        f = Image.open(T + felt).convert('RGBA'); f.thumbnail((W * 1.6, H)); b.alpha_composite(f, ((W - f.size[0]) // 2, 330))
    if tint: o = Image.new('RGBA', (W, H), tint + (70,)); b = Image.alpha_composite(b, o)
    halo = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(halo); d.ellipse((80, 120, 520, 560), fill=(255, 220, 140, 90)); halo = halo.filter(ImageFilter.GaussianBlur(60)); return Image.alpha_composite(b, halo)
def put(b, src, cx, cy, h=None, w=None, rot=0, shadow=True):
    im = Image.open(src).convert('RGBA')
    if h: im = im.resize((int(im.size[0] * h / im.size[1]), h), Image.LANCZOS)
    if w: im = im.resize((w, int(im.size[1] * w / im.size[0])), Image.LANCZOS)
    if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    if shadow:
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(im.split()[3].point(lambda v: v * .5)); sh = sh.filter(ImageFilter.GaussianBlur(9)); b.alpha_composite(sh, (int(cx - im.size[0] / 2) + 6, int(cy - im.size[1] / 2) + 12))
    b.alpha_composite(im, (int(cx - im.size[0] / 2), int(cy - im.size[1] / 2)))
def fin(b, slug):
    vg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(vg)
    for i in range(200): d.rectangle((0, H - 260 + i, W, H - 259 + i), fill=(0, 0, 0, int(i * 1.15)))
    b = Image.alpha_composite(b, vg); import os; os.makedirs(A + 'games/' + slug, exist_ok=True); b.convert('RGB').save(A + 'games/' + slug + '/cover.webp', 'WEBP', quality=86)
    man['games'].setdefault(slug, {})['cover'] = 'cover.webp'
C = lambda c: T + 'cards/' + c + '.webp'; CH = lambda v: T + 'chips/%d.webp' % v
random.seed(3)
for i, t in enumerate(tabs):
    name, tk = t[0], t[1]; slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    if tk == 'blackjack':
        b = base(['bg_purple.webp', 'bg_navy.webp', 'bg_pk_violet.webp', 'bg_pk_red.webp'][i % 4], 'felt_bj.webp')
        put(b, C('As'), 230, 330, 260, rot=12); put(b, C(['Kh', 'Qd', 'Jc', 'Th'][i % 4]), 370, 320, 260, rot=-10)
        put(b, CH(100), 150, 520, 120); put(b, CH(25), 450, 530, 110); put(b, CH(500), 300, 560, 120)
    elif tk == 'roulette':
        b = base('bg_rl.webp', None, [(120, 0, 0), (0, 40, 120), (90, 60, 0)][i % 3])
        put(b, T + 'rl_bowl.webp', 300, 330, 420); put(b, T + 'rl_ring.webp', 300, 330, 328, shadow=False); put(b, CH(100), 470, 560, 110); put(b, CH(5), 130, 560, 100)
    elif tk in ('mdt', 'msicbo', 'mroul'):   # other shared tables: the base game's look + a crowd of chips
        b = base({'mdt': 'bg_pk_red.webp', 'msicbo': 'bg_dice.webp', 'mroul': 'bg_rl.webp'}[tk], {'mdt': 'felt_pk_red.webp', 'msicbo': 'felt_pk_blue.webp'}.get(tk))
        if tk == 'mdt': put(b, C('Kd'), 205, 340, 260, rot=8); put(b, C('7c'), 395, 340, 260, rot=-8)
        elif tk == 'mroul': put(b, T + 'rl_bowl.webp', 300, 300, 380); put(b, T + 'rl_ring.webp', 300, 300, 297, shadow=False)
        else:
            d = ImageDraw.Draw(b); PP = {1: [(0, 0)], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)], 5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)], 6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)]}
            for (cx, cy, n) in [(190, 330, 6), (300, 290, 4), (410, 330, 5)]:
                d.rounded_rectangle((cx - 62, cy - 62, cx + 62, cy + 62), 22, fill=(250, 248, 242), outline=(170, 170, 170), width=3)
                for (px, py) in PP[n]: x, y = cx + px * 32, cy + py * 32; d.ellipse((x - 11, y - 11, x + 11, y + 11), fill=(200, 20, 30) if n in (1, 4) else (20, 20, 20))
        for k, (v, x, y) in enumerate([(500, 140, 560), (100, 230, 590), (25, 320, 565), (5, 410, 595), (10, 470, 555)]): put(b, CH(v), x, y, 100)
    elif tk == 'mbacc':   # shared multiplayer baccarat: cards + a pile of different players' chips
        b = base(['bg_pk_red.webp', 'bg_navy.webp'][i % 2], 'felt_pk_red.webp')
        put(b, C(['9h', '8s'][i % 2]), 200, 330, 250, rot=10); put(b, C(['Kc', 'Qd'][i % 2]), 400, 330, 250, rot=-10)
        for k, (v, x, y) in enumerate([(500, 140, 540), (100, 230, 570), (25, 320, 545), (1000, 410, 575), (5, 470, 535)]): put(b, CH(v) if v != 1000 else CH(500), x, y, 105)
    elif tk in ('baccarat', 'dragontiger'):
        b = base(['bg_pk_red.webp', 'bg_pk_violet.webp', 'bg_pk_green.webp', 'bg_pk_red.webp'][i % 4], 'felt_pk_red.webp')
        put(b, C(['9h', '8d', '9s', 'Kd'][i % 4]), 205, 380, 280, rot=8); put(b, C(['Qs', 'Ac', '7d', 'Kc'][i % 4]), 395, 380, 280, rot=-8)
    elif tk == 'videopoker':
        b = base('bg_navy.webp', None, [(0, 0, 80), (60, 0, 90), (0, 70, 70), (80, 0, 40), (40, 0, 90), (80, 60, 0)][i % 6])
        hand = [['As', 'Ks', 'Qs', 'Js', 'Ts'], ['2d', '2h', '2s', '2c', 'Ah'], ['Ah', 'Ad', 'Ac', 'As', 'Kd'], ['Ac', 'Ad', 'Ah', 'As', '3c'], ['Kh', 'Kd', 'Ks', 'Kc', '9s'], ['Jh', 'Jd', 'Qs', 'Qc', 'Kh']][i % 6]
        for k, c in enumerate(hand): put(b, C(c), 120 + k * 90, 360 + abs(k - 2) * 18, 200, rot=(2 - k) * 7)
    elif tk in ('tcp', 'holdem', 'caribbean', 'war', 'reddog', 'uth', 'letitride', 'mstud', 'fourcard', 'hcf', 'paigow'):
        b = base('bg_pk_violet.webp', 'felt_pk_green.webp')
        hand = {'tcp': ['Ah', 'Kh', 'Qh'], 'holdem': ['As', 'Ad'], 'caribbean': ['Ks', 'Kd', '5c'], 'war': ['Kc', 'Kh'], 'reddog': ['4d', 'Js'], 'uth': ['Ah', 'Kh'], 'paigow': ['As', 'Ad', 'Kh', 'Kc'], 'letitride': ['Th', 'Tc', '9s'], 'mstud': ['Qs', 'Qd'], 'fourcard': ['Ac', 'Ad', 'As', '8h'], 'hcf': ['Ah', 'Jh', '8h', '4h']}[tk]
        for k, c in enumerate(hand): put(b, C(c), 300 + (k - (len(hand) - 1) / 2) * 120, 390, 240, rot=((len(hand) - 1) / 2 - k) * 8)
    elif tk == 'paigowtiles':
        b = base('bg_pk_red.webp', 'felt_pk_red.webp')
        PIP = {1: [(50, 50)], 2: [(30, 28), (70, 72)], 3: [(25, 25), (50, 50), (75, 75)], 4: [(28, 28), (72, 28), (28, 72), (72, 72)], 5: [(26, 26), (74, 26), (50, 50), (26, 74), (74, 74)], 6: [(28, 22), (72, 22), (28, 50), (72, 50), (28, 78), (72, 78)]}
        for k, (a, c) in enumerate([(6, 6), (1, 1), (4, 5), (2, 4)]):
            tw, th = 110, 220; t = Image.new('RGBA', (tw, th), (0, 0, 0, 0)); d = ImageDraw.Draw(t); d.rounded_rectangle((2, 2, tw - 3, th - 3), 16, fill=(18, 18, 18), outline=(120, 120, 120), width=3); d.line((14, th // 2, tw - 14, th // 2), fill=(90, 90, 90), width=3)
            for hi, n in enumerate((min(a, c), max(a, c))):
                for (x, y) in PIP[n]:
                    cx, cy = 10 + x * 0.9, hi * th / 2 + 10 + y * 0.9; r = 12 if n == 1 else 9; d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(225, 29, 72) if n in (1, 4) else (255, 255, 255))
            t = t.rotate((1.5 - k) * 9, expand=True, resample=Image.BICUBIC); sh = Image.new('RGBA', t.size, (0, 0, 0, 0)); sh.putalpha(t.split()[3].point(lambda v: v * .5)); sh = sh.filter(ImageFilter.GaussianBlur(8))
            x0 = int(300 + (k - 1.5) * 118 - t.size[0] / 2); y0 = int(380 - t.size[1] / 2 + abs(k - 1.5) * 14); b.alpha_composite(sh, (x0 + 6, y0 + 12)); b.alpha_composite(t, (x0, y0))
    elif tk == 'crash':
        b = base('bg_rays.webp', None, (70, 0, 130)); d = ImageDraw.Draw(b)
        pts = [(70 + i * 4.3, 700 - (math.exp(0.032 * i) - 1) * 16) for i in range(105)]
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(glow).line(pts, fill=(255, 214, 10, 255), width=26); b.alpha_composite(glow.filter(ImageFilter.GaussianBlur(14)))
        d = ImageDraw.Draw(b); d.line(pts, fill=(255, 230, 120), width=12)
        x, y = pts[-1]; R = Image.new('RGBA', (220, 220), (0, 0, 0, 0)); r = ImageDraw.Draw(R)
        r.polygon([(110, 10), (150, 70), (150, 160), (70, 160), (70, 70)], fill=(235, 235, 245)); r.ellipse((88, 70, 132, 114), fill=(80, 170, 255), outline=(40, 60, 120), width=5)
        r.polygon([(70, 120), (35, 175), (70, 160)], fill=(230, 40, 70)); r.polygon([(150, 120), (185, 175), (150, 160)], fill=(230, 40, 70)); r.polygon([(80, 160), (110, 215), (140, 160)], fill=(255, 150, 20))
        R = R.rotate(-38, expand=True, resample=Image.BICUBIC); b.alpha_composite(R, (int(x - R.size[0] / 2), int(y - R.size[1] / 2)))
        from PIL import ImageFont
        F = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf', 110); d = ImageDraw.Draw(b); t = '25.00x'; w = d.textlength(t, font=F); d.text((W / 2 - w / 2 + 4, 134), t, font=F, fill=(0, 0, 0, 160)); d.text((W / 2 - w / 2, 130), t, font=F, fill=(255, 255, 255))
    elif tk in ('sicbo', 'craps'):
        b = base('bg_dice.webp', 'felt_pk_blue.webp'); put(b, CH(1000), 210, 420, 170); put(b, CH(100), 390, 430, 150); put(b, CH(25), 300, 520, 140)
    elif tk == 'wheel':
        b = base('bg_rays.webp'); put(b, T + 'fw_ring.webp', 300, 340, 440, rot=180); put(b, T + 'coins.webp', 300, 340, 240)
    elif tk == 'keno':
        from PIL import ImageFont
        F = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf', 54)
        b = base('bg_navy.webp', None, [(0, 40, 120), (90, 0, 90)][i % 2]); d = ImageDraw.Draw(b)
        cols = [(230, 40, 60), (40, 120, 230), (250, 190, 30), (40, 180, 90), (160, 60, 220)]
        for k, (x, y, n) in enumerate([(170, 250, 7), (300, 210, 23), (430, 260, 42), (220, 390, 15), (380, 400, 61), (300, 520, 80)]):
            c = cols[(k + i) % 5]; sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((x - 62, y - 50, x + 74, y + 86), fill=(0, 0, 0, 120)); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
            d = ImageDraw.Draw(b); d.ellipse((x - 68, y - 68, x + 68, y + 68), fill=c); d.ellipse((x - 40, y - 40, x + 40, y + 40), fill=(255, 255, 255))
            d.ellipse((x - 50, y - 60, x - 14, y - 34), fill=(255, 255, 255, 140)); t = str(n); w = d.textlength(t, font=F); d.text((x - w / 2 - 3, y - 32), t, font=F, fill=(20, 20, 40))
        put(b, T + 'coins.webp', 300, 640, 150)
    elif tk == 'scratch':
        from PIL import ImageFont
        F = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf', 46)
        b = base('bg_rays.webp', None, [(0, 110, 40), (140, 100, 0), (0, 90, 140)][i % 3]); d = ImageDraw.Draw(b)
        cx0, cy0, cw, chh = 110, 170, 380, 440
        sh = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((cx0 + 10, cy0 + 16, cx0 + cw + 10, cy0 + chh + 16), 28, fill=(0, 0, 0, 150)); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
        d = ImageDraw.Draw(b); d.rounded_rectangle((cx0, cy0, cx0 + cw, cy0 + chh), 28, fill=[(255, 214, 10), (40, 200, 110), (90, 200, 255)][i % 3], outline=(255, 255, 255), width=6)
        for r in range(3):
            for c in range(3):
                x, y = cx0 + 30 + c * 112, cy0 + 40 + r * 128; scratched = (r * 3 + c) in (0, 4, 5)
                d.rounded_rectangle((x, y, x + 96, y + 108), 18, fill=(255, 250, 235) if scratched else (176, 182, 196))
                if scratched: put(b, T + 'coins.webp', x + 48, y + 54, 76, shadow=False); d = ImageDraw.Draw(b)
                else:
                    for z in range(6): d.line((x + 10 + z * 16, y + 8, x + z * 16 - 6, y + 100), fill=(200, 205, 215), width=3)
        put(b, T + 'stars_l.webp', 120, 640, 120); put(b, T + 'stars_r.webp', 480, 640, 120)
    else: continue
    fin(b, slug)
json.dump(man, open(A + 'manifest.json', 'w'), indent=1, ensure_ascii=False); print('table covers done')
