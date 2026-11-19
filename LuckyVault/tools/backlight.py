# Put a soft glowing rune-disc behind thin/dark symbols so they read on dark reels.
# Usage: python3 backlight.py slug r,g,b [src_dir]
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
A = '/home/claude/slots/assets/games/'
slug = sys.argv[1]; col = tuple(int(x) for x in sys.argv[2].split(',')); src = sys.argv[3] if len(sys.argv) > 3 else A + slug
for k in ['h1', 'h2', 'h3', 'h4', 'l1', 'l2', 'l3', 'l4', 'l5']:
    im = Image.open(f'{src}/{k}.webp').convert('RGBA'); S = im.size[0]
    a = im.split()[3]; rgb = ImageEnhance.Brightness(im.convert('RGB')).enhance(1.2); im = rgb.convert('RGBA'); im.putalpha(a)
    bg = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(bg); m = S * .1
    d.ellipse((m, m, S - m, S - m), fill=col + (215,)); bg = bg.filter(ImageFilter.GaussianBlur(S * .08))
    ring = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(ring).ellipse((m + 6, m + 6, S - m - 6, S - m - 6), outline=(255, 255, 255, 70), width=3)
    # thin dark outline around the symbol itself
    ol = Image.new('RGBA', im.size, (20, 10, 30, 0)); ol.putalpha(a.filter(ImageFilter.MaxFilter(7)).point(lambda v: 200 if v > 40 else 0))
    out = Image.alpha_composite(Image.alpha_composite(Image.alpha_composite(bg, ring), ol), im)
    out.save(f'{A}{slug}/{k}.webp', 'WEBP', quality=90)
print('backlit', slug)
