#!/usr/bin/env python3
"""Symbol win-animations from the purchased kits.

For each (game, symbol) it takes the kit's frame sequence, crops every frame with ONE shared box
(so the creature does not jitter), scales it into a 200px cell and writes a horizontal strip
assets/games/<slug>/a_<sym>.webp.  The static symbol <sym>.webp is regenerated from frame 0 of the
same strip so the switch from still to animated is seamless.  Manifest gets anim_<sym> + animN_<sym>.
Run after build_skins.py (which rewrites manifest entries)."""
import glob, json, os, re
from PIL import Image

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')
P = '/tmp/packs/'
UP = '/mnt/user-data/uploads/claude导出/'
SIZE = 200
MAXF = 12


def num(f):
    m = re.findall(r'(\d+)\.png$', f)
    return int(m[-1]) if m else 0


def frames(pattern):
    fs = sorted(glob.glob(pattern), key=num)
    if len(fs) > MAXF:  # sample evenly, keep the loop closed
        step = len(fs) / MAXF
        fs = [fs[int(i * step)] for i in range(MAXF)]
    return fs


def strip(fs, slug, key, man):
    if len(fs) < 2:
        print('  skip', slug, key, len(fs)); return
    ims = [Image.open(f).convert('RGBA') for f in fs]
    W = max(i.size[0] for i in ims); H = max(i.size[1] for i in ims)
    ims = [i if i.size == (W, H) else _pad(i, W, H) for i in ims]
    box = None
    for i in ims:
        b = i.getbbox()
        if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
    bw, bh = box[2] - box[0], box[3] - box[1]; s = SIZE * 0.92 / max(bw, bh)
    tw, th = max(1, int(bw * s)), max(1, int(bh * s))
    S = Image.new('RGBA', (SIZE * len(ims), SIZE), (0, 0, 0, 0))
    for n, i in enumerate(ims):
        c = i.crop(box).resize((tw, th), Image.LANCZOS)
        S.paste(c, (n * SIZE + (SIZE - tw) // 2, (SIZE - th) // 2), c)
    d = os.path.join(OUT, 'games', slug); os.makedirs(d, exist_ok=True)
    S.save(os.path.join(d, 'a_' + key + '.webp'), 'WEBP', quality=80, method=6)
    f0 = S.crop((0, 0, SIZE, SIZE)).resize((256, 256), Image.LANCZOS); f0.save(os.path.join(d, key + '.webp'), 'WEBP', quality=90)
    e = man['games'].setdefault(slug, {})
    e['sym_' + key] = key + '.webp'; e['anim_' + key] = 'a_' + key + '.webp'; e['animN_' + key] = len(ims)
    print('  anim', slug, key, len(ims))


def _pad(i, W, H):
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.paste(i, ((W - i.size[0]) // 2, (H - i.size[1]) // 2)); return c


ZB = UP + 'craftpix-891167-zombieland-slots-2d-game-kit/Game files/Symbols/Symbol %s/*.png'
GD = P + 'golden/Game files/Symbols/Symbol%d/*.png'
UK = P + 'underwater-world-game-kit/Fish, crab, jellyfish, shark/PNG/%s/%s_*.png'
MK = P + 'underwater-world-game-kit/Mermaid/PNG/Mermaid_%d/%s_*.png'
SK = P + 'space-adventures-2d-game-kit/PNG/Enemy/Char%02d/Idle/*.png'
cr = lambda d, a: frames(UK % (d, a))

PU = UP + 'pinup/Game files/Symbols/%s/*.png'
SPEC = {
    'koi-pond': {'h1': cr('Fish_2', 'Fish_move_2'), 'h2': cr('Fish_1', 'Fish_move_1'), 'h3': cr('Fish_3', 'Fish_move_3'), 'h4': cr('Fish_4', 'Fish_move_4')},
    'pin-up-glam': {k: frames(PU % n) for k, n in [('h1', '10_girl'), ('h2', '11_girl'), ('h3', '12_girl'), ('h4', '13_girl'), ('l1', '15_phone'), ('l2', '16_lipstick'), ('l3', '17_glasses'), ('l4', '20_cocktail'), ('l5', '22_ring'), ('W', '24_wild'), ('S', '21_microphone')]},
    'zombieland': {'h1': frames(ZB % '10 - Girl zombie'), 'h2': frames(ZB % '9 - Blue zombie'), 'h3': frames(ZB % '8 - Green zombie'),
                   'h4': frames(ZB % '7 - Skull'), 'l1': frames(ZB % '6 - Brain'), 'l2': frames(ZB % '5 - Eye'),
                   'W': frames(ZB % '11 - Wild - Ghost'), 'S': frames(ZB % '12 - Free spins')},
    'golden-slots': {k: frames(GD % n) for k, n in [('h1', 11), ('h2', 10), ('h3', 9), ('h4', 8), ('l1', 6), ('l2', 5), ('l3', 4), ('l4', 3), ('l5', 2), ('W', 13), ('S', 12)]},
    'ocean-treasure': {'h1': frames(MK % (1, 'Idle')), 'h2': cr('Shark_1', 'Shark_move_1'), 'h3': cr('Fish_1', 'Fish_move_1'), 'h4': cr('Jellyfish_1', 'Jellyfish_move_1')},
    'ocean-pearl-link': {'h1': frames(MK % (2, 'Idle')), 'h2': cr('Jellyfish_2', 'Jellyfish_move_2'), 'h3': cr('Fish_2', 'Fish_move_2'), 'h4': cr('Crab_2', 'Crab_idle_2')},
    'ocean-wilds': {'h1': frames(MK % (3, 'Idle')), 'h2': cr('Fish_3', 'Fish_move_3'), 'h3': cr('Fish_4', 'Fish_move_4'), 'h4': cr('Jellyfish_3', 'Jellyfish_move_3')},
    'shark-hunter': {'h1': cr('Shark_2', 'Shark_move_2'), 'h2': cr('Shark_1', 'Shark_move_1'), 'h3': cr('Fish_4', 'Fish_move_4'), 'h4': cr('Sea urchin', 'Sea urchin_idle')},
    'big-catch-bonanza': {'h1': cr('Fish_2', 'Fish_move_2'), 'h2': cr('Fish_1', 'Fish_move_1'), 'h3': cr('Crab_1', 'Crab_move_1'), 'h4': cr('Fish_3', 'Fish_move_3')},
    'alien-invasion': {'h1': frames(SK % 10), 'h2': frames(SK % 3), 'h3': frames(SK % 6), 'h4': frames(SK % 7)},
    'space-odyssey': {'h1': frames(SK % 5), 'h2': frames(SK % 4), 'h3': frames(SK % 8), 'h4': frames(SK % 2)},
    'cosmic-choice': {'h1': frames(SK % 9), 'h2': frames(SK % 1), 'h3': frames(SK % 6), 'h4': frames(SK % 3)},
    'robot-factory': {'h1': frames(SK % 3), 'h2': frames(SK % 9), 'h3': frames(SK % 10), 'h4': frames(SK % 7)},
    'robot-walkers': {'h1': frames(SK % 1), 'h2': frames(SK % 5), 'h3': frames(SK % 2), 'h4': frames(SK % 8)},
}

if __name__ == '__main__':
    mp = os.path.join(OUT, 'manifest.json'); man = json.load(open(mp))
    for slug, syms in SPEC.items():
        if slug not in man['games']: print('  (no skin yet)', slug)
        for key, fs in syms.items(): strip(fs, slug, key, man)
    json.dump(man, open(mp, 'w'), indent=1, ensure_ascii=False)
    print('anims done')
