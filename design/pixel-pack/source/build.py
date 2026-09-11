import json
import os
import shutil

from PIL import Image, ImageDraw, ImageFont

from art_lib import PALETTE, KRAFT_BG, outline
import miya
import props

OUT = '/home/claude/build/miyas-cookies-pixel-pack'
DEFAULT_FACE = 'A'
POSE_FACE = {'sleepy': 'C'}
FONT = '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf'
FONT_R = '/usr/share/fonts/truetype/google-fonts/Poppins-Regular.ttf'


def f(size, bold=True):
    try:
        return ImageFont.truetype(FONT if bold else FONT_R, size)
    except Exception:
        return ImageFont.load_default()


def fresh(p):
    if os.path.exists(p):
        shutil.rmtree(p)
    os.makedirs(p, exist_ok=True)


fresh(OUT)
for d in ['sprites/miya', 'sprites/miya/@4x', 'sprites/props', 'sprites/props/@4x',
          'sprites/flat', 'sheets', 'palette', 'preview']:
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

pose_keys = list(miya.POSES)
outfit_keys = list(miya.OUTFITS)
prop_keys = list(props.PROPS)

atlas = {
    "meta": {
        "project": "Miya's Cookies",
        "generated": "pixel art pack v1",
        "character_size": [32, 32],
        "prop_size": [16, 16],
        "note": "All sprites are 1x pixel data with transparent backgrounds. Scale with nearest-neighbour only."
    },
    "characters": {"sheet": "sheets/miya_sheet.png", "frame": [32, 32], "frames": []},
    "props": {"sheet": "sheets/props_sheet.png", "frame": [16, 16], "frames": []},
}

# ---------------------------------------------------------------- character sprites
char_grids = {}
for r, ok in enumerate(outfit_keys):
    for c, pk in enumerate(pose_keys):
        fc = POSE_FACE.get(pk, DEFAULT_FACE)
        g = outline(miya.build(pk, ok, face=fc))
        flat = miya.build(pk, ok, face=fc)
        char_grids[(ok, pk)] = g
        name = f"miya_{ok}_{pk}"
        g.render(1).save(f"{OUT}/sprites/miya/{name}.png")
        g.render(4).save(f"{OUT}/sprites/miya/@4x/{name}@4x.png")
        flat.render(1).save(f"{OUT}/sprites/flat/{name}_flat.png")
        atlas["characters"]["frames"].append({
            "name": name,
            "outfit": ok, "outfit_label": miya.OUTFITS[ok][0],
            "pose": pk, "pose_label": miya.POSES[pk][0],
            "col": c, "row": r,
            "x": c * 32, "y": r * 32, "w": 32, "h": 32,
        })

