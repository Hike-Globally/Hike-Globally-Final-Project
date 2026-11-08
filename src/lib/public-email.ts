/**
 * How a public email address is written into the HTML — one place, one rule.
 *
 * Why this exists: the site sits behind Cloudflare, and Cloudflare enables **Email Address
 * Obfuscation** on every zone by default. It rewrites any `mailto:` link (and any bare address it
 * finds in body text) at the edge into a `<a href="/cdn-cgi/l/email-protection#…">` pointing at a
 * path that only Cloudflare's injected `email-decode.min.js` can make sense of. Nothing is deployed
 * wrong when that happens: the code in this repo is fine, and a human with JavaScript sees the real
 * address. What *is* broken is everything that reads the HTML without running that script:
 *
 *   - SEO crawlers (Semrush, Ahrefs, Screaming Frog) follow the link, get the "email protected"
 *     placeholder, and report `https://hikeglobally.com/cdn-cgi/l/email-protection` as a broken
 *     internal link on every page that links to us — the footer, so every page.
 *   - Google Search Console files the same path as a soft 404.
 *   - `curl`, link checkers, and mail clients that pre-fetch get no `mailto:` either.
 *
 * The reliable, self-contained fix is on the markup: Cloudflare documents that it does not touch
 * email addresses wrapped in `<!--email_off-->…<!--/email_off-->`. Those comments have to survive
 * into the *response body*, though, and React drops comment nodes from JSX it renders. So the
 * address does not come from an JSX text node at all — it is a raw HTML string paired with React's
 * `dangerouslySetInnerHTML`, which streams the comments out exactly as written here:
 *
 *     <a href="mailto:x@y.com"><!--email_off-->x@y.com<!--/email_off--></a>
 *
 * That is the shape Cloudflare's own docs use for the opt-out, and it keeps the address clickable
 * and selectable for visitors while giving crawlers a real `mailto:` (which they understand) instead
 * of a path that 404s.
 *
 * Two independent layers, on purpose:
 *
 *   1. This markup — the deploy-side fix. It holds even if nobody touches the Cloudflare dashboard,
 *      which is what makes it safe to ship from a pull request.
 *   2. `robots.txt` disallowing `/cdn-cgi/` — belts and braces for any address an editor pastes into
 *      rich text or a CMS field, where we cannot control the surrounding markup.
 *
 * Turning Email Address Obfuscation off in the Cloudflare dashboard (Security → Settings → Email
 * Address Obfuscation) removes the rewriting entirely and is still worth doing; the markup below is
 * simply correct without it. The README documents both.
 *
 * This module must stay dependency-free and pure so the tests can exercise it directly.
 */

/** The comment markers Cloudflare's opt-out is documented with. */
const EMAIL_OFF_OPEN = '<!--email_off-->'
const EMAIL_OFF_CLOSE = '<!--/email_off-->'

/**
 * A `mailto:` URI for `email`, or `null` when `email` is empty.
 *
 * `+` is escaped because some clients and mail handlers decode it as a space in the command
 * portion of a `mailto:` URI; the address itself is otherwise left exactly as the CMS stores it.
 */
export const mailtoHref = (email: string | null | undefined): string | null => {
  const address = email?.trim()
  if (!address) return null
  return `mailto:${address.replace(/\+/g, '%2B')}`
}

/**
 * The visible address, escaped and wrapped in Cloudflare's `email_off` markers.
 *
 * Returned as HTML because the markers are HTML comments. Escape `<`, `>`, `&`, `"` and `'` in the
 * address first so a stray character in a CMS field cannot break out of the comments or the anchor.
 */
export const visibleEmailHtml = (email: string | null | undefined): string => {
  const address = email?.trim()
  if (!address) return ''

  const escaped = address
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  return `${EMAIL_OFF_OPEN}${escaped}${EMAIL_OFF_CLOSE}`
}

/**
 * Props that render a visible address protected from Cloudflare's rewriting.
 *
 * Spread onto a `dangerouslySetInnerHTML`-carrying element:
 *
 *     <a href={mailtoHref(email)} {...protectedEmailHtmlProps(email)} />
 *
 * Kept as a named helper so every call site reads the same way and a future change (a different
 * opt-out mechanism, say) is a one-line edit rather than a hunt through components.
 */
export const protectedEmailHtmlProps = (
  email: string | null | undefined,
): { dangerouslySetInnerHTML: { __html: string } } => ({
  dangerouslySetInnerHTML: { __html: visibleEmailHtml(email) },
})

/**
 * True when an href is an email protection path rather than something a visitor can follow.
 *
 * Used by the link checker test to prove no public page emits one, and available to any component
 * that wants to recognise (and refuse to render) a link Cloudflare already rewrote.
 */
export const isCloudflareEmailProtectionHref = (href: string): boolean =>
  /\/cdn-cgi\/l\/email-protection(?:[#?]|$)/i.test(href)
