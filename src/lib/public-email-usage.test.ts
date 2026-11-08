/**
 * Guards the fix for Semrush's `https://hikeglobally.com/cdn-cgi/l/email-protection` "broken link"
 * report, which appeared on every page because the footer links to the contact address.
 *
 * The report is not a broken route in this app: Cloudflare's Email Address Obfuscation rewrites
 * `mailto:` links at the edge into a `/cdn-cgi/l/email-protection` placeholder that only its
 * injected script can resolve. `src/lib/public-email.ts` explains the fix in full. This file is the
 * regression test for it, and it reads the components as text the way `mobile-navigation.test.ts`
 * and `trip-packing-section.test.ts` already do — no DOM, no renderer, no build.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { mailtoHref, visibleEmailHtml } from './public-email'

const srcDir = path.resolve(import.meta.dirname, '..')

/** Every `.tsx` under `src/`, minus the Payload admin we do not author by hand. */
const componentFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return componentFiles(full)
    return full.endsWith('.tsx') ? [full] : []
  })

const sources = componentFiles(srcDir).map((file) => ({
  file: path.relative(srcDir, file),
  text: readFileSync(file, 'utf8'),
}))

describe('public email links', () => {
  it('is the only module that spells out a mailto: href', () => {
    // Call sites must go through mailtoHref(); a hand-built template string is how the address
    // drifted into three components and, eventually, into a shape Cloudflare rewrote.
    const offenders = sources
      .filter(({ file }) => !file.startsWith('lib' + path.sep) || !file.includes('public-email'))
      .filter(({ text }) => /`mailto:\$\{|["'`]mailto:\s*\+/.test(text))
      .map(({ file }) => file)

    assert.deepEqual(offenders, [], `build mailto links with mailtoHref(): ${offenders.join(', ')}`)
  })

  it('never leaves a bare address as a JSX text node', () => {
    // React drops HTML comments, so an address rendered as `{settings.email}` cannot be wrapped in
    // Cloudflare's <!---email_off-- > markers. Every visible address must come from visibleEmailHtml().
    const offenders = sources
      .filter(({ text }) => /\{\s*settings\.email\s*\}/.test(text))
      .map(({ file }) => file)

    assert.deepEqual(
      offenders,
      [],
      `render the address with protectedEmailHtmlProps(): ${offenders.join(', ')}`,
    )
  })

  it('serves the address to crawlers as a real mailto: link', () => {
    const href = mailtoHref('hikeglobally@gmail.com')
    assert.equal(href, 'mailto:hikeglobally@gmail.com')

    // The placeholder Semrush followed must not be producible from any exported helper.
    const html = visibleEmailHtml('hikeglobally@gmail.com')
    assert.doesNotMatch(html, /cdn-cgi/)
  })

  it('opts the visible address out of Cloudflare rewriting', () => {
    // Semrush only finds /cdn-cgi/l/email-protection where Cloudflare rewrote something. The opt-out
    // is a comment pair around the address in the response body.
    assert.match(visibleEmailHtml('hikeglobally@gmail.com'), /<!--email_off-->.*<!--\/email_off-->/)
  })

  it('each component that links to the contact address opts it out', () => {
    const linking = sources.filter(({ text }) => text.includes('mailtoHref('))

    assert.ok(linking.length > 0, 'expected at least one component to link to the contact address')
    for (const { file, text } of linking) {
      assert.match(
        text,
        /protectedEmailHtmlProps\(|ProtectedEmail/,
        `${file} links with mailtoHref() but does not protect the visible address`,
      )
    }
  })
})
