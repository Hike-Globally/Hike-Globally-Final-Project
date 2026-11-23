/**
 * ============================================================================
 * Hike Globally brand palette — the JS mirror of the CSS theme tokens
 * ============================================================================
 * `globals.css` owns the palette for CSS. Canvas 2D contexts and SVG `fill`
 * attributes cannot read a CSS custom property, so the eight core colours are
 * repeated here for the globe, rope carousel, difficulty meters and seeded
 * artwork. Every extra shade in this module is mixed from those colours.
 *
 * Keep this palette in sync with `src/app/(frontend)/globals.css`. The exact
 * hex values and the paper background are user-specified; the token names and
 * all roles below are implementation choices, not confirmed assignments:
 *
 *   #F5F0EA  paper     warm site canvas and light surfaces
 *   #210516  ink       headings, copy, dark sections
 *   #5E7993  haze      blue-grey atmosphere and linework
 *   #78510F  earth     warm neutral, rope and text accent
 *   #BCB0B1  stone     quiet neutral and hairlines
 *   #CBAF35  gold      warm graphic accent
 *   #0393CD  blue      bright expedition blue
 *   #F53F1D  coral     vivid warm accent and destination markers
 */

/** The eight locked brand colours, plus white for light-on-dark illustration. */
export const BRAND = {
  paper: '#F5F0EA',
  ink: '#210516',
  haze: '#5E7993',
  earth: '#78510F',
  stone: '#BCB0B1',
  gold: '#CBAF35',
  blue: '#0393CD',
  coral: '#F53F1D',
  white: '#FFFFFF',
} as const

export type BrandColour = (typeof BRAND)[keyof typeof BRAND]

const channel = (hex: string, offset: number): number => parseInt(hex.slice(offset, offset + 2), 16)

/**
 * Mix two brand colours in sRGB — the same maths `color-mix(in srgb, …)` uses
 * in the stylesheets, so a canvas shade and its CSS twin cannot drift apart.
 * `t` is the fraction of `b`: `mixHex(INK, PAPER, 0.3)` lightens ink 30%.
 */
export function mixHex(a: string, b: string, t: number): string {
  const clamp = (value: number) => Math.round(Math.min(255, Math.max(0, value)))
  const mixed = [1, 3, 5].map((offset) =>
    clamp(channel(a, offset) * (1 - t) + channel(b, offset) * t),
  )
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

/** `rgba(r, g, b, a)` for canvas gradients and strokes, from a hex colour. */
export function rgbaOf(hex: string, alpha: number): string {
  return `rgba(${channel(hex, 1)}, ${channel(hex, 3)}, ${channel(hex, 5)}, ${alpha})`
}

/* --- Palette-derived shades used by the globe -----------------------------
   Each shade is a stated mix of the core colours, so the sphere, land dots and
   markers stay in the same palette as the rest of the site. */

/** Ocean: the lit limb steps down to ink at the terminator. */
export const OCEAN_LIT = mixHex(BRAND.ink, BRAND.blue, 0.45)
export const OCEAN_MID = mixHex(BRAND.ink, BRAND.blue, 0.26)
export const OCEAN_DEEP = mixHex(BRAND.ink, BRAND.blue, 0.11)

/** Land dots: white cooled with haze, bright enough to read on the ocean. */
export const LAND_DOT = mixHex(BRAND.white, BRAND.haze, 0.3)

/** Destination pins: coral lifted with white until they clear the dark water. */
export const PIN = mixHex(BRAND.coral, BRAND.white, 0.55)
export const PIN_CORE = mixHex(BRAND.coral, BRAND.white, 0.78)

/** The rope illustration: earth, its highlight and its shadow. */
export const ROPE = BRAND.earth
export const ROPE_WRAP = mixHex(BRAND.white, BRAND.earth, 0.4)
export const ROPE_SHADOW = mixHex(BRAND.earth, BRAND.ink, 0.3)