# ---------------------------------------------------------------- prop sprites
prop_grids = {}
for i, pk in enumerate(prop_keys):
    lbl, fn = props.PROPS[pk]
    g = outline(fn())
    prop_grids[pk] = g
    g.render(1).save(f"{OUT}/sprites/props/{pk}.png")
    g.render(4).save(f"{OUT}/sprites/props/@4x/{pk}@4x.png")
    atlas["props"]["frames"].append({
        "name": pk, "label": lbl,
        "col": i % 7, "row": i // 7,
        "x": (i % 7) * 16, "y": (i // 7) * 16, "w": 16, "h": 16,
    })

# ---------------------------------------------------------------- face options
os.makedirs(f"{OUT}/sprites/face-options", exist_ok=True)
for fk, (flbl, _fn) in miya.FACES.items():
    for pk in ('idle', 'hero'):
        outline(miya.build(pk, 'classic', face=fk)).render(1).save(
            f"{OUT}/sprites/face-options/miya_classic_{pk}_face-{fk}.png")
        outline(miya.build(pk, 'classic', face=fk)).render(4).save(
            f"{OUT}/sprites/face-options/miya_classic_{pk}_face-{fk}@4x.png")

# ---------------------------------------------------------------- sheets
sheet = Image.new('RGBA', (32 * len(pose_keys), 32 * len(outfit_keys)), (0, 0, 0, 0))
for r, ok in enumerate(outfit_keys):
    for c, pk in enumerate(pose_keys):
        sheet.alpha_composite(char_grids[(ok, pk)].render(1), (c * 32, r * 32))
sheet.save(f"{OUT}/sheets/miya_sheet.png")
sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(f"{OUT}/sheets/miya_sheet@4x.png")

pw = 7
ph = (len(prop_keys) + pw - 1) // pw
psheet = Image.new('RGBA', (16 * pw, 16 * ph), (0, 0, 0, 0))
for i, pk in enumerate(prop_keys):
    psheet.alpha_composite(prop_grids[pk].render(1), ((i % pw) * 16, (i // pw) * 16))
psheet.save(f"{OUT}/sheets/props_sheet.png")
psheet.resize((psheet.width * 4, psheet.height * 4), Image.NEAREST).save(f"{OUT}/sheets/props_sheet@4x.png")

# per-outfit strips (handy for animation software)
os.makedirs(f"{OUT}/sheets/strips", exist_ok=True)
for ok in outfit_keys:
    strip = Image.new('RGBA', (32 * len(pose_keys), 32), (0, 0, 0, 0))
    for c, pk in enumerate(pose_keys):
        strip.alpha_composite(char_grids[(ok, pk)].render(1), (c * 32, 0))
    strip.save(f"{OUT}/sheets/strips/miya_{ok}_strip.png")

with open(f"{OUT}/sheets/atlas.json", 'w') as fh:
    json.dump(atlas, fh, indent=2)

# ---------------------------------------------------------------- palette
def hexs(rgba):
    return '#%02X%02X%02X' % rgba[:3]


PAL_ROLES = {
    'K': 'Ink outline (logo black)', 'k': 'Soft ink / motion ticks',
    'S': 'Skin', 's': 'Skin shadow', 'H': 'Hair', 'h': 'Hair highlight',
    'P': 'Blush', 'W': 'White', 'w': 'White shadow',
    'T': 'Kraft paper', 't': 'Kraft shadow',
    'C': 'Cookie mid', 'c': 'Cookie light', 'd': 'Cookie crust',
    'N': 'Nutella', 'n': 'Nutella light', 'X': 'Sea salt',
    'G': 'Gold / reward', 'g': 'Gold shadow', 'R': 'Red accent', 'p': 'Pink',
    'B': 'Blue', 'M': 'Mint', 'L': 'Lavender', 'e': 'Warm brown',
}
pal_json = {k: {"hex": hexs(v), "rgba": list(v), "role": PAL_ROLES.get(k, '')}
            for k, v in PALETTE.items() if v[3] != 0}
pal_json['_background_kraft'] = {"hex": hexs(KRAFT_BG), "rgba": list(KRAFT_BG),
                                 "role": "Brand kraft paper background (not part of sprites)"}
with open(f"{OUT}/palette/palette.json", 'w') as fh:
    json.dump(pal_json, fh, indent=2)

# GIMP / Aseprite .gpl palette
lines = ["GIMP Palette", "Name: Miyas Cookies", "Columns: 8", "#"]
for k, v in PALETTE.items():
    if v[3] == 0:
        continue
    lines.append(f"{v[0]:3d} {v[1]:3d} {v[2]:3d}\t{PAL_ROLES.get(k, k)}")
open(f"{OUT}/palette/miyas_cookies.gpl", 'w').write("\n".join(lines) + "\n")

# swatch image
sw = 64
items = [(k, v) for k, v in PALETTE.items() if v[3] != 0]
cols = 6
rows = (len(items) + cols - 1) // cols
swatch = Image.new('RGBA', (cols * sw, rows * sw + 40), KRAFT_BG)
d = ImageDraw.Draw(swatch)
d.text((10, 10), "MIYA'S COOKIES — PIXEL PALETTE", font=f(18), fill=(43, 33, 28))
for i, (k, v) in enumerate(items):
    x, y = (i % cols) * sw, 40 + (i // cols) * sw
    d.rectangle([x + 4, y + 4, x + sw - 6, y + sw - 22], fill=v[:3], outline=(43, 33, 28))
    d.text((x + 6, y + sw - 20), hexs(v), font=f(9, False), fill=(43, 33, 28))
swatch.convert('RGB').save(f"{OUT}/palette/palette_swatch.png")

# ---------------------------------------------------------------- contact sheet
SC = 5
cell_w, cell_h = 32 * SC + 26, 32 * SC + 34
head = 150
W = cell_w * len(pose_keys) + 190
H = head + cell_h * len(outfit_keys) + 210
cs = Image.new('RGBA', (W, H), KRAFT_BG)
d = ImageDraw.Draw(cs)
d.text((40, 34), "MIYA'S COOKIES", font=f(46), fill=(30, 24, 20))
d.text((40, 88), "pixel sprite pack v1.2  ·  32x32 character  ·  16x16 props  ·  freshly baked bad decisions",
       font=f(15, False), fill=(70, 55, 44))

for c, pk in enumerate(pose_keys):
    x = 190 + c * cell_w
    d.text((x + 6, head - 24), miya.POSES[pk][0].split('/')[0].strip().upper(),
           font=f(11), fill=(60, 46, 38))
for r, ok in enumerate(outfit_keys):
    y = head + r * cell_h
    d.text((36, y + cell_h // 2 - 16), miya.OUTFITS[ok][0].upper(), font=f(12), fill=(60, 46, 38))
    d.text((36, y + cell_h // 2 + 2), f"miya_{ok}_*", font=f(10, False), fill=(120, 96, 78))
    for c, pk in enumerate(pose_keys):
        x = 190 + c * cell_w
        cs.alpha_composite(char_grids[(ok, pk)].render(SC), (x + 6, y + 8))

py = head + cell_h * len(outfit_keys) + 20
d.text((40, py - 4), "THE SIGNATURE: NUTELLA-FILLED, SEA SALT ON TOP  ·  ITEMS & PICKUPS",
       font=f(14), fill=(60, 46, 38))
PS = 6
for i, pk in enumerate(prop_keys):
    x = 40 + i * (16 * PS + 22)
    cs.alpha_composite(prop_grids[pk].render(PS), (x, py + 30))
    d.text((x, py + 30 + 16 * PS + 6), pk.replace('cookie_', '').replace('_', ' '),
           font=f(9, False), fill=(80, 62, 50))
cs.convert('RGB').save(f"{OUT}/preview/contact_sheet.png")

# hero preview: signature cookie big + Miya nutella outfit
hero = Image.new('RGBA', (900, 420), KRAFT_BG)
hd = ImageDraw.Draw(hero)
hero.alpha_composite(char_grids[("nutella", "hero")].render(11), (40, 40))
hero.alpha_composite(prop_grids['cookie_signature'].render(14), (430, 60))
hero.alpha_composite(prop_grids['cookie_bitten'].render(8), (748, 60))
hero.alpha_composite(prop_grids['cookie_split'].render(8), (748, 200))
hd.text((430, 300), "MIYA'S SIGNATURE", font=f(28), fill=(30, 24, 20))
hd.text((430, 336), "Nutella-filled. Sea salt on top.", font=f(16, False), fill=(70, 55, 44))
hd.text((430, 360), "Freshly baked bad decisions.", font=f(14, False), fill=(120, 96, 78))
hero.convert('RGB').save(f"{OUT}/preview/hero.png")

print("characters:", len(atlas['characters']['frames']), "props:", len(prop_keys))
print("sheet:", sheet.size, "contact:", cs.size)
