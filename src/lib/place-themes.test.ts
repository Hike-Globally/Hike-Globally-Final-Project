/**
 * Place themes — coverage and WCAG 2.2 contrast audit for the nine themed
 * category pages (`/places/<category>`).
 *
 * Every accent set published by `src/lib/place-themes.ts` is measured against
 * the exact composites `places.css` builds from it, so the themes cannot drift
 * from what the page renders:
 *
 *   accent      ≥ 3:1   graphic/large role on paper, mist, wash and band
 *   accent-ink  ≥ 4.5:1 small-text role on the same light surfaces
 *   accent-lt   ≥ 3:1   on-dark role against navy and the hero-foot composite
 *   ink copy    ≥ 4.5:1 on the wash panel and the tinted band
 *
 * The colour maths mirrors `scripts/design/color-math.mjs` (sRGB mix + WCAG
 * relative luminance) inlined here so the shipped test has no cross-tree
 * import.
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { PLACE_CATEGORY_VALUES, placeCategories } from './place-categories'
import { placeThemes, placeThemeStyle, getPlaceTheme } from './place-themes'

/* -------------------------------------------------------------------------- */
/* Colour maths (sRGB mix + WCAG 2.x contrast)                                */
/* -------------------------------------------------------------------------- */

const hexToRgb = (hex: string): number[] => {
  const clean = hex.replace('#', '')
  return [0, 2, 4].map((offset) => Number.parseInt(clean.slice(offset, offset + 2), 16))
}

const mixHex = (a: string, b: string, t: number): string => {
  const rgbA = hexToRgb(a)
  const rgbB = hexToRgb(b)
  return (
    '#' +
    rgbA
      .map((channel, index) =>
        Math.round(channel * (1 - t) + rgbB[index]! * t)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}

const luminance = (hex: string): number => {
  const linear = (channel: number): number => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!)
}

const contrast = (a: string, b: string): number => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

/* -------------------------------------------------------------------------- */
/* Backgrounds the page composites (see places.css)                           */
/* -------------------------------------------------------------------------- */

const PAPER = '#ffffff'
const MIST = '#f6f6f6'
const INK = '#183144'
const INK_60 = '#5d6f7c'
/** Hero-foot composite: ink wash under the photo scrim (from contrast-check). */
const HERO_FOOT = '#20384a'
/** `color-mix(in srgb, var(--place-accent-wash) 45%, var(--color-mist))`. */
const bandFor = (wash: string): string => mixHex(wash, MIST, 0.45)

const lightBackgrounds = (wash: string): string[] => [PAPER, MIST, wash, bandFor(wash)]

/* -------------------------------------------------------------------------- */
/* Coverage                                                                    */
/* -------------------------------------------------------------------------- */

test('every Browse Places category has exactly one theme', () => {
  assert.deepEqual(Object.keys(placeThemes).sort(), [...PLACE_CATEGORY_VALUES].sort())
  for (const value of PLACE_CATEGORY_VALUES) {
    const theme = getPlaceTheme(value)
    assert.deepEqual(theme, placeThemes[value])
    assert.equal(theme.facts.length, 3)
    for (const fact of theme.facts) {
      assert.ok(fact.label.length > 0, `${value}: fact label empty`)
      assert.ok(fact.value.length > 0, `${value}: fact value empty`)
    }
    assert.ok(theme.pull.length > 0, `${value}: pull quote empty`)
  }
})

test('the fact system stays identical across categories', () => {
  const labels = new Set(
    placeCategories.map(({ value }) =>
      placeThemes[value].facts.map((fact) => fact.label).join('|'),
    ),
  )
  assert.deepEqual([...labels], ['Signature|Character|Best paired with'])
})

test('placeThemeStyle publishes the four custom properties the CSS consumes', () => {
  const style = placeThemeStyle(placeThemes.lakes)
  assert.deepEqual(Object.keys(style).sort(), [
    '--place-accent',
    '--place-accent-ink',
    '--place-accent-lt',
    '--place-accent-wash',
  ])
  for (const value of Object.values(style)) {
    assert.match(value, /^#[0-9a-f]{6}$/)
  }
})

/* -------------------------------------------------------------------------- */
/* Contrast audit                                                              */
/* -------------------------------------------------------------------------- */

test('accent sets pass their WCAG targets on every surface they touch', () => {
  const failures: string[] = []

  for (const value of PLACE_CATEGORY_VALUES) {
    const theme = placeThemes[value]
    const backgrounds = lightBackgrounds(theme.accentWash)

    for (const background of backgrounds) {
      const graphic = contrast(theme.accent, background)
      if (graphic < 3) {
        failures.push(
          `${value}: accent ${theme.accent} on ${background} ${graphic.toFixed(2)}:1 (need 3:1)`,
        )
      }
      const text = contrast(theme.accentInk, background)
      if (text < 4.5) {
        failures.push(
          `${value}: accent-ink ${theme.accentInk} on ${background} ${text.toFixed(2)}:1 (need 4.5:1)`,
        )
      }
    }

    for (const dark of [INK, HERO_FOOT]) {
      const onDark = contrast(theme.accentLt, dark)
      if (onDark < 3) {
        failures.push(
          `${value}: accent-lt ${theme.accentLt} on ${dark} ${onDark.toFixed(2)}:1 (need 3:1)`,
        )
      }
    }

    const inkOnWash = contrast(INK, theme.accentWash)
    if (inkOnWash < 4.5) {
      failures.push(`${value}: ink on wash ${inkOnWash.toFixed(2)}:1 (need 4.5:1)`)
    }

    const band = bandFor(theme.accentWash)
    const ink60OnBand = contrast(INK_60, band)
    if (ink60OnBand < 4.5) {
      failures.push(`${value}: lead copy (ink-60) on band ${ink60OnBand.toFixed(2)}:1 (need 4.5:1)`)
    }
  }

  assert.deepEqual(failures, [])
})
