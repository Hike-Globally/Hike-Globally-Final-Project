import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isCloudflareEmailProtectionHref,
  mailtoHref,
  protectedEmailHtmlProps,
  visibleEmailHtml,
} from './public-email'

describe('mailtoHref', () => {
  it('builds a mailto: URI from the stored address', () => {
    assert.equal(mailtoHref('hikeglobally@gmail.com'), 'mailto:hikeglobally@gmail.com')
  })

  it('trims stray whitespace from a CMS field', () => {
    assert.equal(mailtoHref('  hello@hikeglobally.com\n'), 'mailto:hello@hikeglobally.com')
  })

  it('escapes a plus so mail handlers cannot read it as a space', () => {
    assert.equal(mailtoHref('hello+trek@hikeglobally.com'), 'mailto:hello%2Btrek@hikeglobally.com')
  })

  it('returns null for an empty or missing address, so callers can skip the link', () => {
    assert.equal(mailtoHref(''), null)
    assert.equal(mailtoHref('   '), null)
    assert.equal(mailtoHref(null), null)
    assert.equal(mailtoHref(undefined), null)
  })
})

describe('visibleEmailHtml', () => {
  it('wraps the address in the markers Cloudflare documents for opting out', () => {
    assert.equal(
      visibleEmailHtml('hikeglobally@gmail.com'),
      '<!--email_off-->hikeglobally@gmail.com<!--/email_off-->',
    )
  })

  it('is exposed to React through dangerouslySetInnerHTML, because JSX drops comment nodes', () => {
    const props = protectedEmailHtmlProps('hello@hikeglobally.com')

    assert.equal(
      props.dangerouslySetInnerHTML.__html,
      '<!--email_off-->hello@hikeglobally.com<!--/email_off-->',
    )
  })

  it('escapes anything that could break out of the comments or the anchor', () => {
    assert.equal(
      visibleEmailHtml('a<b>c&"d\'e@example.com'),
      '<!--email_off-->a&lt;b&gt;c&amp;&quot;d&#39;e@example.com<!--/email_off-->',
    )
  })

  it('renders nothing for an empty address', () => {
    assert.equal(visibleEmailHtml(''), '')
    assert.equal(visibleEmailHtml(null), '')
  })

  it('emits both markers, in order, so Cloudflare recognises the pair', () => {
    const html = visibleEmailHtml('hello@hikeglobally.com')

    assert.ok(html.startsWith('<!--email_off-->'))
    assert.ok(html.endsWith('<!--/email_off-->'))
    assert.ok(html.indexOf('<!--email_off-->') < html.indexOf('<!--/email_off-->'))
  })
})

describe('isCloudflareEmailProtectionHref', () => {
  it('recognises the protected-link placeholder Cloudflare substitutes', () => {
    assert.equal(isCloudflareEmailProtectionHref('/cdn-cgi/l/email-protection'), true)
    assert.equal(isCloudflareEmailProtectionHref('/cdn-cgi/l/email-protection#1a2b3c'), true)
    assert.equal(
      isCloudflareEmailProtectionHref('https://hikeglobally.com/cdn-cgi/l/email-protection#ff00'),
      true,
    )
  })

  it('leaves real links alone', () => {
    assert.equal(isCloudflareEmailProtectionHref('mailto:hello@hikeglobally.com'), false)
    assert.equal(isCloudflareEmailProtectionHref('/contact'), false)
    assert.equal(isCloudflareEmailProtectionHref('https://hikeglobally.com/cdn-cgi/trace'), false)
  })
})
