/**
 * Footer social chips — the row is CMS-driven but not printed verbatim: YouTube is dropped and a
 * LinkedIn row is rendered as X. These tests lock that mapping, and the X profile URL it points
 * at, so the footer cannot silently drift back to the retired LinkedIn mark.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { FOOTER_SOCIAL_FALLBACK, footerSocials, X_PROFILE } from './footer-socials'

test('a LinkedIn row from the CMS is rendered as X on the brand profile', () => {
  const socials = footerSocials([
    { platform: 'facebook', url: 'https://facebook.com/hikeglobally', id: '1' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/hikeglobally', id: '2' },
  ])

  assert.deepEqual(
    socials.map(({ platform, url }) => ({ platform, url })),
    [
      { platform: 'facebook', url: 'https://facebook.com/hikeglobally' },
      { platform: 'x', url: 'https://x.com/hikeglobally' },
    ],
  )
  assert.equal(X_PROFILE.url, 'https://x.com/hikeglobally')
})

test('no LinkedIn chip survives, whatever the CMS stored', () => {
  const stored = [
    { platform: 'instagram' as const, url: 'https://instagram.com/hikeglobally' },
    { platform: 'linkedin' as const, url: 'https://linkedin.com/company/hikeglobally' },
    { platform: 'youtube' as const, url: 'https://youtube.com/@hikeglobally' },
    { platform: 'tiktok' as const, url: 'https://tiktok.com/@hikeglobally' },
  ]
  const socials = footerSocials(stored)

  assert.deepEqual(
    socials.map((social) => social.platform),
    ['instagram', 'x', 'tiktok'],
  )
  assert.deepEqual(
    socials.filter((social) => /linkedin/i.test(social.url)),
    [],
  )
})

test('a LinkedIn row does not duplicate an X row an editor already added', () => {
  const socials = footerSocials([
    { platform: 'x', url: 'https://x.com/hikeglobally', id: '1' },
    { platform: 'linkedin', url: 'https://linkedin.com/company/hikeglobally', id: '2' },
  ])

  // Each chip is keyed on its platform, so a repeat would be a duplicate React key.
  assert.deepEqual(
    socials.map((social) => social.platform),
    ['x'],
  )
})

test('with nothing usable stored the footer still shows its three channels', () => {
  assert.deepEqual(
    FOOTER_SOCIAL_FALLBACK.map(({ platform, url }) => ({ platform, url })),
    [
      { platform: 'facebook', url: 'https://facebook.com/hikeglobally' },
      { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
      { platform: 'x', url: 'https://x.com/hikeglobally' },
    ],
  )
  assert.deepEqual(footerSocials(null), FOOTER_SOCIAL_FALLBACK)
  assert.deepEqual(footerSocials([]), FOOTER_SOCIAL_FALLBACK)
  // A CMS whose only social is YouTube leaves nothing the footer prints.
  assert.deepEqual(
    footerSocials([{ platform: 'youtube', url: 'https://youtube.com/@hg' }]),
    FOOTER_SOCIAL_FALLBACK,
  )
})
