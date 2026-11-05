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
six-colour workspace palette (plus pure `#FFFFFF` for elevated cards and inputs
against the `#F6F6F6` canvas).

### Core six-colour palette

| Token | Hex | Contrast | Role |
| --- | --- | --- | --- |
| `--hg-navy` | `#183144` | 13.45:1 on `#FFFFFF` · 12.44:1 on `#F6F6F6` | Sidebar rail surface, primary headings & body ink, button hover/active anchor, sign-in backdrop |
| `--hg-canvas` | `#F6F6F6` | 12.44:1 on `#183144` | Workspace canvas, table headers, collapsible headers, subtle fills, sidebar rail text |
| `--hg-steel` | `#87AABD` | 5.45:1 on `#183144` | Sidebar muted labels & icons, hover/accent borders, soft selection & span highlights |
| `--hg-stone` | `#79716D` | 4.78:1 on `#FFFFFF` | Secondary/muted metadata, table column headers, helper text, neutral icons, draft status |
| `--hg-blue` | `#2177B5` | 4.80:1 with `#FFFFFF` | Primary CTA buttons, active sidebar item, active tab underline, links, focus border, checkboxes, published status |
| `--hg-red` | `#CF574D` | Destructive / alert | Delete confirmation, validation errors, required marker, error banners/toasts, sign-out hover |
| `--hg-surface` | `#FFFFFF` | Elevated surface | Cards, tables, top bar, form inputs, popups, modals, drawers |

### Semantic aliases

Components reference intent rather than raw tokens:
- **Surfaces:** `--hg-bg-app`, `--hg-bg-surface`, `--hg-bg-subtle`, `--hg-bg-inset`, `--hg-bg-hover`, `--hg-bg-selected`
- **Borders:** `--hg-border`, `--hg-border-strong`, `--hg-border-accent`, `--hg-border-focus`
- **Text:** `--hg-text`, `--hg-text-secondary`, `--hg-text-muted`, `--hg-text-disabled`, `--hg-text-inverse`, `--hg-text-link`
- **Actions:** `--hg-primary`, `--hg-primary-hover`, `--hg-primary-active`, `--hg-primary-soft`, `--hg-primary-soft-border`
- **Sidebar rail:** `--hg-rail-bg`, `--hg-rail-border`, `--hg-rail-input-bg`, `--hg-rail-hover`, `--hg-rail-text`, `--hg-rail-text-muted`, `--hg-rail-active-bg`, `--hg-rail-active-text`
- **States:** `success` (`#2177B5` / `#87AABD`), `warning` (`#79716D` / `#F6F6F6`), `danger` (`#CF574D`), `info` (`#87AABD` / `#183144`)

All Payload `--theme-*` and `--color-*` scales (`base`, `elevation`, `success`,
`warning`, `error`, `info`) map directly onto these tokens so no outside hues
leak into built-in Payload controls.

---

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

Radii: `--hg-radius-control` 6px (inputs, buttons, small controls),
`--hg-radius-card` 10px (cards, tables, modals, drawers), `--hg-radius-pill`
999px (status badges, avatars).

Elevation: three neutral shadows tinted from `#183144` — `--hg-shadow-sm`,
`--hg-shadow-md`, `--hg-shadow-lg`. No glows or gradients anywhere.

Layout constants: sidebar `260px`, top bar `56px`, sticky document offset
`124px`, content max width `1200px`, page padding `32px` (24px on tablet, 16px
on mobile), control heights `32 / 40 / 48px`, table row `52px`, icon size
`18px` at 1.75 stroke.

---

## 4. Component standards

### Sidebar and top bar

A fixed `#183144` sidebar with grouped `#87AABD` section labels, a clean 40px
filter bar, `#F6F6F6` navigation items, a solid `#2177B5` active state and a
pinned account footer with `#CF574D` sign-out hover. The top bar is 56px,
`#FFFFFF`, sticky, holding breadcrumbs on the left and account access on the
right without trailing gradient masks. When the sidebar is collapsed on desktop
or tablet, the reopen toggle reserves dedicated inline-start space so it never
overlaps the breadcrumb home icon.

### Search and list controls

Collection list toolbars (`.list-controls`) render chromeless directly on the
`#F6F6F6` canvas above `.table-wrap` to avoid nested card clutter. `.search-bar`
allocates a dedicated 40px leading icon slot matching `.search-filter__input`'s
inline-start padding so `.icon--search` never collides with input text, while
`Columns` and `Filters` triggers share the same 40px control height and expand
into standalone `#FFFFFF` cards below.

### Tables and pagination

One `.table-wrap` card with a sticky `#F6F6F6` header (`#79716D` uppercase
12px/600), 52px rows, hairline dividers, `#F6F6F6` row hover and `#87AABD`
soft selection wash. Pagination, item counts and per-page controls share one
unified `.page-controls` footer card.

### Document action bar and the Publish button

The sticky `.doc-controls` bar holds status, timestamps, `View live page`,
`Expand preview`, the Publish action and the dot menu — all 32px tall, all on
one line.

Publish is the only control with a solid `#2177B5` fill; it settles to `#183144`
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
expanding naturally with content. Sticky elements
(`.document-fields__sidebar-wrap` and Lexical `.fixed-toolbar`) offset cleanly
below both the top bar and `.doc-controls`.

---

## 5. Rules of engagement

1. **Never hard-code** a colour, font size, spacing, radius or shadow in
   `custom.scss` — consume `var(--hg-*)` tokens only.
2. **Single flat colours only.** No gradients, glows or outside colour ramps.
3. **One primary action per section.** Primary buttons use `#2177B5` and settle
   to `#183144` on hover; destructive confirmations use `#CF574D`.
4. **No nested box clutter.** Toolbars and array headers stay flat when adjacent
   to bordered cards.
5. **Contrast and accessibility:** every interactive element keeps a visible
   `:focus-visible` outline and legible contrast across light and dark surfaces.
