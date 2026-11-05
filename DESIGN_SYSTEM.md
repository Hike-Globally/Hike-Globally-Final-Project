# Admin Design System

The Hike Globally admin panel (Payload CMS at `/admin`) is styled from **one**
file of design tokens. This document explains those tokens and the component
standards built on top of them, so future changes stay consistent instead of
drifting page by page.

| Where | What |
| --- | --- |
| `src/app/(payload)/admin-theme.css` | **The single source of truth.** Palette, type, spacing, radii, shadows, layout constants, and the mapping onto Payload's own CSS variables. |
| `src/app/(payload)/custom.scss` | Component styles only. Every value is a `var(--hg-*)` token; there are no literal colours, type sizes or shadows in it. |
| `src/components/admin/*` | Bespoke admin UI (sidebar, dashboard, login, calendar). Consumes the same tokens through the class names documented below. |

Nothing outside `admin-theme.css` may introduce a new colour, font size,
spacing step, radius or shadow. If a screen seems to need one, it needs a
different layout, not a new value.

---

## 1. Colour

### Primary — brand navy-teal

One primary colour, ten shades. `#1D3557` (the storefront brand ink) is shade
800.

| Token | Hex | Use |
| --- | --- | --- |
| `--hg-primary-50` | `#F2F6FA` | active nav background, subtle accent surface |
| `--hg-primary-100` | `#E3EBF4` | accent hover wash |
| `--hg-primary-200` | `#C6D7E8` | accent border |
| `--hg-primary-300` | `#9DB9D5` | accent border (strong) |
| `--hg-primary-400` | `#7095BD` | decorative accent icon |
| `--hg-primary-500` | `#4D76A2` | focus ring / outline |
| `--hg-primary-600` | `#2F5480` | **primary buttons**, active rail icon |
| `--hg-primary-700` | `#234568` | button hover, links, active nav text |
| `--hg-primary-800` | `#1D3557` | brand ink |
| `--hg-primary-900` | `#142640` | pressed / deepest |

White on `--hg-primary-600` is 7.9:1, and `--hg-primary-700` on white is 9.9:1 —
both comfortably AAA for body text.

### Neutral — cool gray

| Token | Hex | Use |
| --- | --- | --- |
| `--hg-gray-0` | `#FFFFFF` | surfaces (cards, tables, sidebar, top bar) |
| `--hg-gray-25` | `#FCFDFE` | reserved (alt surface) |
| `--hg-gray-50` | `#F7F9FA` | app canvas, table header, subtle fill |
| `--hg-gray-100` | `#F1F4F6` | hover wash, inset surface |
| `--hg-gray-200` | `#E6EBF0` | default border / divider |
| `--hg-gray-300` | `#D7DEE6` | strong border (inputs) |
| `--hg-gray-400` | `#B3BEC9` | disabled border, decorative icon |
| `--hg-gray-500` | `#8A96A4` | disabled text only |
| `--hg-gray-600` | `#667081` | muted text — 5.0:1 on white |
| `--hg-gray-700` | `#4D5866` | secondary text — 7.5:1 on white |
| `--hg-gray-800` | `#333C47` | strong secondary text |
| `--hg-gray-900` | `#1B2430` | primary text — 15.8:1 on white |

### Semantic — four families, no more

Each family has a light surface, a border and a strong text shade that is AA on
that surface. Solid shades exist only for toasts and destructive buttons.

| Family | Surface | Border | Text | Text contrast |
| --- | --- | --- | --- | --- |
| Success | `--hg-success-bg` `#ECFDF3` | `#ABEFC6` | `#067647` | 5.0:1 |
| Warning | `--hg-warning-bg` `#FFFAEB` | `#FEDF89` | `#B54708` | 4.9:1 |
| Danger | `--hg-danger-bg` `#FEF3F2` | `#FECDCA` | `#B42318` | 5.4:1 |
| Info | `--hg-info-bg` `#EFF8FF` | `#B2DDFF` | `#175CD3` | 5.0:1 |

The storefront's amber accent (`#F7A230`) is **not** an admin colour. It is
folded into `warning`, where it carries meaning (draft, needs attention)
instead of decoration.

### Semantic aliases

Components reference intent, not shades: `--hg-bg-app`, `--hg-bg-surface`,
`--hg-bg-subtle`, `--hg-bg-inset`, `--hg-bg-hover`, `--hg-border`,
`--hg-border-strong`, `--hg-text`, `--hg-text-secondary`, `--hg-text-muted`,
`--hg-text-disabled`, `--hg-primary`, `--hg-primary-hover`, `--hg-primary-soft`.

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

Text hierarchy: page title (24/600) → panel title (16/600) → field label
(14/500) → body (14/400) → metadata (12/400 muted).

---

## 3. Spacing, radii, elevation

Spacing is a strict 4px grid: `--hg-space-1` 4, `-2` 8, `-3` 12, `-4` 16,
`-5` 24, `-6` 32, `-7` 48. There are no other spacing values in the admin.

Radii: `--hg-radius-control` 6px (inputs, buttons, small controls),
`--hg-radius-card` 10px (cards, tables, modals, drawers), `--hg-radius-pill`
999px (status badges, avatars).

