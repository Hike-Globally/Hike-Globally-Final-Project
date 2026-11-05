/**
 * ============================================================================
 * Brand colours for canvases and inline SVG — the JS mirror of the CSS tokens
 * ============================================================================
 * `globals.css` owns the palette for everything styled with CSS. A `<canvas>`
 * 2D context and an SVG `fill` attribute cannot read a CSS custom property, so
 * the six locked brand colours are repeated here — once, in one module — and
 * every other shade used by the globe, the rope carousel and the difficulty
 * meters is *derived* from them with `mixHex()` rather than written down.
 *
 * If a colour in the CSS tokens changes, change it here too; nothing else in
 * the codebase is allowed to carry a hex literal.
 *
 *   #183144  ink    deep navy       — headings, dark sections, the ocean
 *   #F6F6F6  mist   paper           — quiet fills, copy on dark
 *   #87AABD  haze   haze blue       — illustration, atmosphere, graphics
 *   #79706D  slate  warm taupe      — meta copy, hairlines, the rope
 *   #2177B5  deep   expedition blue — links, interactive states, lit water
 *   #D0564D  sage   ember           — the one warm accent: pins, markers
 */

/** The six locked brand colours, plus the white page they sit on. */
export const BRAND = {
  ink: '#183144',
  mist: '#F6F6F6',
  haze: '#87AABD',
  slate: '#79706D',
  deep: '#2177B5',
  sage: '#D0564D',
  white: '#FFFFFF',
} as const

export type BrandColour = (typeof BRAND)[keyof typeof BRAND]

const channel = (hex: string, offset: number): number => parseInt(hex.slice(offset, offset + 2), 16)

/**
 * Mix two brand colours in sRGB — the same maths `color-mix(in srgb, …)` uses
 * in the stylesheets, so a canvas shade and its CSS twin cannot drift apart.
 * `t` is the fraction of `b`: `mixHex(INK, WHITE, 0.3)` is ink lightened 30%.
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

/* --- Derived shades used by the globe ------------------------------------
   Each one is a stated mix of two brand colours, so the sphere is painted in
   the palette rather than in a fourth blue somebody picked once. */

/** Ocean: the lit limb steps down to plain ink at the terminator. */
export const OCEAN_LIT = mixHex(BRAND.ink, BRAND.deep, 0.45)
export const OCEAN_MID = mixHex(BRAND.ink, BRAND.deep, 0.26)
export const OCEAN_DEEP = mixHex(BRAND.ink, BRAND.deep, 0.11)

/** Land dots: paper cooled with haze, bright enough to read on the ocean. */
export const LAND_DOT = mixHex(BRAND.white, BRAND.haze, 0.3)

/** Destination pins: ember lifted with white until it clears 4.5:1 on water. */
export const PIN = mixHex(BRAND.sage, BRAND.white, 0.55)
export const PIN_CORE = mixHex(BRAND.sage, BRAND.white, 0.78)

/** The rope illustration: taupe, its highlight and its shadow. */
export const ROPE = BRAND.slate
export const ROPE_WRAP = mixHex(BRAND.white, BRAND.slate, 0.4)
export const ROPE_SHADOW = mixHex(BRAND.slate, BRAND.ink, 0.3)
