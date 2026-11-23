import { PLACE_CATEGORY_VALUES, type PlaceCategoryValue } from './place-categories'

/**
 * ============================================================================
 * Place themes — editorial accents drawn from the eight-colour brand palette
 * ============================================================================
 *
 * `place-categories.ts` stays the single source of truth for URLs, labels and
 * the CMS multi-select. This file is its design-side sibling: for each of the
 * nine `/places/<category>` pages it carries the themed accent set. One object
 * per category, keyed by the stable slug, so the page, contrast audit and
 * translation dictionaries all agree.
 *
 * Every colour below is one of the supplied palette colours or a documented
 * mix of one (see `src/app/(frontend)/globals.css`). The category mappings and
 * roles are inferred, not user-confirmed. The four roles are audited in
 * `src/lib/place-themes.test.ts`:
 *
 *   --place-accent      graphic/large role — rules, chapter numerals, glyph
 *                       strokes and hairlines. ≥ 3:1 on paper, mist, the tinted
 *                       band and the wash panel.
 *   --place-accent-ink  small-text role — themed eyebrows and hover text.
 *                       ≥ 4.5:1 on every light background it sits on.
 *   --place-accent-lt   on-dark role — hero marks. ≥ 3:1 against ink and the
 *                       dark hero-foot composite (`#2E1726`). Small copy on a
 *                       photograph always stays paper/white, never an accent.
 *   --place-accent-wash the light panel tint behind ink text (≥ 11:1).
 *
 * The CSS custom properties are published by `placeThemeStyle()` and consumed
 * in `src/app/(frontend)/places/places.css`; nothing outside a place page can
 * see them.
 */

export type PlaceTheme = {
  /** Graphic role — ≥ 3:1 on every light surface it touches. */
  accent: string
  /** Small-text role — ≥ 4.5:1 on every light surface it touches. */
  accentInk: string
  /** On-dark role — ≥ 3:1 against ink and the hero-foot composite. */
  accentLt: string
  /** Panel tint behind ink copy. */
  accentWash: string
}

export const placeThemes: Record<PlaceCategoryValue, PlaceTheme> = {
  lakes: {
    // Blue-grey on the light plates; the vivid blue marks the ink-washed hero.
    accent: '#5e7993',
    accentInk: '#0e618d',
    accentLt: '#0393cd',
    accentWash: '#d8e5e7',
  },
  waterfalls: {
    // Blue-grey graphic role, earth-toned copy, and a lighter on-dark tint.
    accent: '#5e7993',
    accentInk: '#78510f',
    accentLt: '#6d859c',
    accentWash: '#e2e9e8',
  },
  'mountain-passes': {
    // Earth on light surfaces, with the exact gold as the hero mark.
    accent: '#78510f',
    accentInk: '#78510f',
    accentLt: '#cbaf35',
    accentWash: '#f0e8d4',
  },
  canyons: {
    // Coral graphic role, dark coral for small copy, and the same vivid hero mark.
    accent: '#f53f1d',
    accentInk: '#ab2b1b',
    accentLt: '#f53f1d',
    accentWash: '#f5e7e0',
  },
  'base-camps': {
    // Dark coral on light panels and a paper-lifted coral for the ink hero.
    accent: '#c0301b',
    accentInk: '#ab2b1b',
    accentLt: '#f5745a',
    accentWash: '#f5e4dc',
  },
  caves: {
    // Ink-on-paper, with the palette's stone as the mark on the dark hero.
    accent: '#210516',
    accentInk: '#210516',
    accentLt: '#bcb0b1',
    accentWash: '#ece6e1',
  },
  'bike-tours': {
    // A blue-grey road mark and AA deep-blue copy; gold warms the hero.
    accent: '#5e7993',
    accentInk: '#0e618d',
    accentLt: '#cbaf35',
    accentWash: '#d8e5e7',
  },
  'mountain-peaks': {
    // Blue-grey graphics, earth-toned copy and stone on the ink hero.
    accent: '#5e7993',
    accentInk: '#78510f',
    accentLt: '#bcb0b1',
    accentWash: '#ece6e1',
  },
  temples: {
    // Earth on light surfaces; gold carries the cultural accent on dark.
    accent: '#78510f',
    accentInk: '#78510f',
    accentLt: '#cbaf35',
    accentWash: '#f0e8d4',
  },
}

export const getPlaceTheme = (value: PlaceCategoryValue): PlaceTheme => placeThemes[value]

/** Every theme value, in the canonical category order — used by the audit test. */
export const placeThemesInOrder = PLACE_CATEGORY_VALUES.map((value) => ({
  value,
  theme: placeThemes[value],
}))

/**
 * The CSS custom properties a themed page publishes on its root element.
 * Typed as plain strings so the page can spread them into a style object with
 * a single `as React.CSSProperties` cast.
 */
export const placeThemeStyle = (theme: PlaceTheme): Record<string, string> => ({
  '--place-accent': theme.accent,
  '--place-accent-ink': theme.accentInk,
  '--place-accent-lt': theme.accentLt,
  '--place-accent-wash': theme.accentWash,
})
