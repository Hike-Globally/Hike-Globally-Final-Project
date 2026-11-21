import { PLACE_CATEGORY_VALUES, type PlaceCategoryValue } from './place-categories'

/**
 * ============================================================================
 * Place themes — the editorial and visual identity of each category page
 * ============================================================================
 *
 * `place-categories.ts` stays the single source of truth for URLs, labels and
 * the CMS multi-select. This file is its design-side sibling: for each of the
 * nine `/places/<category>` pages it carries the themed accent set, the field
 * quote used by the full-bleed interlude, and the three quick facts under the
 * editorial intro. One object per category, keyed by the stable slug, so the
 * page, the contrast test and the translation dictionaries all agree.
 *
 * ACCENT COLOURS — every value is a stated mix of the six locked palette
 * colours (see the palette note in `src/app/(frontend)/globals.css`), and each
 * step is audited by `src/lib/place-themes.test.ts`:
 *
 *   --place-accent      graphic/large role — rules, chapter numerals, glyph
 *                       strokes, hairlines. ≥ 3:1 on paper, mist, the tinted
 *                       band and the wash panel (WCAG 1.4.11 / 1.4.3-large).
 *   --place-accent-ink  small-text role — themed eyebrows, fact labels, hover
 *                       text. ≥ 4.5:1 on every light background it sits on.
 *   --place-accent-lt   on-dark role — hero and interlude marks. ≥ 3:1 against
 *                       navy (`ink`) and against the hero-foot composite
 *                       (ink wash + photo scrim, `#20384a`). Small copy on a
 *                       photograph always stays `mist`/white, never accent.
 *   --place-accent-wash the light panel tint behind ink text (≥ 11:1).
 *
 * The CSS custom properties are published by `placeThemeStyle()` and consumed
 * in `src/app/(frontend)/places/places.css`; nothing outside a place page can
 * see them.
 */

export type PlaceFact = {
  /** Short uppercase label, e.g. `Signature`. */
  label: string
  /** One editorial line, ideally under six words. */
  value: string
}

export type PlaceTheme = {
  /** Graphic role — ≥ 3:1 on every light surface it touches. */
  accent: string
  /** Small-text role — ≥ 4.5:1 on every light surface it touches. */
  accentInk: string
  /** On-dark role — ≥ 3:1 against navy and the hero-foot composite. */
  accentLt: string
  /** Panel tint behind ink copy. */
  accentWash: string
  /** Pull quote for the full-bleed interlude band. */
  pull: string
  /** Three quick facts rendered under the editorial intro. */
  facts: [PlaceFact, PlaceFact, PlaceFact]
}

export const placeThemes: Record<PlaceCategoryValue, PlaceTheme> = {
  lakes: {
    // deep 65% + haze 35% — glacial steel blue
    accent: '#4589b8',
    accentInk: '#3a749d',
    accentLt: '#4589b8',
    accentWash: '#eef4f9',
    pull: 'Come for the reflection; stay because the water taught you stillness.',
    facts: [
      { label: 'Signature', value: 'Dawn reflections on still water' },
      { label: 'Character', value: 'Quiet, cold and unhurried' },
      { label: 'Best paired with', value: 'A sunrise viewpoint above the shore' },
    ],
  },
  waterfalls: {
    // haze + 25% ink — spray grey-blue
    accent: '#6b8c9f',
    accentInk: '#557487',
    accentLt: '#6b8c9f',
    accentWash: '#f2f5f6',
    pull: 'Follow the sound — the trail already knows where it is going.',
    facts: [
      { label: 'Signature', value: 'Spray-filled river gorges' },
      { label: 'Character', value: 'Wet, green and loud' },
      { label: 'Best paired with', value: 'Trails at full flow after the rains' },
    ],
  },
  'mountain-passes': {
    // slate + 15% ink — wind-scoured stone
    accent: '#6a6767',
    accentInk: '#6a6767',
    accentLt: '#838080',
    accentWash: '#f2f1f1',
    pull: 'One valley behind you, an entire world on the other side.',
    facts: [
      { label: 'Signature', value: 'The moment the far valley opens' },
      { label: 'Character', value: 'Wind, exposure, long views' },
      { label: 'Best paired with', value: 'An extra day to acclimatize' },
    ],
  },
  canyons: {
    // sage 58% + slate 42% — dusty brick
    accent: '#ab615a',
    accentInk: '#9e5d58',
    accentLt: '#b36f69',
    accentWash: '#f7f1f0',
    pull: 'The river wrote it first; the light keeps editing.',
    facts: [
      { label: 'Signature', value: 'Layered walls of warm stone' },
      { label: 'Character', value: 'Dry, bright and deep' },
      { label: 'Best paired with', value: 'Early light, before the heat' },
    ],
  },
  'base-camps': {
    // sage at full strength — the ember of the expedition world
    accent: '#d0564d',
    accentInk: '#b3504c',
    accentLt: '#d25c53',
    accentWash: '#fbf0ef',
    pull: 'Every summit story spends its last quiet night here.',
    facts: [
      { label: 'Signature', value: 'Tents glowing under 8,000ers' },
      { label: 'Character', value: 'Temporary villages with routine' },
      { label: 'Best paired with', value: 'Time to sit with the climbing crews' },
    ],
  },
  caves: {
    // ink + 22% deep — subterranean blue-black
    accent: '#1a405d',
    accentInk: '#1a405d',
    accentLt: '#6b8497',
    accentWash: '#eaeef0',
    pull: 'The mountain keeps its own archive in the dark.',
    facts: [
      { label: 'Signature', value: 'Carved sanctuaries in the dark' },
      { label: 'Character', value: 'Cool, still and story-rich' },
      { label: 'Best paired with', value: 'A guide who knows the lore' },
    ],
  },
  'bike-tours': {
    // deep at full strength — the site's expedition blue, on the road page
    accent: '#2177b5',
    accentInk: '#2173af',
    accentLt: '#3b87be',
    accentWash: '#ebf3f8',
    pull: 'Two wheels double the horizon.',
    facts: [
      { label: 'Signature', value: 'Long descents, no engine' },
      { label: 'Character', value: 'Rhythm, gravel and distance' },
      { label: 'Best paired with', value: 'Spare brake pads and a big appetite' },
    ],
  },
  'mountain-peaks': {
    // ink 62% + slate 38% — cool granite
    accent: '#3d4954',
    accentInk: '#3d4954',
    accentLt: '#7a828a',
    accentWash: '#eeeff0',
    pull: 'It was a line on the map until you had to climb it.',
    facts: [
      { label: 'Signature', value: 'The ridgeline above the clouds' },
      { label: 'Character', value: 'Altitude as architecture' },
      { label: 'Best paired with', value: 'Cold starts and patience' },
    ],
  },
  temples: {
    // btn-accent 65% + sage 35% — saffron rust
    accent: '#c74f3f',
    accentInk: '#b74c3f',
    accentLt: '#cc6051',
    accentWash: '#faefee',
    pull: 'The trail begins where the prayer flags end.',
    facts: [
      { label: 'Signature', value: 'Prayer flags at the trailhead' },
      { label: 'Character', value: 'Living, working, sacred' },
      { label: 'Best paired with', value: 'Festival dates, if you can catch them' },
    ],
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
