# Miya's Cookies — Pixel Sprite Pack v1.2

Character and item sprites built from the brand asset: ink line art on kraft paper,
chef girl, bitten cookie, heart. Everything is hand-placed pixel data, so it stays
crisp at any integer scale.

**The signature cookie:** Nutella-filled, sea salt on top. Three states ship in this
pack — whole, bitten (filling revealed), and split (molten core + drip) — because the
filling is the brand promise and it has to be visible in at least one state on screen.

---

## What changed in v1.2 — the tear-track fix

The smile's corner pixels sat at columns 14 and 17, row 10. The eyes end at row 9 in
those exact same columns, so each corner was directly beneath an eye pixel with no gap
— and the ink outline pass fused them into one continuous vertical stroke. Small, it
read as a smile. Blown up, it read as tear tracks running down into the mouth.

The whole mouth dropped one row, so a skin pixel now breaks the line under each eye.
Applies to faces `A`, `B`, `C`, `E`, `F`. Before/after: `preview/eye_fix_before_after.png`.

**Rule for any new face:** no ink pixel may sit directly above or below an eye pixel in
the same column. Leave at least one clear skin row between the eyes and anything else.
This is the kind of thing that only shows up when you zoom in, so check at 8× or more
before committing a face.

## What changed in v1.1 — the eyes

Miya's eyes are open, round, and warm across the whole set. Three things had to change
together, because at 32×32 a face is only about 8×6 pixels of usable space:

1. **Eyes:** 2×2 blocks with a single white glint pixel in the upper-left of each. The
   glint does the emotional work — without it, two black squares read as blank.
2. **Smile:** the old 2-pixel dark block read as a surprised "o". It's now a four-pixel
   arc, so the mouth stops competing with the eyes for attention.
3. **Blush:** dropped to sit under the eyes instead of beside the mouth.

The `sleepy` pose uses the half-lidded variant, so late-night Miya looks drowsy rather
than just closed-eyed.

**Alternatives are shipped, not lost.** `sprites/face-options/` has `idle` and `hero`
in all seven treatments so you can compare in-engine:

| Face | Read |
|---|---|
| `closed` | v1 original — logo-accurate, but flat in motion |
| `A` | **Default.** Round eyes + smile arc. Cozy, alert, works at every size |
| `B` | Tall cozy eyes. Bigger, more doe-eyed — better for hero art than gameplay |
| `C` | Half-lidded. Relaxed and drowsy — used for `sleepy` |
| `D` | Round eyes + open "oh" mouth. Surprised / delighted |
| `E` | Warm brown iris under a black lid. Softest read, but nearly invisible at 1× |
| `F` | Wide-set. Roomier, though the eyes crowd the hairline |

To swap the default globally, change `DEFAULT_FACE = 'A'` in `source/build.py` and
re-run — every sprite regenerates on the new face.

---

## What's in the box

| Path | Contents |
|---|---|
| `sprites/miya/` | 48 character sprites, 32×32, transparent, 1× pixel data |
| `sprites/miya/@4x/` | Same 48 at 4× (128×128) for UI, marketing, store cards |
| `sprites/flat/` | Same 48 without the ink outline (flat fill variant) |
| `sprites/face-options/` | `idle` + `hero` in all 7 eye treatments, 1× and 4× |
| `sprites/props/` | 14 item sprites, 16×16, transparent |
| `sprites/props/@4x/` | Same 14 at 4× (64×64) |
| `sheets/miya_sheet.png` | Master atlas, 8 cols × 6 rows, uniform 32×32 frames |
| `sheets/props_sheet.png` | Item atlas, 7 cols × 2 rows, uniform 16×16 frames |
| `sheets/strips/` | One horizontal strip per outfit (8 frames) for animation tools |
| `sheets/atlas.json` | Frame coordinates + labels for both sheets |
| `palette/` | `palette.json`, `miyas_cookies.gpl` (Aseprite/GIMP), swatch PNG |
| `preview/` | Contact sheet, hero image, eye study, eye fix before/after |
| `source/` | The generator scripts — regenerate everything from here |

## Naming

```
miya_<outfit>_<pose>.png        e.g. miya_nutella_hero.png
```

**Outfits (6):** `classic` · `kraft` · `midnight` · `sprinkle` · `nutella` · `barista`
**Poses (8):** `idle` · `wave` · `tray` · `mix` · `cheer` · `run` · `hero` · `sleepy`

| Pose | Intended job |
|---|---|
| `idle` | Storefront greeter, default game state |
| `wave` | Onboarding hello, empty cart, 404 |
| `tray` | Order confirmed, delivery, "batch ready" |
| `mix` | Crafting / loading state |
| `cheer` | Combo, streak, level complete |
| `run` | Endless-runner key frame |
| `hero` | Win screen, hero banner, app icon lockup |
| `sleepy` | Idle timeout, "midnight batch" late-night mode |

| Outfit | Unlock idea |
|---|---|
| `classic` | Default |
| `kraft` | Ink-and-kraft brand skin — first-purchase reward |
| `midnight` | "Just one more" — play after 10pm |
| `sprinkle` | Birthday / seasonal event |
| `nutella` | Signature skin — beat the signature level |
| `barista` | Cross-promo / milk-and-cookies bundle |

## Palette (locked)

Everything uses one 25-colour ramp so new assets stay on-model. Key anchors:

| Role | Hex |
|---|---|
| Ink outline | `#2B211C` |
| Kraft background | `#D8B389` |
| Cookie light / mid / crust | `#E2AC68` / `#C68946` / `#96602F` |
| Nutella / Nutella light | `#3A2014` / `#633821` |
| Sea salt | `#FFFFFF` |
| Gold (reward) | `#F3C94C` |
| Heart red | `#D6544F` |

Full list with roles in `palette/palette.json`. Load `palette/miyas_cookies.gpl` into
Aseprite or GIMP before editing so nothing drifts off-brand.

## Using them

**Web / CSS** — never let the browser smooth the pixels:
```css
img.sprite { image-rendering: pixelated; }
```
Scale by whole numbers only (2×, 3×, 4×). Non-integer scaling destroys pixel art.

**Sprite sheet math** — every frame is a uniform cell:
```js
sx = col * 32;  sy = row * 32;   // characters
sx = col * 16;  sy = row * 16;   // props
```
`sheets/atlas.json` already lists `col`, `row`, `x`, `y` per frame.

**Phaser 3**
```js
this.load.spritesheet('miya', 'sheets/miya_sheet.png', { frameWidth: 32, frameHeight: 32 });
// row-major: frame index = row * 8 + col
```

**Unity** — import as Sprite (2D and UI), Multiple, Grid By Cell Size 32×32,
Filter Mode: Point (no filter), Compression: None.

**Outlined vs flat** — the outlined set is the default: the ink keyline matches the logo
and keeps Miya readable on kraft, white, and dark backgrounds. The flat set in
`sprites/flat/` exists for cases where you want your own outline colour or a silhouette
shader.

## Notes and known limits

- Poses are single key frames, not full animation cycles. `run` is one key of a planned
  4-frame cycle; `idle` needs a 2-frame breathe. With open eyes there's now also a blink
  worth adding — reuse the `closed` face for two frames every few seconds.
- Miya is front-facing only. No side or back views yet.
- Props are one frame each. Pickups will want a 3–4 frame bob or sparkle loop.
- Everything regenerates from `source/`, so palette changes, new outfits, new poses, and
  new faces are cheap to add.