Elevation: three neutral shadows only — `--hg-shadow-sm`, `--hg-shadow-md`,
`--hg-shadow-lg`. No coloured shadows, glows or gradients anywhere.

Layout constants: sidebar `260px`, top bar `56px`, content max width `1200px`,
page padding `32px` (24px on tablet, 16px on mobile), control heights `32 / 40 /
48px`, table row `52px`, icon size `18px` at 1.75 stroke.

The only raw pixel values left in the stylesheet are 1px hairlines, 2–3px dots,
and CSS breakpoints (1280 / 1024 / 768 / 480) — structural, not stylistic.

---

## 4. Component standards

### Page structure

Every view uses the same frame: **page header** (title left, one primary action
right) → optional **filter bar** → **content**. Content is capped at 1200px and
centred. List, edit, global and dashboard views share this frame.

### Buttons

`.btn` + one variant + optional size.

| Variant | Class | Notes |
| --- | --- | --- |
| Primary | `.btn--style-primary` | one per section, the page's main action |
| Secondary (outline) | `.btn--style-secondary` | the default for everything else |
| Subtle | `.btn--style-subtle` | tinted toolbar actions |
| Ghost | `.btn--style-none`, `.btn--style-icon-label` | inline/icon actions |
| Dashed | `.btn--style-dashed` | "add row" affordances |
| Danger | `.confirmation-modal.delete-document .btn--style-primary` | the delete confirmation; the only red fill in the panel |

Sizes `--size-small` 32px, default 40px, `--size-large` 48px. Hover, focus
(2px outline + offset), active, disabled and loading (`:disabled`, cursor
`progress`) states are defined once. Icon-only buttons are square and use the
same heights.

### Tables

One card container (`.table-wrap`) with a sticky, uppercase 12px/600 muted
header on `--hg-bg-subtle`, 52px rows, hairline dividers, a gentle row hover and
a selected-row wash. Text is left aligned; the select/drag columns are fixed
width; the table scrolls horizontally inside its card on narrow screens. Every
list uses the same `.list-controls` filter bar and `.paginator` card.

Status is a semantic pill (`.pill--style-success`, `--style-warning`), and the
dashboard's activity list uses the matching `.hg-badge--published/--draft`.
Interactive pills — the list view's Columns / Filters / view toggles — are
controls, not badges: `.pill--has-action` sets the 32px control height, control
radius and surface background, so they sit level with the other toolbar buttons.

Empty states: `.no-results` card with a centred message. Loading: `.shimmer`
blocks that pulse between 100% and 55% opacity (no gradient sweep).

### Forms

Labels sit above the control at 14px/500 with 4px of space; inputs are 40px with
a 6px radius, a `--hg-gray-300` border, a `--hg-gray-400` hover border and a 3px
`--hg-focus-ring` on focus. Helper text is 12px muted; error text is 12px danger
and pairs with a danger border. Related fields sit in `.collapsible`,
`.array-field`, `.blocks-field` or `.group-field` cards with 16px padding and a
16px heading. Selects (react-select), checkboxes, radios, date pickers and the
upload dropzone all use the same control height and border.

The document action bar (`.doc-controls`) is sticky under the top bar and shows
save / publish / status in one card.

### Other

Badges/pills, banners (four semantic types), popups and menus, modals,
confirmation dialogs, drawers, toasts and tooltips are all defined from the same
tokens in `custom.scss` sections 9 and 11. Icons are Lucide only, 18px at 1.75
stroke (`--hg-icon-size`, `--hg-icon-stroke`).

### Sidebar and top bar

A fixed, white sidebar with a hairline right border, grouped sections
(12px/600 uppercase labels), 40px items with a 6px radius, a soft primary active
state and a pinned account footer with sign-out. The top bar is 56px, white,
sticky, holding breadcrumbs on the left and document actions / the account menu
on the right. Below 1280px the sidebar becomes an overlay drawer; below 768px it
is full-screen.

### Sign-in

Two columns: photography on the left (flat scrim, no gradient), the form on the
right, collapsing to a single column below 900px.

---

## 5. Rules of engagement

1. **Never hard-code** a colour, font size, spacing, radius or shadow. Use a
   token or add one here first.
2. **One primary action per section.** Everything else is secondary or ghost.
3. **Two font weights per component.** Hierarchy comes from size and colour.
4. **No gradients, glows or coloured shadows.**
5. **Shared classes before page-specific ones.** If two screens need the same
   thing, it becomes a component class in `custom.scss`.
6. **Don't restyle a single page.** Fix the class so every page improves.
7. **Contrast is not optional.** Any new text pairing must be ≥ 4.5:1 on its
   background; run it through a checker before committing.
8. **Accessibility:** every interactive element keeps a visible
   `:focus-visible` outline, icon-only buttons keep an `aria-label`, and state is
   never conveyed by colour alone.

## 6. Extending the system

- New shared surface → add a `.hg-*` block to section 11 of `custom.scss`.
- New Payload element to theme → map it through the Payload bridge at the bottom
  of `admin-theme.css` first; only write a selector if the variables cannot
  express it.
- Changing the brand colour → edit the primary ramp in `admin-theme.css` and
  nothing else. Buttons, links, focus rings, active nav and the calendar all
  follow.
