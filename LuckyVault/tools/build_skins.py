# Builds game skins from purchased CraftPix kits into assets/games/<slug>/ (webp) and updates assets/manifest.json
import json, os, sys
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
OUT = '/home/claude/slots/assets'
man = json.load(open(OUT + '/manifest.json'))
def slug(n): import re; return re.sub(r'[^a-z0-9]+', '-', n.lower()).strip('-')
def R(src):
    import glob
    if os.path.exists(src): return src
    m = sorted(glob.glob(src[:-4] + '*.png')); return m[0] if m else src
def sym(src, dst, size=256):
    src = R(src)
    im = Image.open(src).convert('RGBA'); bb = im.getbbox(); im = im.crop(bb)
    w, h = im.size; s = size * 0.9 / max(w, h); im = im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0)); c.paste(im, ((size - im.size[0]) // 2, (size - im.size[1]) // 2), im); c.save(dst, 'WEBP', quality=90)
def bg(src, dst, w=1600):
    im = Image.open(src).convert('RGB'); im.thumbnail((w, w)); im.save(dst, 'WEBP', quality=82)
def reel(src, dst):
    im = Image.open(src).convert('RGB'); im = im.resize((200, 700), Image.LANCZOS); im.save(dst, 'WEBP', quality=85)
def cover(bgsrc, syms, dst, glow=(255, 200, 80)):
    W, H = 600, 800; b = Image.open(bgsrc).convert('RGB'); r = max(W / b.size[0], H / b.size[1]); b = b.resize((int(b.size[0] * r) + 1, int(b.size[1] * r) + 1)); b = b.crop((0, 0, W, H)).convert('RGBA')
    halo = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(halo); d.ellipse((60, 90, 540, 570), fill=glow + (150,)); halo = halo.filter(ImageFilter.GaussianBlur(70)); b = Image.alpha_composite(b, halo)
    rays = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(rays)
    import math
    for i in range(18):
        a0 = i / 18 * 2 * math.pi; a1 = a0 + math.pi / 18
        d.polygon([(300, 330), (300 + 900 * math.cos(a0), 330 + 900 * math.sin(a0)), (300 + 900 * math.cos(a1), 330 + 900 * math.sin(a1))], fill=(255, 255, 255, 22))
    b = Image.alpha_composite(b, rays)
    def put(src, cx, cy, size, rot=0):
        im = Image.open(R(src)).convert('RGBA'); im = im.crop(im.getbbox()); s = size / max(im.size); im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.LANCZOS)
        if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(im.split()[3].point(lambda v: v * 0.55)); sh = sh.filter(ImageFilter.GaussianBlur(10))
        b.alpha_composite(sh, (int(cx - im.size[0] / 2) + 6, int(cy - im.size[1] / 2) + 14)); b.alpha_composite(im, (int(cx - im.size[0] / 2), int(cy - im.size[1] / 2)))
    main, side = syms[0], syms[1:]
    if len(side) > 0: put(side[0], 120, 470, 170, 14)
    if len(side) > 1: put(side[1], 480, 460, 170, -12)
    if len(side) > 2: put(side[2], 300, 560, 150, 0)
    put(main, 300, 300, 340)
    vg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(vg)
    for i in range(160): d.rectangle((0, H - 220 + i, W, H - 220 + i + 1), fill=(0, 0, 0, int(i * 1.4)))
    b = Image.alpha_composite(b, vg); b.convert('RGB').save(dst, 'WEBP', quality=86)
def build(name, kit, mapping, bgfile, reelfile=None, cover_syms=None, glow=(255, 200, 80), skin='light'):
    s = slug(name); d = OUT + '/games/' + s; os.makedirs(d, exist_ok=True); e = {}
    for k, src in mapping.items(): sym(kit + src, d + '/' + k + '.webp'); e['sym_' + k] = k + '.webp'
    bg(kit + bgfile, d + '/bg.webp'); e['bg'] = 'bg.webp'
    if reelfile: reel(kit + reelfile, d + '/reel.webp'); e['reel'] = 'reel.webp'
    cover(kit + bgfile, [kit + x for x in (cover_syms or list(mapping.values())[:4])], d + '/cover.webp', glow); e['cover'] = 'cover.webp'
    e['skin'] = skin; man['games'][s] = e; print('built', s, len(e))
SM = '/tmp/kits/slotmachine/PNG/'
I = lambda n: 'Items/item%d.png' % n
build('Lucky 777', SM, {'h1': I(2), 'h2': I(13), 'h3': I(12), 'h4': I(3), 'l1': I(8), 'l2': I(11), 'l3': I(9), 'l4': I(6), 'l5': I(7), 'W': I(5), 'S': I(4)}, 'interface_game/bg_1.png', 'interface_game/table.png', [I(2), I(8), I(13), I(4)], (255, 120, 200))
build('Triple Sevens', SM, {'h1': I(2), 'h2': I(13), 'h3': I(12), 'h4': I(1), 'l1': I(9), 'l2': I(6), 'l3': I(8), 'W': I(5)}, 'interface_game/bg_2.png', 'interface_game/table.png', [I(2), I(13), I(8), I(5)], (120, 170, 255))
build('Fruit Burst', SM, {'h1': I(8), 'h2': I(11), 'h3': I(7), 'h4': I(15), 'l1': I(6), 'l2': I(9), 'l3': I(1), 'l4': I(10), 'l5': I(14), 'S': I(4)}, 'interface_game/bg_3.png', None, [I(11), I(8), I(6), I(15)], (140, 255, 140), 'drop')


G = '/mnt/user-data/uploads/claude导出/craftpix-891176-golden-slots-2d-game-kit/Upd_HD1920x1080/Game files/'
S = lambda n: 'Symbols/Symbol%d.png' % n
# page background from the purple bokeh tile, reel strip cropped from the kit's brown reel column
os.makedirs(OUT + '/games/golden-slots', exist_ok=True)
build('Golden Slots', G, {'h1': S(11), 'h2': S(10), 'h3': S(9), 'h4': S(8), 'l1': S(6), 'l2': S(5), 'l3': S(4), 'l4': S(3), 'l5': S(2), 'W': S(13), 'S': S(12)}, 'Backs/Back.jpg', None, [S(11), S(10), S(9), S(13)], (255, 160, 230))
d = OUT + '/games/golden-slots'
t = Image.open(G + 'Frames/Frames back.png').convert('RGB').crop((20, 20, 233, 233)).resize((1600, 900), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3)); t.save(d + '/bg.webp', 'WEBP', quality=80)
b = Image.open(G + 'Backs/Back.jpg').convert('RGB'); col = b.crop((312, 152, 552, 900)).resize((200, 700)); col.save(d + '/reel.webp', 'WEBP', quality=85)
l = Image.open(G + 'Logo/logo.png').convert('RGBA'); l.thumbnail((900, 160)); l.save(d + '/logo.webp', 'WEBP', quality=90)
cover(d + '/bg.webp', [G + S(11), G + S(10), G + S(9), G + S(13)], d + '/cover.webp', (255, 160, 230))
man['games']['golden-slots'].update({'reel': 'reel.webp', 'logo': 'logo.webp', 'nolabel': True, 'frame': 'gold'})

