# Admin Design System

The Hike Globally admin panel (Payload CMS at `/admin`) is styled from **one**
file of design tokens. This document explains those tokens and the component
standards built on top of them, so future changes stay consistent instead of
drifting page by page.

| Where | What |
| --- | --- |
| `src/app/(payload)/admin-theme.css` | **The single source of truth.** Palette, type, spacing, radii, shadows, layout constants, and the mapping onto Payload's own CSS variables. |
| `src/app/(payload)/custom.scss` | Component styles only. Every value is a `var(--hg-*)` token; there are no literal colours, gradients, type sizes or shadows in it. |
| `src/components/admin/*` | Bespoke admin UI (sidebar, dashboard, login, calendar). Consumes the same tokens through the class names documented below. |

Nothing outside `admin-theme.css` may introduce a new colour, font size,
spacing step, radius or shadow.

---

## 1. Colour

Strictly flat, single colours — **no gradients** and **no secondary palettes**.
Every surface, border, icon, control and status state is derived from the
eight-colour brand palette. The workspace background is pure `#FFFFFF`; cards
separate from it with hairline borders and shadows, and `#F6F6F6` is reserved
for subtle fills (table headers, hover, inset fields).

### Core eight-colour palette

| Token | Hex | Contrast | Role |
| --- | --- | --- | --- |
| `--hg-navy` | `#01161E` | 18.51:1 on `#FFFFFF` · 17.13:1 on `#F6F6F6` | Sidebar rail surface, primary headings & body ink, button hover/active anchor, sign-in backdrop |
| `--hg-canvas` | `#F6F6F6` | 17.13:1 on `#01161E` | Subtle fills: table headers, collapsible headers, hover, inset fields, sidebar rail text |
| `--hg-steel` | `#87AABD` | 7.50:1 on `#01161E` | Sidebar muted labels & icons, hover/accent borders, soft selection & span highlights |
| `--hg-stone` | `#79706D` | 4.83:1 on `#FFFFFF` | Secondary/muted metadata, table column headers, helper text, neutral icons, draft status |
| `--hg-blue` | `#2177B5` | 4.80:1 with `#FFFFFF` | Primary CTA buttons, active sidebar item, active tab underline, links, focus border, checkboxes, row hover wash, published status |
| `--hg-red` | `#C24B38` | 4.82:1 on `#FFFFFF` | Destructive text & solid fills: delete confirmation, validation errors, required marker, error banners/toasts, sign-out hover |
| Ember wash | `#D0564D` | Decorative only (4.10:1) | Danger background/border/ring tints (`rgb(208 86 77 / …)`) — never small text |
| `--hg-surface` | `#FFFFFF` | Elevated surface | Cards, tables, top bar, form inputs, popups, modals, drawers |

### Semantic aliases

Components reference intent rather than raw tokens:
- **Surfaces:** `--hg-bg-app`, `--hg-bg-surface`, `--hg-bg-subtle`, `--hg-bg-inset`, `--hg-bg-hover`, `--hg-bg-row-hover`, `--hg-bg-selected`
- **Borders:** `--hg-border`, `--hg-border-strong`, `--hg-border-accent`, `--hg-border-focus`
- **Text:** `--hg-text`, `--hg-text-secondary`, `--hg-text-muted`, `--hg-text-disabled`, `--hg-text-inverse`, `--hg-text-link`
- **Actions:** `--hg-primary`, `--hg-primary-hover`, `--hg-primary-active`, `--hg-primary-soft`, `--hg-primary-soft-border`
- **Sidebar rail:** `--hg-rail-bg`, `--hg-rail-border`, `--hg-rail-input-bg`, `--hg-rail-hover`, `--hg-rail-text`, `--hg-rail-text-muted`, `--hg-rail-active-bg`, `--hg-rail-active-text`
- **States:** `success` (`#2177B5` / `#87AABD`), `warning` (`#79706D` / `#F6F6F6`), `danger` (`#C24B38` text/solids, `#D0564D` washes), `info` (`#87AABD` / `#01161E`)

All Payload `--theme-*` and `--color-*` scales (`base`, `elevation`, `success`,
`warning`, `error`, `info`) map directly onto these tokens so no outside hues
leak into built-in Payload controls.

---

## 2. Typography

One family: **Inter** (variable, self-hosted via `@fontsource-variable/inter`),
with a system sans-serif fallback. Monospace is reserved for code fields.

| Token | Size | Use |
| --- | --- | --- |
| `--hg-fs-12` | 12px | metadata, helper + error text, badges |
| `--hg-fs-14` | 14px | body, labels, buttons, inputs, table headers |
| `--hg-fs-16` | 16px | card / section titles, table cells |
| `--hg-fs-18` | 18px | reserved for large panels |
| `--hg-fs-20` | 20px | reserved for page titles on wide screens |
| `--hg-fs-24` | 24px | page + view titles |
| `--hg-fs-30` | 30px | statistic values, sign-in headline |

Weights: `400` body / table cells, `500` labels / links / buttons, `600`
headings, table headers, active nav item, values. **Maximum two weights per
component.**

Line height: `--hg-lh-tight` 1.25 (headings), `--hg-lh-snug` 1.4 (controls,
tables), `--hg-lh-normal` 1.6 (prose).

---

## 3. Spacing, radii, elevation

Spacing is a strict 4px grid: `--hg-space-1` 4, `-2` 8, `-3` 12, `-4` 16,
`-5` 24, `-6` 32, `-7` 48.

