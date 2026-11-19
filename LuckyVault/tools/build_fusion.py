# Round "fusion" (2026-11-19): re-skin games whose symbols didn't match their theme or duplicated other games,
# using CraftPix member packs (commercial licence) staged under /tmp/cp2. Keeps each game's bg/logo/W-S unless set.
# Usage: python3 build_fusion.py [slug ...]   (no args = all entries below)
import json, os, sys, math
from PIL import Image, ImageDraw, ImageFilter
A = '/home/claude/slots/assets/'
man = json.load(open(A + 'manifest.json'))
CP = '/tmp/cp2/'
EGG = CP + 'dragon-egg-loot-vector-icons/PNG/without_shadow/'
CLAW = CP + 'claw-loot-vector-game-icons/PNG/without_shadow/'
ELX = CP + 'rpg-elixir-icons/PNG/without background/'
HQ = CP + 'high-quality-rpg-loot-icons/PNG/without background/'
LT = CP + 'lightning-mage-skills-icon-pack/PNG/'
SNOW = CP + 'snowy-2d-game-backgrounds/_PNG/%02d/snowy%02d_preview-01.png'

def sym(src, dst, size=256):
    im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox())
    w, h = im.size; s = size * 0.9 / max(w, h); im = im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.LANCZOS)
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0)); c.paste(im, ((size - im.size[0]) // 2, (size - im.size[1]) // 2), im)
    c.save(dst, 'WEBP', quality=90)

def tile(src, dst, rim, size=256):
    # square painted tile -> rounded corners + metallic rim (same treatment as storm-chaser / thunder-temple)
    im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox()).resize((size - 16, size - 16), Image.LANCZOS)
    r = 34; m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.size[0] - 1, im.size[1] - 1), r, fill=255)
    im.putalpha(Image.composite(im.split()[3], m, m))
    c = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.rounded_rectangle((2, 2, size - 3, size - 3), r + 6, fill=tuple(int(v * .45) for v in rim) + (255,))
    d.rounded_rectangle((4, 4, size - 5, size - 5), r + 4, fill=rim + (255,))
    c.alpha_composite(im, (8, 8))
    hl = Image.new('RGBA', (size, size), (0, 0, 0, 0)); ImageDraw.Draw(hl).rounded_rectangle((5, 5, size - 6, size - 6), r + 3, outline=(255, 255, 255, 110), width=2)
    c = Image.alpha_composite(c, hl); c.save(dst, 'WEBP', quality=90)

def cover(bgsrc, syms, dst, glow):
    W, H = 600, 800; b = Image.open(bgsrc).convert('RGB'); r = max(W / b.size[0], H / b.size[1])
    b = b.resize((int(b.size[0] * r) + 1, int(b.size[1] * r) + 1)); x = (b.size[0] - W) // 2; b = b.crop((x, 0, x + W, H)).convert('RGBA')
    halo = Image.new('RGBA', (W, H), (0, 0, 0, 0)); ImageDraw.Draw(halo).ellipse((60, 90, 540, 570), fill=glow + (150,)); b = Image.alpha_composite(b, halo.filter(ImageFilter.GaussianBlur(70)))
    rays = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(rays)
    for i in range(18):
        a0 = i / 18 * 2 * math.pi; a1 = a0 + math.pi / 18
        d.polygon([(300, 330), (300 + 900 * math.cos(a0), 330 + 900 * math.sin(a0)), (300 + 900 * math.cos(a1), 330 + 900 * math.sin(a1))], fill=(255, 255, 255, 22))
    b = Image.alpha_composite(b, rays)
    def put(src, cx, cy, size, rot=0):
        im = Image.open(src).convert('RGBA'); im = im.crop(im.getbbox()); s = size / max(im.size); im = im.resize((int(im.size[0] * s), int(im.size[1] * s)), Image.LANCZOS)
        if rot: im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
        sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); sh.putalpha(im.split()[3].point(lambda v: v * 0.55)); sh = sh.filter(ImageFilter.GaussianBlur(10))
        b.alpha_composite(sh, (int(cx - im.size[0] / 2) + 6, int(cy - im.size[1] / 2) + 14)); b.alpha_composite(im, (int(cx - im.size[0] / 2), int(cy - im.size[1] / 2)))
    put(syms[1], 120, 470, 170, 14); put(syms[2], 480, 460, 170, -12); put(syms[3], 300, 560, 150); put(syms[0], 300, 300, 340)
    vg = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(vg)
    for i in range(160): d.rectangle((0, H - 220 + i, W, H - 220 + i + 1), fill=(0, 0, 0, int(i * 1.4)))
    Image.alpha_composite(b, vg).convert('RGB').save(dst, 'WEBP', quality=86)

