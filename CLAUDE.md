# Wedding Decoration Project — Claude Context

## Project Overview
Building a 3D interactive temple decoration preview for Sharveen's wedding.
Two deliverables live in this folder:
- `temple_3d.html` — Interactive 3D Three.js scene of the temple with proposed decorations
- `decoration_plan.html` — Static decoration mood board / plan document

---

## GitHub
- **Repo:** https://github.com/sharveensn-art/Wedding (private)
- **Pages:** https://sharveensn-art.github.io/Wedding/temple_3d.html

---

## Temple Layout (from Temple Sketch PDF)
- **Main Hall:** Large rectangular space (~30 units deep × 28 units wide)
  - 18 stone pillars arranged in rows along the hall
  - Open area — NO side walls, NO back wall, NO front walls (open-air temple)
- **Aisle / Walkway:** Connects entrance to main hall (~12 units long)
  - Lined with decorative pillars on both sides
  - Open — NO aisle walls
- **Mandap:** Raised platform at the far end of the hall (z ≈ -22), ~10 units deep
  - Central ceremony area with diya ring
  - Om backdrop behind it

---

## Color Theme
- **Bride's saree:** Deep crimson / red (`#A50C1C`)
- **Theme:** Serene, minimalistic — ivory, cream, gold, sage green accents
- **Palette:** Deep red roses · White jasmine · Brass/gold · Stone · Marigold petals

---

## Decoration Elements (currently in scene)
| Element | Details |
|---|---|
| Floor | Warm stone tile throughout hall + aisle |
| 18 Pillars | Stone texture, jasmine + rose garlands wrapped around |
| Aisle pillars | White jasmine hanging garlands |
| Mandap | Raised platform, diya ring, Om backdrop |
| Ceiling lattice | Brass beams with hanging bells |
| Fairy lights | Warm white instanced mesh throughout |
| Marigold petals | Scattered on floor |
| Carpet | Red carpet runner (aisle + hall to mandap) |

---

## Pending Tasks (picked up mid-session — continue from here)
1. **Remove all walls** — Hall side walls (left/right), back wall, front segment walls, aisle walls. This is an OPEN outdoor/open-air temple. Only floor, pillars, ceiling remain.
2. **Carpet** — Single continuous carpet from aisle entrance all the way to the mandap (closing the gap). Width ~2.6 units. Deep red color to complement saree.
3. **Shorten aisle jasmine** — Currently hanging garlands are too long. Shorten to ~¼ of pillar height (pillar height = 9 units, so garlands should be ~2.25 units long from top).
4. **GitHub Pages index.html** — Add `index.html` redirect so the root URL forwards to `temple_3d.html` automatically.

---

## Technical Notes
- **Three.js version:** r150.0 loaded as global UMD script via CDN (jsdelivr → unpkg fallback)
- **OrbitControls:** Inlined as `SimpleOrbitControls` — NO CDN dependency for controls
- **No ES modules, no importmap** — pure script tags for maximum corporate browser compatibility
- **Instanced meshes** used for: jasmine, roses, marigolds, fairy lights (performance)
- All scene code is inside `buildScene()` function in `temple_3d.html`

---

## Key Variables in temple_3d.html
```
HALL_W   = 28      // main hall width
HALL_H   = 11      // main hall ceiling height
AISLE_H  = 9       // aisle ceiling height
MANDAP_CZ = -22    // mandap centre Z position
```

## How to Work on This
1. Edit `temple_3d.html` directly
2. Open in Chrome/Edge to test
3. Commit and push to GitHub:
   ```
   git add temple_3d.html
   git commit -m "your message"
   git push
   ```