Radii: `--hg-radius-control` 7px (inputs, buttons, small controls),
`--hg-radius-card` 10px (cards, tables, modals, drawers), `--hg-radius-pill`
999px (status badges, avatars).

Elevation: three neutral shadows tinted from `#01161E` — `--hg-shadow-sm`,
`--hg-shadow-md`, `--hg-shadow-lg`. No glows or gradients anywhere.

Layout constants: sidebar `260px`, top bar `56px`, sticky document offset
`124px`, content max width `1200px`, page padding `32px` (24px on tablet, 16px
on mobile), control heights `32 / 40 / 48px`, table row `64px`, icon size
`18px` at 1.75 stroke.

---

## 4. Component standards

### Sidebar and top bar

A fixed `#01161E` sidebar with grouped `#87AABD` section labels, a clean 40px
filter bar, `#F6F6F6` navigation items, a solid `#2177B5` active state and a
pinned account footer with `#C24B38` sign-out hover. The top bar is 56px,
`#FFFFFF`, sticky, holding breadcrumbs on the left and account access on the
right without trailing gradient masks. When the sidebar is collapsed on desktop
or tablet, the reopen toggle reserves dedicated inline-start space so it never
overlaps the breadcrumb home icon.

### Search and list controls

Collection list toolbars (`.list-controls`) render chromeless directly on the
white workspace above `.table-wrap` to avoid nested card clutter. `.search-bar`
allocates a dedicated 40px leading icon slot matching `.search-filter__input`'s
inline-start padding so `.icon--search` never collides with input text, while
`Columns` and `Filters` triggers share the same 40px control height and expand
into standalone `#FFFFFF` cards below.

### Tables and pagination

One `.table-wrap` card with a sticky `#F6F6F6` header (`#79706D` uppercase
14px/600), 64px rows with 16px cells, hairline dividers, a soft cerulean
(`#2177B5` at 5%) row hover and `#87AABD` soft selection wash. Boolean cells
render as neutral pills; pagination, item counts and per-page controls share
one unified `.page-controls` footer card.

### Document action bar and the Publish button

The `.doc-controls` bar holds status, timestamps, `View live page`,
`Expand preview`, the Publish action and the dot menu — all 32px tall, all on
one line. It is deliberately **not** sticky (Payload's default pins it under the
top bar): it reads as the head of the form and scrolls away with it.

Publish is the only control with a solid `#2177B5` fill; it settles to `#01161E`
on hover and press. It carries an upward arrow in a fixed 16px mask slot, set
`--hg-space-2` (8px) from the label, and the label keeps the same 16px inline
padding as the outline buttons beside it, so the four controls read as one row
rather than four different shapes.

Payload renders this action in **two** shapes, and both must be covered:

| Document | DOM |
| --- | --- |
| Localized fields (trips, blog, pages, destinations) — the locale/schedule menu is enabled | `btn--style-primary` / `btn--withPopup` land on a wrapper `<div>`; the real `<button>` inside gets only layout classes, followed by a chevron `.popup-button` |
| No localized fields | a single `<button class="btn btn--style-primary">` |

So the fill, shadow, height and radius belong to `.form-submit > .btn--style-primary`
(the face), while the inner `<button>` and the chevron segment stay transparent
and inherit their colour and typography. The chevron is separated by a 1px
`--hg-primary-seam` hairline, never by a second background colour, and the whole
control lifts 1px on hover. When there is nothing to publish the face keeps its
slot and scale but drops to `--hg-bg-inset` with `--hg-text-disabled` ink.

Three ornament tokens support this and live in `admin-theme.css`:
`--hg-primary-edge` (1px inner highlight along the top edge), `--hg-primary-seam`
(the split seam and the same highlight on hover) and `--hg-primary-raised` (the
chevron wash on hover/focus).

### Forms and editors

Inputs and `react-select` controls sit at 40px on `#FFFFFF` with `#87AABD`
hover borders and `#2177B5` focus rings (internal `.rs__input` elements stay
chromeless). Top-level `group` and `collapsible` sections render as single-border
`#FFFFFF` cards; `array` and `blocks` headers use clean hairline dividers rather
than nested header boxes. Trip-specific short-form Lexical editors use a 144px
minimum editing area so empty fields do not dominate the form, while still
expanding naturally with content. The one sticky element in a document
view, `.document-fields__sidebar-wrap`, offsets cleanly below the top bar alone;
Lexical's `.fixed-toolbar` is pinned `relative` so it never floats into the
writing area.


The two trip audience panels (**Who Is This Trip For** / **… Not For**, class
`hg-trip-audience`) are ordinary collapsible cards with a single accent each:
a 3px leading-edge spine and a 22px glyph chip before the title (masked
check on `--hg-success-bg` / `--hg-success-solid`, masked cross on
`--hg-danger-bg` / `--hg-danger-solid`). Their content area uses `--hg-space-5`
padding because it holds reading copy.
---

## 5. Rules of engagement

1. **Never hard-code** a colour, font size, spacing, radius or shadow in
   `custom.scss` — consume `var(--hg-*)` tokens only.
2. **Single flat colours only.** No gradients, glows or outside colour ramps.
3. **One primary action per section.** Primary buttons use `#2177B5` and settle
   to `#01161E` on hover; destructive confirmations use `#C24B38`.
4. **No nested box clutter.** Toolbars and array headers stay flat when adjacent
   to bordered cards.
5. **Contrast and accessibility:** every interactive element keeps a visible
   `:focus-visible` outline and legible contrast across light and dark surfaces.
