/**
 * WCAG 2.2 contrast audit for the shipped palette.
 *
 *   node scripts/design/contrast-check.mjs
 *
 * It reads the real token values out of `src/app/(frontend)/globals.css` — so the
 * check cannot drift from what the site actually renders — then measures every
 * foreground/background pair the design system documents, plus the composites a
 * photograph produces under the shared scrims.
 *
 * Exits non-zero if any pair misses its target, so it can sit in CI.
 *
 * Targets: 4.5:1 for body/label text (AA), 3:1 for large text (24px+) and for
 * non-text graphics and UI boundaries (1.4.3 / 1.4.11).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const css = readFileSync(join(root, 'src/app/(frontend)/globals.css'), 'utf8')

/* -------------------------------------------------------------------------- */
/* Tokens                                                                      */
/* -------------------------------------------------------------------------- */

const tokens = {}
for (const match of css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens[match[1]] = match[2].toLowerCase()
}

const need = (name) => {
  const value = tokens[name]
  if (!value) throw new Error(`token --color-${name} is not defined in globals.css`)
  return value
}

/* -------------------------------------------------------------------------- */
/* Colour maths (sRGB, WCAG relative luminance)                                */
/* -------------------------------------------------------------------------- */

const channel = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

export const contrast = (a, b) => {
  const l1 = luminance(a)
  const l2 = luminance(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/** `mix(a, b, t)` — the JS twin of `color-mix(in srgb, b t%, a)`. */
export const mix = (a, b, t) => {
  const parts = (hex) => {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const [ar, ag, ab] = parts(a)
  const [br, bg, bb] = parts(b)
  const to = (x, y) =>
    Math.round(x * (1 - t) + y * t)
      .toString(16)
      .padStart(2, '0')
  return `#${to(ar, br)}${to(ag, bg)}${to(ab, bb)}`
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

const WHITE = need('paper')
const INK = need('ink')
const PHOTO_LIT = WHITE // worst case: a blown-out sky behind the copy

/** The shared `--scrim-ink` at its heaviest (88% ink over the photograph). */
const SCRIM_88 = mix(PHOTO_LIT, INK, 0.88)
/** The flat navy wash every photographic header carries before the scrim. */
const WASH_72 = mix(PHOTO_LIT, INK, 0.72)
/** Flat wash + scrim at the foot of a hero, where the masthead sits. */
const HERO_FOOT = mix(WASH_72, INK, 0.88)
/** The homepage video plate: `bg-ink/55` plus the shared scrim at the foot. */
const VIDEO_FOOT = mix(mix(PHOTO_LIT, INK, 0.55), INK, 0.88)

/* -------------------------------------------------------------------------- */
/* The audit                                                                   */
/* -------------------------------------------------------------------------- */

const TEXT = 4.5
const LARGE = 3

/** [role, foreground, background, target] */
const pairs = [
  // --- body copy and labels on paper -------------------------------------
  ['running copy on paper', need('ink'), WHITE, TEXT],
  ['prose (ink-80) on paper', need('ink-80'), WHITE, TEXT],
  ['sub-headings (ink-70)', need('ink-70'), WHITE, TEXT],
  ['lead & meta (ink-60)', need('ink-60'), WHITE, TEXT],
  ['eyebrows (slate-80)', need('slate-80'), WHITE, TEXT],
  ['links (deep)', need('deep'), WHITE, TEXT],
  ['link hover (deep-90)', need('deep-90'), WHITE, TEXT],
  ['link active (deep-80)', need('deep-80'), WHITE, TEXT],
  ['ember text (sage-90)', need('sage-90'), WHITE, TEXT],
  ['ember hover (sage-80)', need('sage-80'), WHITE, TEXT],
  ['ember icon (sage)', need('sage'), WHITE, LARGE],
  ['form boundary (slate)', need('slate'), WHITE, LARGE],

  // --- the one tinted band: mist -----------------------------------------
  ['copy on mist band', need('ink'), need('mist'), TEXT],
  ['meta on mist band', need('ink-60'), need('mist'), TEXT],
  ['eyebrow on mist band', need('slate-80'), need('mist'), TEXT],
  ['link on mist band', need('deep-90'), need('mist'), TEXT],
  ['ember text on mist', need('sage-90'), need('mist'), TEXT],

  // --- tinted panels ------------------------------------------------------
  ['ink on ember wash', need('ink'), need('sage-20'), TEXT],
  ['ember chip label', need('sage-80'), need('sage-20'), TEXT],
  ['deep on ember wash', need('deep-90'), need('sage-20'), TEXT],
  ['slate-80 on ember wash', need('slate-80'), need('sage-20'), TEXT],
  ['struck-out day (ink-70)', need('ink-70'), need('mist'), TEXT],
  ['ink on chip fill (mist-60)', need('ink-70'), need('mist-60'), TEXT],
  ['inline code (prose ink)', need('ink'), need('mist-60'), TEXT],
  ['window day (deep-90)', need('deep-90'), need('haze-20'), TEXT],
  ['available day (ink)', need('ink'), need('sage-20'), TEXT],
  ['sold-out day (ink-60)', need('ink-60'), need('mist'), TEXT],
  ['title on boxed content', need('boxed-title'), need('boxed-glow'), TEXT],
  ['copy on boxed content', need('boxed-copy'), need('boxed-glow'), TEXT],
  ['accent on boxed content', need('boxed-accent'), need('boxed-glow'), LARGE],

  // --- dark sections (navy) ----------------------------------------------
  ['copy on navy', need('mist'), INK, TEXT],
  ['headings on navy', WHITE, INK, TEXT],
  ['ember text on navy', need('sage-light'), INK, TEXT],
  ['haze label on navy', need('haze'), INK, TEXT],
  ['copy on raised navy', need('mist'), need('ink-80'), TEXT],
  ['monogram on navy', need('mist'), need('ink-70'), TEXT],
  ['white on deep fill', WHITE, need('deep'), TEXT],
  ['white on ember fill', WHITE, need('sage-90'), TEXT],
  ['white on ember hover', WHITE, need('sage-80'), TEXT],
  ['white on ink fill', WHITE, INK, TEXT],
  ['ember marker on navy', need('sage'), INK, LARGE],
  ['selected-day dot', need('sage-light'), INK, LARGE],

  // --- copy over photography (worst case: a blown-out frame) --------------
  ['masthead over scrim', need('mist'), SCRIM_88, TEXT],
  ['title over scrim', WHITE, SCRIM_88, TEXT],
  ['copy over 72% wash', need('mist'), WASH_72, TEXT],
  ['title over 72% wash', WHITE, WASH_72, TEXT],
  ['hero foot (wash+scrim)', need('mist'), HERO_FOOT, TEXT],
  ['video hero foot', need('mist'), VIDEO_FOOT, TEXT],
  ['video hero eyebrow', mix(VIDEO_FOOT, need('mist'), 0.85), VIDEO_FOOT, TEXT],
  ['globe pin on lit ocean', mix(need('sage'), WHITE, 0.55), mix(INK, need('deep'), 0.45), LARGE],
]

let failures = 0
const rows = pairs.map(([role, fg, bg, target]) => {
  const ratio = contrast(fg, bg)
  const pass = ratio >= target
  if (!pass) failures += 1
  return { role, fg, bg, ratio, target, pass }
})

const width = Math.max(...rows.map((r) => r.role.length))
console.log(`\nWCAG 2.2 contrast audit — ${rows.length} pairs, tokens read from globals.css\n`)
for (const row of rows) {
  const flag = row.pass ? 'pass' : 'FAIL'
  console.log(
    `  ${flag}  ${row.ratio.toFixed(2).padStart(6)}:1  (need ${row.target}:1)  ` +
      `${row.role.padEnd(width)}  ${row.fg} on ${row.bg}`,
  )
}
console.log(
  failures === 0
    ? `\nAll ${rows.length} pairs meet their target.\n`
    : `\n${failures} of ${rows.length} pairs miss their target.\n`,
)
process.exit(failures === 0 ? 0 : 1)
