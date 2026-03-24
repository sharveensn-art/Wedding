# Wedding — Darinee & Sharveen

**10 July 2026 · Shree Lakshmi Narayan Mandir, Kuala Lumpur**

---

## Repository Structure

```
Wedding/
├── Wedding-Deco/     ← Decoration planning (temple layout, 3D visualiser)
└── E-Card/           ← Digital wedding invite + RSVP system
```

---

## E-Card (`/E-Card`)

A mobile-friendly digital wedding invitation with a full RSVP and guest management system.

### Features
- Unique invite link per family (`?token=<uuid>`)
- Per-family pax limit (2 or 4)
- Tracks RSVP status: pending / confirmed / declined
- Collects individual attendee names + dietary notes
- RSVP deadline enforcement
- Admin dashboard (password-protected)
  - Add guests one-by-one or bulk upload via CSV / Excel
  - Filter by bride/groom side and RSVP status
  - Assign table numbers
  - Export full guest list to CSV

### Tech Stack
| Layer | Tool |
|---|---|
| Frontend | HTML + CSS + Vanilla JS |
| Database | [Supabase](https://supabase.com) (Postgres) |
| Hosting | Netlify (free) |
| Excel parsing | SheetJS (CDN) |

### Local Setup

1. Clone the repo
2. Copy `E-Card/config.example.js` → `E-Card/config.js`
3. Fill in your Supabase URL and anon key in `config.js`
4. Fill in wedding details (names, date, venue, etc.)
5. Open `E-Card/index.html` in a browser to test

> `config.js` is gitignored — credentials are never committed.

### Admin Dashboard

Open `E-Card/admin.html` and log in with the password set in `config.js`.

---

## Wedding-Deco (`/Wedding-Deco`)

Interactive 3D decoration preview for the Hindu temple ceremony.

| File | Description |
|---|---|
| `temple_3d.html` | Interactive 3D temple scene — orbit, pan, zoom, multiple camera views |
| `decoration_plan.html` | Decoration mood board & written plan |

Open either file in **Chrome or Edge** (requires internet — loads Three.js from CDN).

**Controls:** Left drag — Orbit · Right drag — Pan · Scroll — Zoom · View buttons — preset angles

**Color Theme:** Deep red roses, white jasmine, brass/gold, warm ivory — complement the bride's deep crimson saree.