C = '/mnt/user-data/uploads/claude导出/craftpix-781165-classic-sevens-slots-2d-game-kit/Game files/'
Y = lambda n: 'Symbols/' + n + '.png'
build('Vegas Nights', C, {'h1': Y('9_seven'), 'h2': Y('8_bar'), 'h3': Y('7_watermelon'), 'h4': Y('6_grapes'), 'l1': Y('3_plum'), 'l2': Y('1_orange'), 'l3': Y('2_lemon'), 'l4': Y('5_cherry'), 'l5': Y('4_banana'), 'W': Y('11_bell'), 'S': Y('10_strawberry')}, 'Backs/main_back.jpg', None, [Y('9_seven'), Y('5_cherry'), Y('6_grapes'), Y('11_bell')], (255, 90, 160))
man['games']['vegas-nights']['nolabel'] = True
build('Blazing Fruits', C, {'h1': Y('9_seven'), 'h2': Y('7_watermelon'), 'h3': Y('6_grapes'), 'h4': Y('8_bar'), 'l1': Y('1_orange'), 'l2': Y('2_lemon'), 'l3': Y('5_cherry'), 'W': Y('11_bell')}, 'Backs/free_games_back.jpg', None, [Y('9_seven'), Y('7_watermelon'), Y('5_cherry'), Y('11_bell')], (255, 140, 60))
man['games']['blazing-fruits']['nolabel'] = True

Z = '/mnt/user-data/uploads/claude导出/craftpix-891167-zombieland-slots-2d-game-kit/Game files/'
ZS = lambda n: 'Symbols/Symbol ' + n + '.png'
build('Zombieland', Z, {'h1': ZS('10 - Girl zombie'), 'h2': ZS('9 - Blue zombie'), 'h3': ZS('8 - Green zombie'), 'h4': ZS('7 - Skull'), 'l1': ZS('6 - Brain'), 'l2': ZS('5 - Eye'), 'l3': ZS('4 - A'), 'l4': ZS('3 - K'), 'l5': ZS('2 - Q'), 'W': ZS('11 - Wild - Ghost'), 'S': ZS('12 - Free spins')}, 'Bonus/bonus_back.jpg', None, [ZS('10 - Girl zombie'), ZS('8 - Green zombie'), ZS('9 - Blue zombie'), ZS('11 - Wild - Ghost')], (170, 255, 90))
d = OUT + '/games/zombieland'
b = Image.open(Z + 'Backs/Back.jpg').convert('RGB'); b.crop((1000, 500, 1600, 2830)).resize((200, 700), Image.LANCZOS).save(d + '/reel.webp', 'WEBP', quality=85)
l = Image.open(Z + 'Backs/logo.png').convert('RGBA'); l.thumbnail((900, 160)); l.save(d + '/logo.webp', 'WEBP', quality=90)
man['games']['zombieland'].update({'reel': 'reel.webp', 'logo': 'logo.webp', 'nolabel': True})
man['games'].pop('ghost-manor', None)

# ---- icon-pack skins (procedural backgrounds + purchased CraftPix icons) ----
import random, math
def procbg(dst, c1, c2, seed=1, motif=None):
    random.seed(seed); W, H = 1600, 900
    b = Image.new('RGB', (W, H), c1); d = ImageDraw.Draw(b)
    for r in range(900, 0, -6):
        t = r / 900; col = tuple(int(c2[i] * (1 - t) + c1[i] * t) for i in range(3)); d.ellipse((W / 2 - r * 1.3, H * 0.45 - r, W / 2 + r * 1.3, H * 0.45 + r), fill=col)
    b = b.convert('RGBA'); bok = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(bok)
    for i in range(70):
        x, y, r = random.randint(0, W), random.randint(0, H), random.randint(6, 60); a = random.randint(18, 60)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, a))
    bok = bok.filter(ImageFilter.GaussianBlur(8)); b = Image.alpha_composite(b, bok)
    if motif:
        for i, (src, x, y, sz, rot) in enumerate(motif):
            im = Image.open(R(src)).convert('RGBA'); im = im.crop(im.getbbox()); k = sz / max(im.size); im = im.resize((int(im.size[0] * k), int(im.size[1] * k)), Image.LANCZOS).rotate(rot, expand=True)
            im.putalpha(im.split()[3].point(lambda v: v * 0.35)); im = im.filter(ImageFilter.GaussianBlur(3)); b.alpha_composite(im, (int(x * W - im.size[0] / 2), int(y * H - im.size[1] / 2)))
    vg = Image.new('L', (W, H), 0); d = ImageDraw.Draw(vg); d.ellipse((-300, -250, W + 300, H + 250), fill=255); vg = vg.filter(ImageFilter.GaussianBlur(160))
    dark = Image.new('RGBA', (W, H), (0, 0, 0, 255)); b = Image.composite(b, dark, vg)
    b.convert('RGB').save(dst, 'WEBP', quality=80)
def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def realbg(src, dst, bright=0.78, flip=False):
    im = Image.open(src).convert('RGB'); r = max(1600 / im.size[0], 900 / im.size[1]); im = im.resize((int(im.size[0] * r) + 1, int(im.size[1] * r) + 1), Image.LANCZOS)
    x = (im.size[0] - 1600) // 2; y = (im.size[1] - 900) // 2; im = im.crop((x, y, x + 1600, y + 900))
    if flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    ImageEnhance.Brightness(im).enhance(bright).save(dst, 'WEBP', quality=80)
def pack(name, kit, mapping, c1, c2, glow, seed, skin='light', extra=None, cover_syms=None, bgimg=None, bright=0.78, flip=False):
    s = slug(name); d = OUT + '/games/' + s; os.makedirs(d, exist_ok=True); e = {}
    for k, src in mapping.items(): sym(kit + src, d + '/' + k + '.webp'); e['sym_' + k] = k + '.webp'
    vals = list(mapping.values()); mot = [(kit + vals[i % len(vals)], *pos) for i, pos in enumerate([(0.07, 0.2, 260, 15), (0.93, 0.25, 240, -12), (0.1, 0.8, 220, -8), (0.9, 0.82, 260, 10)])]
    if bgimg: realbg(bgimg, d + '/bg.webp', bright, flip)
    else: procbg(d + '/bg.webp', hx(c1), hx(c2), seed, mot)
    e['bg'] = 'bg.webp'
    cover(d + '/bg.webp', [kit + x for x in (cover_syms or vals[:4])], d + '/cover.webp', glow); e['cover'] = 'cover.webp'
    e['skin'] = skin
    if extra: e.update(extra)
    man['games'][s] = e; print('built', s, len(e))
