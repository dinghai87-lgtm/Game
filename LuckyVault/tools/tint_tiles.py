# Give sepia tile sets (lightning-mage pack) a distinct colour per symbol so highs/lows read apart.
# Usage: python3 tint_tiles.py slug   (reads from a backup dir if given as 2nd arg)
import sys
from PIL import Image, ImageOps, ImageEnhance
A = '/home/claude/slots/assets/games/'
slug = sys.argv[1]; src = sys.argv[2] if len(sys.argv) > 2 else A + slug
# (dark, mid, light) per symbol: highs = rich jewel tones, lows = softer metals
PAL = {
 'h1': ((40, 8, 70), (150, 70, 230), (240, 220, 255)),    # violet
 'h2': ((70, 5, 10), (220, 50, 50), (255, 225, 200)),     # crimson
 'h3': ((5, 45, 30), (40, 190, 120), (220, 255, 230)),    # emerald
 'h4': ((5, 20, 70), (50, 120, 240), (220, 235, 255)),    # royal blue
 'l1': ((40, 30, 10), (200, 160, 60), (255, 245, 210)),   # gold
 'l2': ((30, 35, 45), (150, 165, 185), (245, 248, 255)),  # silver
 'l3': ((50, 22, 8), (200, 110, 50), (255, 230, 200)),    # copper
 'l4': ((10, 40, 45), (60, 170, 175), (220, 250, 250)),   # teal
 'l5': ((50, 15, 35), (190, 80, 140), (255, 225, 240)),   # rose
}
for k, (d, m, l) in PAL.items():
    im = Image.open(f'{src}/{k}.webp').convert('RGBA'); a = im.split()[3]
    g = ImageEnhance.Contrast(ImageOps.grayscale(im)).enhance(1.15)
    c = ImageOps.colorize(g, black=d, mid=m, white=l).convert('RGBA'); c.putalpha(a)
    c.save(f'{A}{slug}/{k}.webp', 'WEBP', quality=90)
print('tinted', slug)
