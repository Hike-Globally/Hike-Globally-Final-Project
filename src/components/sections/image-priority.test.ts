/**
 * One preloaded image per page — the LCP budget contract.
 *
 * `priority` on a `next/image` makes the browser preload that file ahead of everything else.
 * Only an image that can actually *be* the LCP element deserves that: a preload spent on a
 * cover that sits below the fold just takes bandwidth away from the hero the visitor is
 * waiting for. Every hero on this site is exactly one viewport tall (`.hero-region`, see
 * `globals.css`), so anything rendered *after* a hero is below the fold by construction and
 * must lazy-load.
 *
 * That gives the rule these tests enforce:
 *
 *  1. No component decides "this one is important" from a loop index, except the two screens
 *     whose first image really is on screen at load (`/blog`'s lead card, the admin login's
 *     first slide) — and those preload exactly one cover.
 *  2. Card sections preload a cover only when their caller says the section *opens* the page
 *     (`priorityFirst`), so the one legitimate case — a CMS page whose first block is a card
 *     grid — still gets its LCP image preloaded.
 *  3. The genuine LCP surfaces (the hero band, the logo, the article/trip mastheads) keep
 *     `priority`, because dropping those would trade contention for a slower LCP.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const read = (file: string): string => readFileSync(path.join(repoRoot, file), 'utf8')

/** Every `.tsx` under `src/`, so a new section cannot reintroduce the pattern unnoticed. */
function listTsx(relative: string): string[] {
  const dir = path.join(repoRoot, relative)
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) return listTsx(child)
    return entry.name.endsWith('.tsx') ? [child] : []
  })
}

/**
 * The only places a list position may decide a preload. Each of these renders a single image
 * that is on screen the moment the page paints — no hero above it, so no other LCP candidate.
 */
const OPENING_COVER_ALLOWLIST = [
  // `/blog` opens on a text-only intro, so the featured lead card is the page's LCP image.
  'src/components/views/blog-explorer.tsx',
  // The admin login's CSS carousel has its first slide on screen at load; the rest are off-stage.
  'src/components/admin/login-gallery.tsx',
]

test('no image is preloaded because of its position in a list', () => {
  const fromIndex = listTsx('src').filter((file) => /priority=\{\s*index\b/.test(read(file)))

  assert.deepEqual(
    fromIndex.sort(),
    OPENING_COVER_ALLOWLIST.sort(),
    'priority must not be derived from a loop index — a card is not above the fold just because it is first',
  )

  // Each allowed case preloads exactly one cover: the comparison is against a constant, never
  // a range like `index < 3`.
  for (const file of OPENING_COVER_ALLOWLIST) {
    const source = read(file)
    assert.match(source, /priority=\{index === 0\}/, `${file} preloads only its first cover`)
    assert.doesNotMatch(source, /priority=\{index [<>]/, `${file} preloads a range of covers`)
  }
})

test('card sections preload a cover only when the caller opts in', () => {
  // Each section defaults to "no preload" and preloads *one* cover when it opens the page.
  for (const [file, optIn] of [
    ['src/components/sections/curated-trips-section.tsx', 'priorityFirst'],
    ['src/components/cards/destination-carousel.tsx', 'priorityFirst'],
    ['src/components/blocks/story-tiles.tsx', 'priorityFirst'],
  ] as const) {
    const source = read(file)
    assert.match(source, new RegExp(`${optIn} = false`), `${file} defaults to lazy covers`)
    assert.match(
      source,
      new RegExp(`priority=\\{${optIn} && index === 0\\}`),
      `${file} preloads exactly its first cover when it opens the page`,
    )
  }

  // The three blocks that can open a CMS page take that decision from the renderer, which is
  // the only place that knows whether a block is the page's first.
  const renderer = read('src/components/blocks/block-renderer.tsx')
  for (const block of ['FeaturedTrips', 'FeaturedDestinations', 'LatestPosts']) {
    assert.match(
      renderer,
      new RegExp(`<${block} key=\\{key} block=\\{block} opening=\\{opening} />`),
      `${block} is told whether it opens the page`,
    )
  }

  // The homepage composes these sections *below* its full-screen hero, so it never opts in.
  const fallback = read('src/components/views/home-fallback.tsx')
  assert.doesNotMatch(fallback, /priorityFirst/, 'nothing below the homepage hero preloads')
})

test('the real LCP images keep their preload', () => {
  const surfaces = [
    // The homepage hero ships its own preloaded photograph (`preload` in Next 16).
    'src/components/blocks/hero-background.tsx',
    'src/components/layout/logo.tsx',
    // Shared page header: every listing's opening band.
    'src/components/sections/page-header.tsx',
    // Article, trip and destination mastheads.
    'src/components/views/post-detail.tsx',
    'src/components/views/trip-detail.tsx',
    'src/components/views/destination-detail.tsx',
    'src/app/(frontend)/about/page.tsx',
    'src/app/(frontend)/contact/page.tsx',
    'src/app/(frontend)/destinations/page.tsx',
    'src/app/(frontend)/trips/page.tsx',
    'src/app/(frontend)/places/[slug]/page.tsx',
  ]

  for (const file of surfaces) {
    assert.match(read(file), /\bpriority\b|\bpreload\b/, `${file} still preloads its hero image`)
  }

  // And a hero's own preload stays unconditional — no `opening`-style opt-in for the one image
  // the page is actually waiting for.
  const hero = read('src/components/blocks/hero.tsx')
  assert.match(hero, /sizes="100vw"\s+priority/, 'the hero background always preloads')
})