P = '/tmp/packs/'
WI = P + 'free-winter-holiday-game-backgrounds/PNG/BG_%02d/BG_%02d.png'; wi = lambda i: WI % (i, i)
CH = P + 'cartoon-halloween-game-backgrounds/PNG/BG_%02d/BG_%02d.png'; chb = lambda i: CH % (i, i)
CA = P + 'candies-crush-match-3-game-assets-pack/PNG/'; cd = lambda n: 'candy%d.png' % n
pack('Candy Carnival', CA, {'h1': cd(7), 'h2': cd(8), 'h3': cd(10), 'h4': cd(5), 'l1': cd(1), 'l2': cd(2), 'l3': cd(3), 'l4': cd(4), 'l5': cd(11), 'W': 'game-booster1.png', 'S': 'whell-full.png'}, '#4a0d3a', '#ff6fb5', (255, 140, 220), 11)
pack('Jelly Kingdom', CA, {'h1': cd(11), 'h2': cd(4), 'h3': cd(9), 'h4': cd(6), 'l1': cd(2), 'l2': cd(3), 'l3': cd(1), 'l4': cd(10), 'l5': cd(8), 'W': 'game-booster1.png', 'S': 'whell-full.png'}, '#20104a', '#9b6bff', (200, 150, 255), 12)
pack('Cosmic Candy', CA, {'h1': cd(7), 'h2': cd(9), 'h3': cd(5), 'h4': cd(6), 'l1': cd(1), 'l2': cd(2), 'l3': cd(3), 'l4': cd(10), 'l5': cd(11), 'W': 'game-booster1.png', 'S': 'whell-full.png'}, '#0b0b30', '#3d3dbf', (140, 160, 255), 13)
GE = P + 'rpg-gems-icons-pack/PNG/'; g = lambda n: '%s.png' % n
pack('Star Gems', GE, {'h1': g(27), 'h2': g(29), 'h3': g(56), 'h4': g(6), 'l1': g(1), 'l2': g(55), 'l3': g(58), 'l4': g(60), 'l5': g(54), 'W': g(42), 'S': g(41)}, '#140a2e', '#6a3cff', (180, 140, 255), 21)
pack('Gem Mine', GE, {'h1': g(20), 'h2': g(3), 'h3': g(64), 'h4': g(74), 'l1': g(9), 'l2': g(18), 'l3': g(12), 'l4': g(59), 'l5': g(78), 'W': g(42), 'S': g(41)}, '#0a1a24', '#1f7a8c', (120, 230, 255), 22)
pack('Giant Gems', GE, {'h1': g(88), 'h2': g(93), 'h3': g(90), 'h4': g(73), 'l1': g(36), 'l2': g(52), 'l3': g(76), 'l4': g(84), 'l5': g(81), 'W': g(92), 'S': g(41)}, '#1a0820', '#b0307a', (255, 120, 200), 23)
pack('Star Burst', GE, {'h1': g(42), 'h2': g(5), 'h3': g(77), 'h4': g(11), 'l1': g(10), 'l2': g(19), 'l3': g(26), 'l4': g(76), 'l5': g(61), 'W': g(92), 'S': g(41)}, '#06142e', '#2563eb', (120, 180, 255), 24)
pack('Diamond Strike', GE, {'h1': g(62), 'h2': g(56), 'h3': g(57), 'h4': g(59), 'l1': g(1), 'l2': g(80), 'l3': g(65), 'W': g(42), 'S': g(41)}, '#101018', '#4b5563', (220, 230, 255), 25)
PI = P + 'pirate-loot-vector-rpg-icons/PNG/without_shadow/'; JW = P + 'chests-and-treasures-2d-game-objects/PNG/'
pack('Pirate Plunder', PI, {'h1': '3.png', 'h2': '20.png', 'h3': '16.png', 'h4': '26.png', 'l1': '1.png', 'l2': '15.png', 'l3': '33.png', 'l4': '29.png', 'l5': '7.png', 'W': '2.png', 'S': '34.png'}, '#06202a', '#0e7490', (90, 220, 255), 31)
pack('Pirate Gold Link', PI, {'h1': '3.png', 'h2': '19.png', 'h3': '17.png', 'h4': '26.png', 'l1': '21.png', 'l2': '22.png', 'l3': '28.png', 'l4': '12.png', 'l5': '6.png', 'W': '2.png', 'S': '34.png'}, '#1c1206', '#a16207', (255, 200, 90), 32)
pack('Treasure Island Pick', PI, {'h1': '20.png', 'h2': '2.png', 'h3': '25.png', 'h4': '44.png', 'l1': '36.png', 'l2': '40.png', 'l3': '41.png', 'l4': '35.png', 'l5': '5.png', 'W': '3.png', 'S': '34.png'}, '#062a1c', '#15803d', (120, 255, 170), 33)
MA = P + 'magic-artifact-rpg-icons/PNG/without_shadow/'
pack('Potion Lab', MA, {'h1': '42.png', 'h2': '1.png', 'h3': '16.png', 'h4': '18.png', 'l1': '13.png', 'l2': '17.png', 'l3': '10.png', 'l4': '6.png', 'l5': '27.png', 'W': '48.png', 'S': '2.png'}, '#12062a', '#7e22ce', (210, 140, 255), 41)
pack('Wizard Tower', MA, {'h1': '33.png', 'h2': '1.png', 'h3': '34.png', 'h4': '40.png', 'l1': '20.png', 'l2': '22.png', 'l3': '24.png', 'l4': '21.png', 'l5': '8.png', 'W': '48.png', 'S': '6.png'}, '#060f2a', '#1d4ed8', (120, 170, 255), 42)
pack('Mystic Runes', MA, {'h1': '27.png', 'h2': '39.png', 'h3': '29.png', 'h4': '3.png', 'l1': '12.png', 'l2': '23.png', 'l3': '11.png', 'l4': '7.png', 'l5': '9.png', 'W': '48.png', 'S': '2.png'}, '#0a1f1a', '#0f766e', (120, 255, 220), 43)
pack('Wandering Wizard', MA, {'h1': '46.png', 'h2': '30.png', 'h3': '38.png', 'h4': '41.png', 'l1': '14.png', 'l2': '19.png', 'l3': '15.png', 'l4': '25.png', 'l5': '28.png', 'W': '48.png', 'S': '5.png'}, '#1f0a12', '#be123c', (255, 130, 160), 44)
pack('Dragon Hoard', JW, {'h1': 'full/3.png', 'h2': 'gold/1.png' if os.path.exists(JW + 'gold/1.png') else 'full/4.png', 'h3': 'jewelry/2.png', 'h4': 'full/16.png', 'l1': 'jewelry/1.png', 'l2': 'jewelry/14.png', 'l3': 'jewelry/12.png', 'l4': 'jewelry/15.png', 'l5': 'jewelry/10.png', 'W': 'full/17.png', 'S': 'full/7.png'}, '#2a0a06', '#c2410c', (255, 150, 80), 51)
pack('Gold Rush', JW, {'h1': 'full/18.png', 'h2': 'full/3.png', 'h3': 'full/6.png', 'h4': 'full/16.png', 'l1': 'jewelry/10.png', 'l2': 'jewelry/7.png', 'l3': 'jewelry/9.png', 'l4': 'jewelry/8.png', 'l5': 'jewelry/6.png', 'W': 'full/13.png', 'S': 'full/7.png'}, '#1f1505', '#b45309', (255, 210, 100), 52)
M3 = P + 'match-3-game-asset-set/PNG/'
pack('Gold Mine Cash', M3, {'h1': 'chest gold.png', 'h2': 'key gold.png', 'h3': 'doubling.png', 'h4': 'clock.png', 'l1': '1.png', 'l2': '3.png', 'l3': '4.png', 'l4': '5.png', 'l5': '7.png', 'W': 'magnet.png', 'S': 'chest silver.png'}, '#1a1206', '#92400e', (255, 200, 80), 53)
WB = P + 'western-2d-game-backgrounds/_PNG/'
for nm, k in (('Wild Frontier', '2'), ('Wild Rodeo', '3'), ('Thunder Bison', '4')):
    s_ = slug(nm); d_ = OUT + '/games/' + s_; os.makedirs(d_, exist_ok=True)
    im = ImageEnhance.Brightness(Image.open(WB + k + '/background.png').convert('RGB')).enhance(0.72); im.resize((1600, 900), Image.LANCZOS).save(d_ + '/bg.webp', 'WEBP', quality=80)
    man['games'][s_] = {'bg': 'bg.webp', 'skin': 'light'}; print('bg', s_)

