# Builds table-game art (cards, chips, felts, wheels, dealers) from purchased CraftPix casino kits
import os, json
from PIL import Image
U = '/mnt/user-data/uploads/claude导出/'
BJ = U + 'craftpix-774122-blackjack-game-kit/PNG/'; RL = U + 'craftpix-885412-roulette-game-kit/PNG/'
PK = U + 'craftpix-552281-poker-game-kit/'; FW = U + 'craftpix-112900-fortune-wheels-game-kit/PNG/interface_game/'
O = '/home/claude/slots/assets/tables/'; os.makedirs(O + 'cards', exist_ok=True); os.makedirs(O + 'chips', exist_ok=True)
def save(src, dst, w=None, h=None, q=86, rgb=False):
    im = Image.open(src).convert('RGBA')
    if w or h:
        if w and h: im = im.resize((w, h), Image.LANCZOS)
        else: im.thumbnail((w or 99999, h or 99999), Image.LANCZOS)
    (im.convert('RGB') if rgb else im).save(O + dst, 'WEBP', quality=q)
SUITF = {'h': '1', 'd': '2', 'c': '3', 's': '4'}
for s, f in SUITF.items():
    for r in ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']:
        save(BJ + 'cards/%s/%s.png' % (f, '10' if r == 'T' else r), 'cards/%s%s.webp' % (r, s), 180)
save(BJ + 'cards/1/S.png', 'cards/back.webp', 180); save(BJ + 'cards/3/S.png', 'cards/back_blue.webp', 180)
for v in [1, 5, 10, 25, 50, 100, 500, 1000, 5000]: save(BJ + 'chips/%d.png' % v, 'chips/%d.webp' % v, 128)
save(BJ + 'interface_game/table_1.png', 'felt_bj.webp', 1800, q=82); save(BJ + 'interface_game/table_2.png', 'felt_bj_red.webp', 1800, q=82)
save(BJ + 'interface_game/bg_1.png', 'bg_purple.webp', 1600, q=80, rgb=True); save(BJ + 'interface_game/bg_2.png', 'bg_navy.webp', 1600, q=80, rgb=True)
save(BJ + 'croupier/croupier.png', 'dealer_bj.webp', 420)
save(RL + 'interface_game/table_1.png', 'felt_rl.webp', 1600, q=82)
def centered(src, dst, size=520):
    im = Image.open(src).convert('RGBA'); bb = im.split()[3].point(lambda v: 255 if v > 200 else 0).getbbox(); im = im.crop(bb)
    d = max(im.size); c = Image.new('RGBA', (d, d), (0, 0, 0, 0)); c.paste(im, ((d - im.size[0]) // 2, (d - im.size[1]) // 2), im)
    c.resize((size, size), Image.LANCZOS).save(O + dst, 'WEBP', quality=88); print(dst, bb, Image.open(src).size)
centered(RL + 'interface_game/spine_1.png', 'rl_bowl.webp'); centered(RL + 'interface_game/spine_2.png', 'rl_ring.webp'); save(RL + 'interface_game/pin.png', 'rl_pin.webp', 180)
save(RL + 'interface_game/bg_1.png', 'bg_rl.webp', 1600, q=80, rgb=True)
P = PK + 'Interface_game/png/'
for c in ['green', 'red', 'blue']: save(P + 'table-%s.png' % c, 'felt_pk_%s.webp' % c, 1800, q=82)
for c in ['green', 'red', 'violet']: save(P + 'background_%s.png' % c, 'bg_pk_%s.webp' % c, 1600, q=78, rgb=True)
save(P + 'woman_ingame.png', 'dealer_pk.webp', 520)
save(PK + 'Win/png/win.png', 'youwin.webp', 600); save(PK + 'Win/png/coins.png', 'coins.webp', 360)
save(PK + 'Win/png/stars_left.png', 'stars_l.webp', 300); save(PK + 'Win/png/stars_right.png', 'stars_r.webp', 300)
save(FW + 'wheel_2.png', 'fw_ring.webp', 640); save(FW + 'bg_2.png', 'bg_rays.webp', 1600, q=78, rgb=True); save(FW + 'bg_3.png', 'bg_dice.webp', 1600, q=78, rgb=True)
# per-category look: [page bg, felt, dealer]
T = {'blackjack': ['bg_purple.webp', 'felt_bj.webp', 'dealer_bj.webp'], 'roulette': ['bg_rl.webp', 'felt_rl.webp', None],
     'baccarat': ['bg_pk_red.webp', 'felt_pk_red.webp', 'dealer_pk.webp'], 'dragontiger': ['bg_pk_red.webp', 'felt_pk_red.webp', 'dealer_pk.webp'],
     'videopoker': ['bg_navy.webp', None, None], 'poker': ['bg_pk_violet.webp', 'felt_pk_green.webp', 'dealer_pk.webp'],
     'dice': ['bg_dice.webp', 'felt_pk_blue.webp', None], 'wheel': ['bg_rays.webp', None, None], 'keno': ['bg_navy.webp', None, None], 'scratch': ['bg_rays.webp', None, None]}
man = {'cards': True, 'chips': [1, 5, 10, 25, 50, 100, 500, 1000, 5000], 'look': T}
json.dump(man, open(O + 'tables.json', 'w'), indent=1)
print('ok', len(os.listdir(O + 'cards')), 'cards')
