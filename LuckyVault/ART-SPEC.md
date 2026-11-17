# Lucky Vault — art and audio drop-in guide

Every game already ships with generated art (emoji symbols, CSS gems, drawn covers and
procedural music), so nothing here is required. When a designer delivers real art, drop the
files in and list them in `public/assets/manifest.json`. No code changes, no rebuild: refresh
the page (and run `mobile/prepare.js` again for the app).

## Folder layout
```
public/assets/
  manifest.json
  games/<slug>/cover.webp      lobby tile
  games/<slug>/bg.webp         full-screen game background
  games/<slug>/h1.webp ...     symbols (any you leave out keep the built-in look)
  audio/music.mp3              background music for all games (optional)
```
`<slug>` is the game name in lower case with spaces turned into dashes:
`Thunder Temple` → `thunder-temple`, `Lucky 777` → `lucky-777`, `Classic Blackjack` → `classic-blackjack`.

## manifest.json
```json
{
  "games": {
    "thunder-temple": { "cover": "cover.webp", "bg": "bg.webp",
                        "sym_h1": "h1.webp", "sym_h2": "h2.webp", "sym_W": "wild.webp", "sym_S": "scatter.webp" }
  },
  "audio": { "music": "assets/audio/music.mp3" }
}
```
Symbol keys: `sym_h1`–`sym_h4` (high pays, h1 is the top symbol), `sym_l1`–`sym_l5` (low pays),
`sym_W` (wild), `sym_S` (scatter / bonus). The paytable (ⓘ) shows which symbol is which.

## Sizes and formats
| Asset | Size | Notes |
|---|---|---|
| Cover | 600 × 800 px (3:4) | WebP or JPG, under 120 KB. The game name is printed over the bottom 25% — keep that area calm. The built-in emoji art is hidden when a cover is present. |
| Background | 1920 × 1080 px | WebP/JPG, under 400 KB. Centre-cropped on phones (portrait), so keep the subject in the middle third. Darker images read better behind the reels. |
| Symbol | 256 × 256 px, transparent | WebP or PNG, under 40 KB each. Leave ~8% padding; the cell adds a drop shadow. |
| Music | 60–120 s loop | MP3/M4A, 96–128 kbps, mixed quietly (around -18 LUFS). Players switch it with the 🎵 button. |

## Rules for app-store builds
- Only use art you own or have licensed. No real casino brands, celebrities or film/TV characters.
- No images of real money, cash prizes or anything that suggests coins can be cashed out.
- Nothing aimed at children (cartoon styles are fine, but no toys/school themes).