# ---- v5.1 theme packs: real backgrounds + themed icon sets ----
def M(*a): return dict(zip(['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 'W', 'S'], a))
n = lambda *xs: ['%s.png' % x for x in xs]
HB = P + 'free-halloween-2d-game-backgrounds/PNG/%d_game_background/%d_game_background.png'; hb = lambda i: HB % (i, i)
HI = P + 'free-halloween-game-icons/PNG/'
pack('Pumpkin Night', HI, M(*n(18, 16, 15, 37, 7, 9, 10, 20, 19, 48, 47)), '#1a0d05', '#c2410c', (255, 150, 60), 61, bgimg=hb(4))
pack('Monster Party', HI, M(*n(38, 39, 29, 30, 25, 26, 28, 11, 12, 40, 47)), '#0d1a05', '#4d7c0f', (160, 255, 90), 62, bgimg=chb(1))
pack('Vampire Castle', HI, M(*n(40, 36, 28, 34, 33, 45, 24, 43, 44, 48, 32)), '#1a0510', '#9f1239', (255, 90, 120), 63, bgimg=hb(2))
pack('Moon Wolf', HI, M(*n(32, 34, 31, 33, 35, 28, 25, 45, 41, 36, 47)), '#05101a', '#1e40af', (130, 170, 255), 64, bgimg=hb(3))
pack('Wolf Moon Mystery', HI, M(*n(32, 31, 36, 35, 34, 26, 27, 42, 46, 48, 47)), '#0a051a', '#5b21b6', (180, 130, 255), 65, bgimg=hb(3), flip=True)
pack('Wolf Moon Link', HI, M(*n(32, 36, 33, 31, 13, 14, 17, 22, 23, 48, 47)), '#14051a', '#7e22ce', (210, 140, 255), 66, bgimg=chb(2))
DR = P + 'free-rpg-dragon-loot-icons/PNG/without background/'
FT = P + 'free-fairy-tale-game-backgrounds/_PNG/%d/background.png'; FC = P + 'free-fantasy-cartoon-game-backgrounds/png/%d.png'
EG = P + 'horizontal-egypt-battle-backgrounds/PNG/game_background_%d/game_background_%d.png'; eg = lambda i: EG % (i, i)
pack('Golden Dragon', DR, M(*n(2, 10, 37, 30, 23, 27, 29, 39, 33, 9, 46)), '#1a0a05', '#b91c1c', (255, 140, 60), 71, bgimg=eg(3), bright=0.7)
pack('Dragon Fortune Link', DR, M(*n(1, 9, 36, 32, 43, 25, 28, 34, 35, 10, 46)), '#1a0505', '#dc2626', (255, 110, 80), 72, bgimg=FT % 3, bright=0.7)
pack('Dragon Multiplier', DR, M(*n(3, 4, 37, 31, 24, 26, 27, 38, 40, 9, 46)), '#10051a', '#7c3aed', (190, 120, 255), 73, bgimg=FT % 2, bright=0.7)
VI = P + 'rpg-viking-loot-game-icons-512x512/PNG/without background/'
pack('Viking Raid', VI, M(*n(24, 7, 43, 8, 5, 16, 18, 49, 9, 25, 45)), '#0a141f', '#0369a1', (120, 200, 255), 81, bgimg=FC % 3, bright=0.72)
pack('Viking Gold Link', VI, M(*n(20, 6, 22, 10, 19, 3, 32, 33, 47, 24, 45)), '#1a1205', '#a16207', (255, 200, 90), 82, bgimg=FC % 3, bright=0.66, flip=True)
pack('Thor’s Hammer', VI, M(*n(19, 8, 6, 43, 5, 16, 9, 36, 49, 24, 45)), '#05101f', '#1d4ed8', (120, 170, 255), 83, bgimg=FT % 3, bright=0.72)
JE = P + '50-rpg-jewelry-icons/PNG/without background/'
pack('Pharaoh Gold', JE, M(*n(33, 18, 21, 34, 1, 2, 3, 12, 6, 17, 22)), '#1f1405', '#b45309', (255, 200, 90), 91, bgimg=eg(4), bright=0.72)
pack('Nile Queen', JE, M(*n(30, 41, 44, 23, 9, 7, 5, 14, 11, 17, 22)), '#05141a', '#0e7490', (110, 230, 255), 92, bgimg=eg(1), bright=0.75)
pack('Egypt Riches Link', JE, M(*n(21, 33, 32, 34, 15, 16, 4, 8, 13, 17, 22)), '#1a1005', '#a16207', (255, 210, 100), 93, bgimg=eg(2), bright=0.72)
pack('Sun God Ra', JE, M(*n(33, 9, 2, 18, 1, 11, 12, 14, 15, 26, 22)), '#1f0c05', '#c2410c', (255, 160, 70), 94, bgimg=eg(1), bright=0.75, flip=True)
pack('Pharaoh’s Tomb Pick', JE, M(*n(28, 33, 19, 25, 3, 6, 10, 16, 36, 17, 22)), '#140a05', '#78350f', (255, 180, 90), 95, bgimg=eg(3), bright=0.72, flip=True)
pack('Aztec Sun', JE, M(*n(31, 21, 20, 42, 12, 13, 30, 22, 36, 26, 33)), '#05140a', '#15803d', (120, 255, 150), 96, bgimg=eg(2), bright=0.7, flip=True)
pack('Aztec Treasure Link', JE, M(*n(20, 31, 42, 30, 12, 13, 23, 27, 22, 26, 33)), '#05140a', '#047857', (110, 255, 190), 97, bgimg=eg(4), bright=0.68, flip=True)
pack('Mayan Mystery', JE, M(*n(27, 42, 31, 47, 26, 30, 20, 13, 12, 26, 33)), '#0a1405', '#4d7c0f', (180, 255, 100), 98, bgimg=FT % 1, bright=0.72)
UW = '/tmp/uw/'
OC = P + 'ocean-2d-game-backgrounds/PNG/game_background_%d/game_background_%d.png'; oc = lambda i: OC % (i, i)
uw = lambda *xs: [x + '.png' for x in xs]

import glob as _g, re as _re
def _num(f): m = _re.findall(r'(\d+)\.png$', f); return int(m[-1]) if m else 0
def F0(pattern): fs = sorted(_g.glob(pattern), key=_num); return fs[0]
UK = P + 'underwater-world-game-kit/Fish, crab, jellyfish, shark/PNG/'; MK = P + 'underwater-world-game-kit/Mermaid/PNG/'
cr = lambda d, a: F0(UK + d + '/' + a + '_*.png'); mm = lambda i: F0(MK + 'Mermaid_%d/Idle_*.png' % i)
U = lambda x: UW + x + '.png'; J = lambda x: JE + '%d.png' % x; F_ = lambda x: P + 'rpg-fruit-icons/PNG/without background/%d.png' % x
pack('Ocean Treasure', '', M(mm(1), cr('Shark_1', 'Shark_move_1'), cr('Fish_1', 'Fish_move_1'), cr('Jellyfish_1', 'Jellyfish_move_1'), U('Bonus_Acceleration'), U('Bonus_Coin'), U('Let_Steering-wheel'), U('Let_Barrel_1'), U('Bonus_Shield'), U('Bonus_Heart'), U('Neutral_chest_closed')), '#05141f', '#0369a1', (110, 220, 255), 101, bgimg=oc(1), bright=0.85)
pack('Ocean Pearl Link', '', M(mm(2), cr('Jellyfish_2', 'Jellyfish_move_2'), cr('Fish_2', 'Fish_move_2'), cr('Crab_2', 'Crab_idle_2'), J(44), J(50), U('Bonus_Acceleration'), U('Neutral_Bubble_3'), U('Bonus_Coin'), U('Bonus_Heart'), U('Neutral_chest_closed')), '#05101f', '#1d4ed8', (120, 190, 255), 102, bgimg=oc(4), bright=0.85)
pack('Ocean Wilds', '', M(mm(3), cr('Fish_3', 'Fish_move_3'), cr('Fish_4', 'Fish_move_4'), cr('Jellyfish_3', 'Jellyfish_move_3'), U('Neutral_Bubble_1'), U('Neutral_Bubble_2'), U('Let_Barrel_2'), U('Bonus_Shield'), U('Bonus_Coin'), U('Bonus_Crown'), U('Neutral_chest_open')), '#05181a', '#0f766e', (110, 255, 230), 103, bgimg=oc(2), bright=0.85)
pack('Shark Hunter', '', M(cr('Shark_2', 'Shark_move_2'), cr('Shark_1', 'Shark_move_1'), cr('Fish_4', 'Fish_move_4'), cr('Sea urchin', 'Sea urchin_idle'), U('Let_Barrel_1'), U('Let_Barrel_2'), U('Bonus_Shield'), U('Bonus_Magnet'), U('Bonus_Coin'), U('Bonus_Crown'), U('Neutral_chest_closed')), '#05101a', '#155e75', (110, 210, 255), 104, bgimg=oc(3), bright=0.8)
pack('Big Catch Bonanza', '', M(cr('Fish_2', 'Fish_move_2'), cr('Fish_1', 'Fish_move_1'), cr('Crab_1', 'Crab_move_1'), cr('Fish_3', 'Fish_move_3'), U('Bonus_Coin'), U('Let_Barrel_1'), U('Bonus_Shield'), U('Bonus_Heart'), U('Let_Steering-wheel'), U('Bonus_Crown'), U('Neutral_chest_closed')), '#05141f', '#0284c7', (120, 220, 255), 105, bgimg=oc(3), bright=0.85, flip=True)
JB = P + 'jungle-2d-game-backgrounds/_PNG/0%d/jungle0%d_preview-01.png'; jb = lambda i: JB % (i, i)
FR = P + 'rpg-fruit-icons/PNG/without background/'
pack('Jungle Reels', FR, M(*n(5, 16, 21, 11, 3, 13, 20, 31, 12, 50, 49)), '#05140a', '#15803d', (140, 255, 140), 111, bgimg=jb(1), bright=0.8)
pack('Monkey Business', FR, M(*n(3, 5, 22, 20, 9, 13, 8, 6, 1, 50, 49)), '#0a1405', '#65a30d', (200, 255, 110), 112, bgimg=jb(2), bright=0.8)
pack('Jungle King', FR, M(*n(16, 11, 26, 14, 32, 33, 40, 21, 44, 50, 49)), '#05140a', '#166534', (120, 255, 160), 113, bgimg=jb(3), bright=0.8)
pack('Electric Jungle', FR, M(*n(48, 47, 16, 36, 49, 42, 41, 35, 30, 50, 4)), '#05101a', '#0e7490', (110, 255, 230), 114, bgimg=jb(4), bright=0.7)
pack('Wild Cherry Deluxe', FR, M(*n(14, 1, 20, 15, 6, 8, 3, 7, 10, 50, 5)), '#1a0505', '#b91c1c', (255, 120, 110), 115, bgimg=FC % 1, bright=0.8)
AN = P + 'animals-match-3-asset-pack/PNG/'
pack('Happy Farm', AN, M('animal1.png', 'animal2.png', 'animal3.png', 'animal4.png', 'animal5.png', 'animal6.png', 'animal7.png', 'animal8.png', 'animal9.png', 'coin-icon.png', 'wheel-full.png'), '#0a1a05', '#4d7c0f', (190, 255, 120), 121, bgimg=FC % 2, bright=0.85)
SW = P + 'sweets-2d-game-items/PNG/'
SB = P + 'sweet-2d-game-backgrounds/_PNG/%d/%d_game_background.png'; sb = lambda i: SB % (i, i)
pack('Sweet Bakery', SW, M(*n(13, 19, 7, 16, 1, 2, 3, 10, 21, 5, 36)), '#2a0a1a', '#db2777', (255, 150, 200), 131, bgimg=sb(1), bright=0.85)
pack('Donut Party', SW, M(*n(5, 18, 25, 20, 4, 6, 9, 12, 38, 19, 13)), '#1f0a2a', '#a21caf', (240, 140, 255), 132, bgimg=sb(3), bright=0.85)
pack('Holiday Gifts', SW, M(*n(3, 22, 13, 11, 8, 32, 34, 37, 23, 5, 36)), '#05101f', '#0369a1', (150, 220, 255), 133, bgimg=wi(1), bright=0.8)
pack('Carnival Spin', SW, M(*n(11, 39, 24, 9, 12, 33, 35, 26, 17, 5, 13)), '#2a0a10', '#e11d48', (255, 140, 160), 134, bgimg=sb(4), bright=0.85)
pack('Frozen Kingdom', '', M(DR + '31.png', DR + '33.png', J(39), J(24), J(10), J(44), J(50), J(35), J(37), DR + '37.png', DR + '45.png'), '#05101f', '#1e3a8a', (160, 210, 255), 141, bgimg=wi(2), bright=0.8)
pack('Ice Queen', '', M(DR + '33.png', J(39), DR + '35.png', J(24), J(10), J(14), J(44), J(37), J(50), DR + '31.png', DR + '45.png'), '#0a0f2a', '#4338ca', (170, 170, 255), 142, bgimg=FT % 3, bright=0.8)
pack('Frozen Peaks', '', M(DR + '31.png', J(39), VI + '24.png', VI + '43.png', J(10), J(35), VI + '36.png', VI + '27.png', J(44), DR + '33.png', DR + '45.png'), '#05141f', '#075985', (140, 220, 255), 143, bgimg=wi(3), bright=0.8)
pack('Bamboo Panda', '', M(J(30), J(42), J(12), J(20), J(23), J(13), F_(9), F_(13), F_(24), J(27), DR + '48.png'), '#05140a', '#15803d', (130, 255, 150), 151, bgimg=FT % 1, bright=0.78, flip=True)
pack('Lucky Mystery', JE, M(*n(25, 17, 18, 47, 5, 41, 45, 49, 14, 27, 28)), '#14051a', '#86198f', (240, 140, 255), 152, bgimg=FT % 2, bright=0.75)
pack('Lucky Clover', '', M(J(42), J(30), J(12), J(13), J(20), J(23), J(27), F_(13), F_(9), DR + '48.png', DR + '43.png'), '#05140a', '#16a34a', (130, 255, 140), 153, bgimg=FC % 4, bright=0.82)
pack('Storm Chaser', VI, M(*n(19, 43, 22, 6, 8, 9, 32, 33, 34, 24, 45)), '#0a0a1f', '#3730a3', (150, 150, 255), 154, bgimg=FT % 3, bright=0.6, flip=True)
pack('Titans Colossal', DR, M(*n(2, 1, 30, 37, 42, 41, 29, 27, 25, 9, 46)), '#140a05', '#92400e', (255, 180, 80), 155, bgimg=FC % 4, bright=0.7, flip=True)

Ysv = lambda *k: M(*[Y(x) for x in k])
pack('Hot Chilli 7s', C, Ysv('9_seven', '8_bar', '5_cherry', '7_watermelon', '1_orange', '2_lemon', '3_plum', '4_banana', '6_grapes', '11_bell', '10_strawberry'), '#2a0505', '#dc2626', (255, 100, 60), 161)
pack('Gold Bar 7s', C, Ysv('8_bar', '9_seven', '11_bell', '6_grapes', '1_orange', '2_lemon', '5_cherry', '3_plum', '4_banana', '10_strawberry', '7_watermelon'), '#1f1505', '#ca8a04', (255, 210, 90), 162)
pack('Lucky Clover 7s', C, Ysv('9_seven', '6_grapes', '7_watermelon', '8_bar', '2_lemon', '4_banana', '1_orange', '5_cherry', '3_plum', '11_bell', '10_strawberry'), '#05200a', '#16a34a', (120, 255, 140), 163)
pack('Neon Retro 7s', C, Ysv('9_seven', '5_cherry', '8_bar', '11_bell', '3_plum', '1_orange', '2_lemon', '4_banana', '6_grapes', '10_strawberry', '7_watermelon'), '#14052a', '#c026d3', (255, 110, 255), 164)
pack('Royal Crown Classic', C, Ysv('11_bell', '9_seven', '8_bar', '7_watermelon', '6_grapes', '5_cherry', '1_orange', '2_lemon', '3_plum', '10_strawberry', '4_banana'), '#0a0a2a', '#4338ca', (160, 160, 255), 165)
pack('Liberty Bells', C, Ysv('11_bell', '8_bar', '9_seven', '5_cherry', '1_orange', '2_lemon', '3_plum', '4_banana', '6_grapes', '10_strawberry', '7_watermelon'), '#05102a', '#1d4ed8', (120, 170, 255), 166)
pack('Panda Fortune', '', M(J(30), J(23), J(42), J(12), J(13), J(20), F_(9), F_(24), F_(13), J(27), DR + '48.png'), '#05140a', '#15803d', (130, 255, 150), 167, bgimg=FT % 1, bright=0.75)
pack('Lucky Panda Link', '', M(J(42), J(30), DR + '48.png', J(23), J(13), J(12), J(20), F_(24), F_(9), J(27), DR + '43.png'), '#05140a', '#047857', (110, 255, 190), 168, bgimg=FT % 1, bright=0.7, flip=True)
pack('Fortune God', '', M(DR + '43.png', DR + '23.png', DR + '30.png', DR + '46.png', J(2), J(21), J(9), J(18), J(34), DR + '37.png', DR + '45.png'), '#2a0505', '#b91c1c', (255, 120, 90), 169, bgimg=eg(4), bright=0.6, flip=True)
pack('Aztec Expanding', JE, M(*n(21, 31, 42, 33, 12, 20, 13, 22, 15, 26, 30)), '#05140a', '#15803d', (130, 255, 150), 170, bgimg=eg(1), bright=0.7)
pack('Zeus Lightning', '', M(DR + '30.png', DR + '42.png', VI + '8.png', DR + '37.png', J(24), J(39), J(14), VI + '9.png', J(10), DR + '32.png', DR + '45.png'), '#05082a', '#4338ca', (150, 160, 255), 171, bgimg=FT % 3, bright=0.6)
WBk = P + 'western-2d-game-backgrounds/_PNG/%s/background.png'
pack('Buffalo Stampede', VI, M(*n(5, 36, 42, 24, 49, 14, 2, 33, 34, 25, 45)), '#1f1005', '#9a3412', (255, 160, 80), 172, bgimg=WBk % '1', bright=0.72)
pack('Buffalo Wild Reels', VI, M(*n(36, 5, 14, 42, 18, 33, 34, 16, 49, 25, 45)), '#1a0a05', '#b45309', (255, 180, 90), 173, bgimg=WBk % '2', bright=0.72, flip=True)
pack('Buffalo Thunder Link', VI, M(*n(5, 42, 36, 24, 49, 3, 22, 32, 14, 25, 45)), '#100a1f', '#6d28d9', (190, 140, 255), 174, bgimg=WBk % '4', bright=0.6, flip=True)

# ---- v5.3: space kit (animated alien ships), extra backgrounds ----
SK = P + 'space-adventures-2d-game-kit/PNG/'
ch = lambda i: F0(SK + 'Enemy/Char%02d/Idle/*.png' % i); ic = lambda n: SK + 'Icon/' + n + '.png'
def spacebg(i):
    import os as _o
    b = SK + 'Backgrounds/%02d/' % i; L = sorted(_g.glob(b + 'Layer*.png')); im = Image.open(L[0]).convert('RGBA')
    if _o.path.exists(b + 'Repeated.png'): base = Image.open(b + 'Repeated.png').convert('RGBA').resize(im.size); base.alpha_composite(im); im = base
    for l in L[1:]: im.alpha_composite(Image.open(l).convert('RGBA').resize(im.size))
    out = '/tmp/space_bg_%02d.png' % i; w = im.size[1] * 16 // 9; im.crop((0, 0, w, im.size[1])).convert('RGB').save(out); return out
SL = lambda: [ic('Rocket1'), ic('Rocket2'), ic('Rocket3'), ic('Rocket4'), ic('Rocket5')]
pack('Alien Invasion', '', M(ch(10), ch(3), ch(6), ch(7), *SL(), ic('Shield'), ic('Energy')), '#0a0520', '#5b21b6', (190, 140, 255), 181, bgimg=spacebg(2), bright=0.9)
pack('Space Odyssey', '', M(ch(5), ch(4), ch(8), ch(2), *SL(), ic('Shield'), ic('Energy')), '#05051a', '#312e81', (140, 150, 255), 182, bgimg=spacebg(2), bright=0.85, flip=True)
pack('Cosmic Choice', '', M(ch(9), ch(1), ch(6), ch(3), *SL(), ic('Shield'), ic('Energy')), '#05140f', '#0f766e', (110, 255, 210), 183, bgimg=spacebg(4), bright=0.75)
pack('Robot Factory', '', M(ch(3), ch(9), ch(10), ch(7), *SL(), ic('Shield'), ic('Energy')), '#1a1005', '#b45309', (255, 190, 100), 184, bgimg=spacebg(3), bright=0.7)
pack('Robot Walkers', '', M(ch(1), ch(5), ch(2), ch(8), *SL(), ic('Shield'), ic('Energy')), '#1a0f05', '#92400e', (255, 170, 90), 185, bgimg=spacebg(3), bright=0.66, flip=True)
DS = P + 'cartoon-desert-game-backgrounds/PNG/BG_%02d/BG_%02d.png'; ds = lambda i: DS % (i, i)
SKY = P + 'cartoon-sky-game-backgrounds/PNG/BG_%02d/BG_%02d.png'; sky = lambda i: SKY % (i, i)
WI = P + 'free-winter-holiday-game-backgrounds/PNG/BG_%02d/BG_%02d.png'; wi = lambda i: WI % (i, i)
CH = P + 'cartoon-halloween-game-backgrounds/PNG/BG_%02d/BG_%02d.png'; chb = lambda i: CH % (i, i)
pack('Thunder Temple', JE, M(*n(39, 24, 33, 14, 10, 35, 37, 44, 50, 26, 22)), '#05102a', '#1d4ed8', (140, 190, 255), 186, bgimg=sky(2), bright=0.75)
pack('Fiesta Loca', FR, M(*n(36, 26, 11, 16, 3, 5, 13, 21, 20, 50, 49)), '#2a1005', '#ea580c', (255, 170, 80), 187, bgimg=ds(1), bright=0.8)

PU = '/mnt/user-data/uploads/claude导出/pinup/Game files/'
pu = lambda n: F0(PU + 'Symbols/%s/*.png' % n)
pack('Pin-Up Glam', '', M(pu('10_girl'), pu('11_girl'), pu('12_girl'), pu('13_girl'), pu('15_phone'), pu('16_lipstick'), pu('17_glasses'), pu('20_cocktail'), pu('22_ring'), pu('24_wild'), pu('21_microphone')), '#2a0510', '#be123c', (255, 120, 150), 188, bgimg=PU + 'Backs/back_main_1920x1080.jpg', bright=0.85)

# ---- v5.6: games restored from packs already on hand ----
pack('Fortune Wheel Deluxe', C, Ysv('9_seven', '11_bell', '8_bar', '5_cherry', '7_watermelon', '6_grapes', '1_orange', '2_lemon', '3_plum', '10_strawberry', '4_banana'), '#2a0a05', '#d97706', (255, 190, 80), 189, bgimg='/home/claude/slots/assets/tables/bg_rays.webp', bright=0.9)
pack('Neon Nights', GE, {'h1': g(27), 'h2': g(56), 'h3': g(29), 'h4': g(6), 'l1': g(55), 'l2': g(58), 'l3': g(60), 'l4': g(54), 'l5': g(1), 'W': g(42), 'S': g(41)}, '#0a0520', '#c026d3', (255, 90, 230), 190, bgimg=spacebg(2), bright=0.75, flip=True)
pack('Koi Pond', '', M(cr('Fish_2', 'Fish_move_2'), cr('Fish_1', 'Fish_move_1'), cr('Fish_3', 'Fish_move_3'), cr('Fish_4', 'Fish_move_4'), J(43), J(29), J(44), J(50), U('Bonus_Pearl'), U('Bonus_Crown'), U('Neutral_chest_closed')), '#05140f', '#0f766e', (120, 255, 220), 191, bgimg=FT % 1, bright=0.8, flip=True)
FW = '/mnt/user-data/uploads/claude导出/craftpix-112900-fortune-wheels-game-kit/PNG/interface_game/'
_r = Image.open(FW + 'wheel_2.png').convert('RGBA'); _s = Image.open(FW + 'wheel_3.png').convert('RGBA'); _c = Image.new('RGBA', _r.size, (0, 0, 0, 0)); _z = _s.resize((int(_r.size[0] * .86), int(_r.size[1] * .86)), Image.LANCZOS); _c.alpha_composite(_z, ((_r.size[0] - _z.size[0]) // 2, (_r.size[1] - _z.size[1]) // 2)); _c.alpha_composite(_r); _c.save('/tmp/wheelsym.png')
pack('Vegas Wheel 7s', '', {'h1': C + Y('9_seven'), 'h2': C + Y('8_bar'), 'h3': C + Y('6_grapes'), 'h4': C + Y('7_watermelon'), 'l1': C + Y('5_cherry'), 'l2': C + Y('2_lemon'), 'l3': C + Y('1_orange'), 'W': C + Y('11_bell'), 'S': '/tmp/wheelsym.png'}, '#2a0518', '#e11d48', (255, 90, 140), 181, bgimg=FW + 'bg_2.png', bright=0.7)
pack('Triple Fortune Wilds', '', {'h1': C + Y('9_seven'), 'h2': C + Y('8_bar'), 'h3': C + Y('7_watermelon'), 'h4': C + Y('6_grapes'), 'l1': C + Y('5_cherry'), 'l2': C + Y('3_plum'), 'l3': C + Y('1_orange'), 'W': C + Y('11_bell')}, '#05202a', '#0ea5e9', (110, 220, 255), 182, bgimg=FW + 'bg_3.png', bright=0.7)
for _g in ('vegas-wheel-7s', 'triple-fortune-wilds'): man['games'][_g]['nolabel'] = True
man.setdefault('audio', {})['music'] = 'assets/audio/music.mp3'
json.dump(man, open(OUT + '/manifest.json', 'w'), indent=1, ensure_ascii=False)

# ---- 2026-11-18: Big Catch Bonanza gets its own CraftPix "RPG sea theme 512x512 icons" set (was sharing Koi Pond's fish) ----
# S = '<extracted rpg-sea-theme-game-512x512-icons>/PNG/without background/'
# mp = {'h1':'35','h2':'47','h3':'33','h4':'18','l1':'20','l2':'19','l3':'21','l4':'28','l5':'15','W':'45','S':'44'}  (shark, octopus, pearl, fish, starfish, shell, wheel, hook, bottle, lighthouse=W, map=S)
# ---- 2026-11-18: Pirate Gold Link gets its own set from the same sea pack (was sharing Pirate Plunder's loot icons) ----
# mp = {'h1':'43','h2':'31','h3':'32','h4':'13','l1':'11','l2':'10','l3':'3','l4':'6','l5':'1','W':'36','S':'44'}  (galleon, jolly roger, cannon, hat, compass, coins, spyglass, rum, bomb, cutlass=W, map=S)
# ---- 2026-11-18 (2): own symbol sets from CraftPix 512px painted icon packs ----
# blazing-fruits  <- fruits-berries-vegetables-icon-512x512-set: h1 12 watermelon, h2 45 pineapple, h3 10 grapes, h4 19 dragonfruit, l1 30 cherries, l2 18 lemon, l3 21 orange, l4 38 strawberry, l5 27 banana (W/S kept)
# aztec-expanding <- rpg-stone-age-game-512x512-icons: h1 38 stone calendar, h2 25 skull, h3 50 tooth necklace, h4 48 tusks, l1 19 spear, l2 20 knife, l3 14 egg, l4 16 axe, l5 18 boomerang, W 4 torch, S 46 fire
# lucky-clover    <- rpg-fairy-loot-icons: h1 32 ladybugs, h2 34 flower ring, h3 38 fairy jar, h4 14 toadstool, l1 12 leaf, l2 41 flower, l3 35 emerald ring, l4 31 bee, l5 43 pouch, W 11 wand, S 36 crystal ball
# panda-fortune <- rpg-monk-skill-game-icons (square painted tiles, rounded + gold rim): h1 28 panda, h2 27 tiger, h3 26 crane, h4 29 snake, l1 37 lotus, l2 9 yin-yang, l3 35 wine jar, l4 44 incense urn, l5 48 prayer beads, W 16 golden orb, S 10 scripture book
# royal-crown-classic <- high-quality-rpg-loot-icons (h1 31 crown, h2 27 trophy, h3 36 gold key, h4 9 four-leaf clover) + fruits pack lows (30 cherries, 18 lemon, 21 orange, 10 grapes, 38 strawberry); W/S kept
# storm-chaser <- lightning-mage-skills-icon-pack (rounded tiles, blue rim): h1 15 storm caller, h2 45 tornado, h3 35 hammer, h4 43 trident, l1 20 bolts, l2 19 orb, l3 18 orbs, l4 12 spellbook, l5 24 scroll, W 16 lightning fist, S 5 storm sky (was sharing Thor's Hammer viking icons)
# ---- 2026-11-18 round 15: the classic-7s group no longer shares one identical symbol set (tools: /tmp/r15.py logic) ----
# each game: 7 and BAR hue-shifted to its colour (hot-chilli red, gold-bar gold, lucky-clover green, neon-retro magenta, liberty-bells blue, fortune-wheel orange)
# fruit slots replaced in order from fruits-berries-vegetables-icon-512x512-set:
#  hot-chilli-7s 20 chilli,6 pepper,7 tomato,11 mango,14 papaya,30 cherries,8 pumpkin | gold-bar-7s viking 3 ingot (gold colourised),29,27,18,45,35,32
#  lucky-clover-7s loot 9 clover,43,17,50,4,24,9 | neon-retro-7s 19,39,31,46,44,10,2 | liberty-bells 15,30,38,16,12,39,26 | fortune-wheel-deluxe 21,35,13,11,8,45,29
# round 16: dragon-empire-4096 <- dragon loot 3,32,31,36,34,28,43,49,12,W47,S45 ; neon-nights <- gems 20,3,92,78,81,82,61,76,26,W64,S30 (both were 11/11 identical to golden-dragon / star-gems)
# round 17: ice-queen <- rpg-elixir-icons 50,17,21,35,10,19,25,6,47,W37,S13 (frost potions) ; bamboo-panda lows <- elixir 12 wine gourd,20,22,11,9 (herbal tonics)
# round 19: space/robot group: lows replaced (alien gems 23,86,41,35,31 | space-odyssey planes 1,4,6,8,3 | cosmic gems 42,11,4,7,16 | robot-factory gems 79,28,53,62,24 | robot-walkers planes 2,5,7,9,10); h1-h4 + a_h* sprite sheets hue-shifted (odyssey 200, cosmic 110, factory 40, walkers 150)
# round 20: cosmic-candy <- sweets-2d-game-items 22,32,34,39,11,37,24,35,8 ; mayan-mystery <- stone-age 25,45,9,42,27,26,30,15,36 (W/S kept)
# round 21: thunder-temple <- lightning-mage tiles (gold rim) 23,44,13,25,9,10,31,46,34 ; fiesta-loca <- fruits-512 5 corn,17 avocado,45 pineapple,40 garlic,3,24,25,1,34
# round 22: triple-sevens: 777/BAR/diamond/star hue +190 (cyan), lows -> kit items 10 cards, 14 dice, 15 banana (was 7/11 identical to lucky-777)
# round 23: buffalo-wild-reels <- CraftPix hunting-trophy loot icons (cpx eb4d967a): 3 skull,7 stag,8 boar,13 horns,17 bear paw,25 pelt,5 fang,47 feather,42 antler (W/S kept)
