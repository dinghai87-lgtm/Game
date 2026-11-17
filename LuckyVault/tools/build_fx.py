# Win-effect sprites from Kenney Particle Pack (CC0) -> assets/fx/*.webp, pre-tinted gold / white.
# Source: /mnt/user-data/uploads/Downloads/kenney_particle-pack.zip (extracted to /tmp/ext/pp)
import os, sys
from PIL import Image, ImageOps
SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ext/pp/PNG (Transparent)'
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'fx'); os.makedirs(OUT, exist_ok=True)
JOBS = [('star_06', 'star', 128, (255, 214, 90)), ('star_04', 'star2', 128, (255, 240, 180)), ('flare_01', 'flare', 256, (255, 200, 80)),
        ('light_03', 'halo', 256, (255, 190, 60)), ('circle_05', 'dot', 256, (255, 214, 90)), ('magic_03', 'burst', 256, (255, 220, 120)),
        ('star_08', 'spark', 128, (255, 230, 150)), ('twirl_02', 'twirl', 256, (255, 200, 90)), ('symbol_02', 'sym', 128, (255, 214, 90))]
for src, name, size, col in JOBS:
    im = Image.open(os.path.join(SRC, src + '.png')).convert('RGBA'); a = im.getchannel('A') if im.mode == 'RGBA' else im.convert('L')
    lum = im.convert('L'); alpha = Image.eval(Image.composite(lum, Image.new('L', im.size, 0), a), lambda v: v)
    tint = Image.new('RGBA', im.size, col + (0,)); tint.putalpha(alpha)
    # brighten the core towards white
    core = Image.new('RGBA', im.size, (255, 255, 255, 0)); core.putalpha(Image.eval(alpha, lambda v: max(0, v * 2 - 255)))
    out = Image.alpha_composite(tint, core).resize((size, size), Image.LANCZOS)
    out.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=88, method=6)
print('fx sprites', len(JOBS), sorted(os.listdir(OUT)))
