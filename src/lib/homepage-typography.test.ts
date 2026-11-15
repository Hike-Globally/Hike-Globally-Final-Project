import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('homepage hero standfirst, section lead and section intros step down to the body role', () => {
  const homepageCss = read('../app/(frontend)/homepage.css')
  const globalsCss = read('../app/(frontend)/globals.css')

  // Global scale keeps `--text-body` strictly smaller than `--text-lead` on reference viewports.
  assert.match(globalsCss, /--text-lead:\s*clamp\(1\.0625rem,\s*1\.055rem \+ 0\.09vw,\s*1\.125rem\)/)
  assert.match(globalsCss, /--text-body:\s*1rem/)

  // Homepage tokens map all three introductory copy roles to `--text-body`.
  assert.match(homepageCss, /--home-hero-description-size:\s*var\(--text-body\)/)
  assert.match(homepageCss, /--home-lead-size:\s*var\(--text-body\)/)
  assert.match(homepageCss, /--home-intro-size:\s*var\(--text-body\)/)

  // Scoped `[data-homepage]` rules apply those tokens to the hero description, section lead, and section intros.
  assert.match(
    homepageCss,
    /\[data-homepage\]\s+\.hero-description\s*\{[^}]*font-size:\s*var\(--home-hero-description-size\)/s,
  )
  assert.match(
    homepageCss,
    /\[data-homepage\]\s+\.home-section-lead\s*\{[^}]*font-size:\s*var\(--home-lead-size\)/s,
  )
  assert.match(
    homepageCss,
    /\[data-homepage\]\s+\.home-section-intro\s*\{[^}]*font-size:\s*var\(--home-intro-size\)/s,
  )
})

test('all seven homepage intro/lead paragraphs carry the reduced homepage typography classes', () => {
  const heroBlock = read('../components/blocks/hero.tsx')
  const homeFallback = read('../components/views/home-fallback.tsx')
  const difficultyLevels = read('../components/sections/difficulty-levels.tsx')
  const curatedTrips = read('../components/sections/curated-trips-section.tsx')
  const aboutSection = read('../components/sections/about-hike-globally.tsx')
  const homepageDestinations = read('../components/blocks/homepage-destinations.tsx')
  const latestBlogs = read('../components/sections/latest-blogs-section.tsx')

  // 1. Hero standfirst (CMS block + fallback)
  assert.match(heroBlock, /hero-description/)
  assert.match(homeFallback, /hero-description[\s\S]*Explore family tours, trekking adventures/)

  // 2. Difficulty levels intro
  assert.match(
    difficultyLevels,
    /home-section-intro[\s\S]*Find your match — from gentle days out to high-altitude challenges\./,
  )

  // 3. Curated travel packages intro
  assert.match(curatedTrips, /Explore our curated travel packages designed to suit every budget/)
  assert.match(curatedTrips, /descriptionClassName="home-section-intro ct-description"/)

  // 4. About Hike Globally lead
  assert.match(
    aboutSection,
    /Hike Globally is an affiliate travel platform connecting curious travellers/,
  )
  assert.match(aboutSection, /home-section-lead/)

  // 5 & 6. Nepal & Worldwide destinations intros
  assert.equal((homepageDestinations.match(/descriptionClassName="home-section-intro"/g) ?? []).length, 2)
  assert.match(homepageDestinations, /Beyond Nepal, we plan treks and expeditions on every continent\./)

  // 7. Latest blogs and stories intro
  assert.match(latestBlogs, /description=\{dict\.blog\.listingSubtitle\}/)
  assert.match(latestBlogs, /descriptionClassName="home-section-intro"/)
})