def realbg(src, dst, bright=0.8):
    from PIL import ImageEnhance
    im = Image.open(src).convert('RGB'); r = max(1600 / im.size[0], 900 / im.size[1]); im = im.resize((int(im.size[0] * r) + 1, int(im.size[1] * r) + 1), Image.LANCZOS)
    x = (im.size[0] - 1600) // 2; y = (im.size[1] - 900) // 2; ImageEnhance.Brightness(im.crop((x, y, x + 1600, y + 900))).enhance(bright).save(dst, 'WEBP', quality=80)

K = ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5', 'W', 'S']
def P(base, *ns): return [None if n is None else base + '%s.png' % n for n in ns]
G = {
 # Dragon Fortune Link: was 11/11 dragon-loot icons shared with golden-dragon family -> a dragon-egg hatchery set
 'dragon-fortune-link': dict(src=P(EGG, 22, 4, 32, 12, 15, 20, 26, 2, 1, 47, None), glow=(255, 120, 80)),
 # Zeus Lightning: crowns/goblets had no storm feel -> unused lightning-mage tiles with a gold rim (storm-chaser = blue rim)
 'zeus-lightning': dict(src=P(LT, 1, 14, 26, 7, 9, 10, 31, 22, 17, 6, 19), tile=(212, 175, 55), glow=(255, 220, 120),
   bg='/tmp/packs/cartoon-sky-game-backgrounds/PNG/BG_03/Layers/Sky.png', bright=0.75),  # cloud deck above Olympus (was the dragon forest bg)
 # Potion Lab: generic orbs -> painted elixir bottles (numbers not used by ice-queen / bamboo-panda)
 'potion-lab': dict(src=P(ELX, 2, 14, 7, 40, 4, 23, 26, 39, 31, 34, None), glow=(210, 140, 255)),
 # Vampire Castle: shared moon tiles with the 3 wolf games -> blood heart, mask, eye, skull + red vials and amulets
 'vampire-castle': dict(src=P(HQ, 22, 26, 12, 3) + P(ELX, 15, 46) + P(HQ, 37, 42) + P(ELX, 18) + [None, None], glow=(255, 90, 120)),
 # Wolf Moon Mystery: 4th copy of the moon tiles -> beast claw set (paw, fang necklace, claws, slash marks)
 'wolf-moon-mystery': dict(src=P(CLAW, 20, 10, 46, 30, 47, 4, 39, 26, 15, None, None), glow=(180, 130, 255)),
 # Frozen Kingdom: background shared with holiday-gifts -> layered snowy mountain scene
 'frozen-kingdom': dict(src=[None] * 11, bg=SNOW % (3, 3), glow=(160, 210, 255)),
}
todo = sys.argv[1:] or list(G)
for slug in todo:
    g = G[slug]; d = A + 'games/' + slug + '/'; e = man['games'][slug]
    for k, s in zip(K, g['src']):
        if not s: continue
        (tile(s, d + k + '.webp', g['tile']) if g.get('tile') else sym(s, d + k + '.webp')); e['sym_' + k] = k + '.webp'
        if k.startswith('h'): e.pop('anim_' + k, None); e.pop('animN_' + k, None)
    if g.get('bg'): realbg(g['bg'], d + 'bg.webp', g.get('bright', 0.8))
    cs = [d + k + '.webp' for k in ('h1', 'h2', 'h3', 'h4')]
    cover(d + 'bg.webp', cs, d + 'cover.webp', g['glow'])
    im = Image.open(d + 'cover.webp').convert('RGB'); im.thumbnail((300, 400), Image.LANCZOS); im.save(d + 'thumb.webp', 'WEBP', quality=74, method=6)
    print('fused', slug)
json.dump(man, open(A + 'manifest.json', 'w'), indent=1, ensure_ascii=False)
