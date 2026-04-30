# DESIGN.md — QuestLog Design Language

> "Ferrari structure, every palette." Architecture and hierarchy borrowed from
> Ferrari's brand system (ferrari.com, Ferrari Design Centre, official livery
> kits). Colours stay theme-driven — Dark, Light, Gold, Retro, Neon, Forest,
> Blood, Sunset, Mint, Monochrome, Royal, Ocean, Gamer.

---

## Principles

1. **Sculpted, not boxed.** No card-shaped containers. Sections are defined by
   space, alignment and a single hairline rule — never by a coloured panel.
2. **One accent, used decisively.** The theme's `--accent` is the equivalent of
   Ferrari Red: it appears only on indicators, primary CTAs, KPI digits, and
   accent stripes. Never as a background fill behind a paragraph.
3. **Italic display, technical labels.** Headlines lean into a display italic
   for emotional weight; supporting labels are tight uppercase tracking with
   mono numerics for technical voice.
4. **Information as a dashboard.** Every screen reads like an instrument
   cluster: large primary metric, secondary metrics in mono, then prose.
5. **Cinematic horizontals.** The hero/title block on every section spans the
   full content width with a clear horizon line and breathing room above and
   below.

---

## Type System

| Role               | Family                     | Weight | Case          | Tracking |
|--------------------|----------------------------|--------|---------------|----------|
| Display headline   | Inter / Motiva (italic)    | 800    | Title Case    | -1.5px   |
| Section title      | Inter                      | 700    | UPPERCASE     | 2.0px    |
| Eyebrow / label    | Inter                      | 500    | UPPERCASE     | 3.0px    |
| Body               | Inter                      | 400    | Sentence case | 0        |
| KPI digit          | JetBrains Mono             | 500    | —             | -1px     |
| Plate / spec value | JetBrains Mono             | 600    | UPPERCASE     | 1px      |

Sizes follow a 1.25 ratio: 11 / 13 / 16 / 20 / 28 / 40 / 56.

---

## Layout

- **Grid:** 12 columns, 1320px max, 32px gutter on desktop, 16px on mobile.
- **Section rhythm:** every section is a "zone" — eyebrow label, big italic
  headline, optional 1-line strapline, then content. 80px vertical padding
  between zones on desktop (`56px` mobile).
- **Horizon rule:** zones are separated by a single 1px hairline at
  `rgba(255,255,255,0.06)` (light theme: `rgba(0,0,0,0.08)`). Never two rules
  stacked; never a full panel.
- **Asymmetry:** title block aligns to a 6/12 column slot; KPI grids align to
  the right 6 columns. Echoes Ferrari's editorial pages where the headline is
  pushed off-axis against the data.

---

## Components

### Hero zone
```
[ EYEBROW LABEL · TINY ]
Big Italic Headline
Optional one-line strapline.
─────────────────────────────────────────────  (hairline, full width)
```

### Metric block (replaces stat-card)
```
INSTRUMENT LABEL
1,234              ← mono digit, var(--text), -1px tracking, 56px
delta · 7d         ← mono micro-text, var(--accent)
```
No box. 2px left rule in `--accent` only when grouped horizontally as a
"cluster" of metrics.

### Action button
- **Primary:** filled `--accent`, label uppercase tracked 1.5px, 12px font.
  Height 40px, sharp corners (radius 0). Only one primary per zone.
- **Outline:** 1px border `rgba(255,255,255,0.18)`, transparent fill, same
  type. Used for everything secondary.
- **Ghost text-link:** `--accent` text + 1px underline on hover. No background.

### Spec plate
Used for game metadata (price, hours, achievements). Mono-numeric,
uppercase label, separated by a vertical hairline:

```
PRICE | £19.99    HOURS | 142.3    ACH | 87 / 142
```

### Game tile
- 3:4 aspect cover image, 0 radius, no border.
- Below image: title in 14px Inter 600, 1 line of metadata in 11px mono uppercase.
- Hover: image scales to 1.02 + image desaturates 0%→0%, label gains accent underline.
  No box, no shadow, no overlay.

### Section index (sub-tabs)
- Plain uppercase text, 13px, 700 weight, 1px tracking.
- Active = `--accent` colour + 2px bottom rule.
- Inactive = `--dim` colour, no rule.
- Spaced 28px apart. No pills, no fills.

### Nav header
- 56px tall, deep `--bg-deep` fill (already in tokens), single hairline below.
- Logo: brand mark + wordmark in 16px tracked uppercase 700.
- Tabs: 13px uppercase tracked tabs, 2px accent underline on active.
- User cluster: avatar (32px circle) · name in 13px · primary CTA (Disconnect).

### Stripe motif
Ferrari uses a thin accent stripe under section headers. We do the same:
a 2px × 60px bar in `--accent` sitting flush-left under the headline,
*not* a full hairline. Optional — only on hero zones, not in dense lists.

---

## Motion

- **Hover:** 120ms ease-out. Colour and underline only — no transforms larger
  than `translateY(-1px)`.
- **Page transitions:** none. Content swaps instantly.
- **Skeleton loaders:** 1px hairline placeholder rows, no shimmer.

---

## What's Out

- Card containers with backgrounds (`background:var(--panel)`)
- Multiple borders stacked
- Drop shadows on content (only on transient floats — dropdowns, modals)
- Gradients that aren't on the primary CTA
- Decorative emoji
- Rounded pill buttons or pill nav-tabs
- Centered alignment except on the landing hero
- Filler "AI dashboard" decorations: avatars in coloured circles, fake graphs,
  example data in faint text

---

## Color Application Rules (palette-agnostic)

Each theme exposes:
- `--bg`, `--bg-deep`, `--panel`, `--panel2` (used only for nav fill, dropdowns, modals)
- `--accent`, `--accent2` (only on indicators, CTAs, hover states)
- `--text`, `--dim` (body text and labels)
- `--border` (single hairline rule colour)

The structural CSS uses **only these tokens**. A theme switch never breaks
layout or hierarchy — it just re-tints the same Ferrari skeleton.

---

## File Structure (CSS)

Inside `questlog.html` `<style>`:

1. `/* tokens */` — variable defaults (already exists at top of file)
2. `/* layout primitives */` — grid, hero zones, hairlines, spacing
3. `/* components */` — `.metric`, `.spec`, `.tile`, `.btn`, `.subtabs`, `.nav`
4. `/* page-specific overrides */` — minimal, only when a tab needs a tweak
5. `/* theme-mode hooks */` — only the `gamer` mode swaps fonts (Motiva Sans);
   everything else inherits the same skeleton.

Inline `style=""` is forbidden for layout. Allowed only for:
- Background images on tiles (cover URLs)
- Display toggles (`display:none/block`) set by JS

---

## Roll-out Plan

1. Land this file. (now)
2. Refactor `nav` and `.section-head` to the spec.
3. Replace `.stat-card` rules with `.metric` + cluster wrapper.
4. Drop `.sidebar-card` boxes — convert call-sites to plain blocks with the
   hero-zone pattern.
5. Repaint buttons: keep one primary per zone.
6. Convert game grids to the new tile spec.
7. Sweep inline `style="background:var(--panel)..."` and replace with class.
8. Validate every theme renders correctly (Dark, Light, Gamer first).

Each step is a separate commit. Don't refactor and theme-tune in the same
commit.
