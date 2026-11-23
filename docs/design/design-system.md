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

The public site and Payload admin now share the **eight user-supplied brand
colours**. The public canvas is the requested warm paper (`#F5F0EA`). The
hex values and background choice are user-specified; token names, roles and the
category/accent pairings are inferred implementation choices, not confirmed
assignments. Pure white is retained only for elevated controls and inverse text;
accessible darker shades are derived from the bright blue and coral where text
contrast requires them.

| Token | Hex | Contrast / use |
| --- | --- | --- |
| `--hg-ink` (`--hg-navy`) | `#210516` | 16.88:1 on paper · headings, body text, dark surfaces |
| `--hg-paper` (`--hg-canvas`) | `#F5F0EA` | Site/admin canvas and light surfaces |
| `--hg-blue-grey` (`--hg-steel`) | `#5E7993` | 4.00:1 on paper · graphic accents, lines, borders |
| `--hg-earth` | `#78510F` | 6.21:1 on paper · accessible muted text and warm details |
| `--hg-stone` (`--hg-neutral`) | `#BCB0B1` | 1.86:1 on paper · quiet borders and decorative marks, not small text |
| `--hg-gold` | `#CBAF35` | 8.86:1 on ink · warm graphic accents |
| `--hg-cyan` | `#0393CD` | 3.06:1 on paper · bright blue graphics and large marks |
| `--hg-coral` | `#F53F1D` | 3.30:1 on paper · vivid graphic accents and destination markers |
| `--hg-white` (`--hg-surface`) | `#FFFFFF` | Elevated cards, tables, inputs and inverse text |

### Accessible and semantic aliases

The two bright brand colours are not used for ordinary small text on paper.
`--hg-blue` (`#0A709F`) is the AA blue for links, focus and white-label primary
actions (4.84:1 on paper, 5.48:1 on white). `--hg-red` (`#C0301B`) is the
darker coral for small text and white-label destructive controls (5.04:1 on
paper, 5.71:1 on white). `--hg-steel-muted` (`#6D859C`) is reserved for small
copy on the ink sidebar (5.00:1).

Components reference intent rather than raw tokens:
- **Surfaces:** `--hg-bg-app`, `--hg-bg-surface`, `--hg-bg-subtle`, `--hg-bg-inset`, `--hg-bg-hover`, `--hg-bg-selected`
- **Borders:** `--hg-border`, `--hg-border-strong`, `--hg-border-accent`, `--hg-border-focus`
- **Text:** `--hg-text`, `--hg-text-secondary`, `--hg-text-muted`, `--hg-text-disabled`, `--hg-text-inverse`, `--hg-text-link`
- **Actions:** `--hg-primary`, `--hg-primary-hover`, `--hg-primary-active`, `--hg-primary-soft`, `--hg-primary-soft-border`
- **Sidebar rail:** `--hg-rail-bg`, `--hg-rail-border`, `--hg-rail-input-bg`, `--hg-rail-hover`, `--hg-rail-text`, `--hg-rail-text-muted`, `--hg-rail-active-bg`, `--hg-rail-active-text`
- **States:** success uses accessible blue/blue-grey; warning uses earth/gold; danger uses dark coral; info uses blue-grey/ink.

All Payload `--theme-*` and `--color-*` scales (`base`, `elevation`, `success`,
`warning`, `error`, `info`) map to the shared palette or its documented
contrast-safe derivatives so Payload controls do not introduce unrelated hues.

## 2. Typography

One family: **Inter** (variable, self-hosted via `@fontsource-variable/inter`),
with a system sans-serif fallback. Monospace is reserved for code fields.

| Token | Size | Use |
| --- | --- | --- |
| `--hg-fs-12` | 12px | metadata, table headers, helper + error text, badges |
| `--hg-fs-14` | 14px | body, labels, buttons, inputs, table cells |
| `--hg-fs-16` | 16px | card / section titles |
| `--hg-fs-18` | 18px | reserved for large panels |
| `--hg-fs-20` | 20px | reserved for page titles on wide screens |
| `--hg-fs-24` | 24px | page + view titles |
| `--hg-fs-30` | 30px | statistic values, sign-in headline |

Weights: `400` body, `500` labels / table cells / buttons, `600` headings,
table headers, active nav item, values. **Maximum two weights per component.**

Line height: `--hg-lh-tight` 1.25 (headings), `--hg-lh-snug` 1.4 (controls,
tables), `--hg-lh-normal` 1.6 (prose).

---

## 3. Spacing, radii, elevation

Spacing is a strict 4px grid: `--hg-space-1` 4, `-2` 8, `-3` 12, `-4` 16,
`-5` 24, `-6` 32, `-7` 48.

Radii: `--hg-radius-control` 7px (inputs, buttons, small controls),
`--hg-radius-card` 10px (cards, tables, modals, drawers), `--hg-radius-pill`
999px (status badges, avatars).

Elevation: three neutral shadows tinted from `#210516` — `--hg-shadow-sm`,
`--hg-shadow-md`, `--hg-shadow-lg`. No glows or gradients anywhere.

Layout constants: sidebar `260px`, top bar `56px`, sticky document offset
`124px`, content max width `1200px`, page padding `32px` (24px on tablet, 16px
on mobile), control heights `32 / 40 / 48px`, table row `52px`, icon size
`18px` at 1.75 stroke.

---

## 4. Component standards

### Sidebar and top bar

A fixed `#210516` sidebar with grouped `#5E7993` section labels, a clean 40px
filter bar, `#F5F0EA` navigation items, a solid `#0A709F` active state and a
pinned account footer with `#C0301B` sign-out hover. The top bar is 56px,
`#FFFFFF`, sticky, holding breadcrumbs on the left and account access on the
right without trailing gradient masks. When the sidebar is collapsed on desktop
or tablet, the reopen toggle reserves dedicated inline-start space so it never
overlaps the breadcrumb home icon.

### Search and list controls

Collection list toolbars (`.list-controls`) render chromeless directly on the
`#F5F0EA` canvas above `.table-wrap` to avoid nested card clutter. `.search-bar`
allocates a dedicated 40px leading icon slot matching `.search-filter__input`'s
inline-start padding so `.icon--search` never collides with input text, while
`Columns` and `Filters` triggers share the same 40px control height and expand
into standalone `#FFFFFF` cards below.

### Tables and pagination

One `.table-wrap` card with a sticky `#F5F0EA` header (`#78510F` uppercase
12px/600), 52px rows, hairline dividers, `#F5F0EA` row hover and `#5E7993`
soft selection wash. Pagination, item counts and per-page controls share one
unified `.page-controls` footer card.

### Document action bar and the Publish button

The `.doc-controls` bar holds status, timestamps, `View live page`,
`Expand preview`, the Publish action and the dot menu — all 32px tall, all on
one line. It is deliberately **not** sticky (Payload's default pins it under the
top bar): it reads as the head of the form and scrolls away with it.

Publish is the only control with a solid `#0A709F` fill; it settles to `#210516`
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

Inputs and `react-select` controls sit at 40px on `#FFFFFF` with `#5E7993`
hover borders and `#0A709F` focus rings (internal `.rs__input` elements stay
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
3. **One primary action per section.** Primary buttons use `#0A709F` and settle
   to `#210516` on hover; destructive confirmations use `#C0301B`.
4. **No nested box clutter.** Toolbars and array headers stay flat when adjacent
   to bordered cards.
5. **Contrast and accessibility:** every interactive element keeps a visible
   `:focus-visible` outline and legible contrast across light and dark surfaces.
