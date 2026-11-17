/**
 * Custom HTML sections publish an editor's markup **verbatim** — `<script>` tags, `<style>` blocks,
 * iframes, forms, event handlers and any URL scheme included. The snippets editors paste are whole
 * third-party products (the Travelpayouts affiliate loader in docs/reference/third-party/, booking widgets, map
 * embeds, an AdSense unit), and those only work if nothing is stripped from them.
 *
 * Two browser rules decide what has to happen next, and they are the reason this module exists:
 *
 *   - markup assigned through `innerHTML` is parsed but never *executed*, so a `<script>` that
 *     arrives that way sits in the DOM as an inert node — it renders nothing and runs nothing,
 *     which is what made the field look like it "does not support scripts";
 *   - a `<script>` in HTML that arrived over the wire, by contrast, already ran while the document
 *     was being parsed, so re-inserting it would run it a second time.
 *
 * `CustomHtmlSection` therefore renders through the client component `CustomHtml`, which marks the
 * scripts the parser already ran (`markParserInsertedScripts`) and re-inserts only the ones React
 * created on the client (`activateScripts`) — one paste, one execution, on every delivery path.
 * Everything else (`<style>`, `<link>`, `<iframe>`, `<img>`, `<form>`, `on*` handlers) is live as
 * soon as it is parsed, so it needs no help.
 */

/** Marks a script this module already re-inserted, so a second pass can never run it twice. */
const ACTIVATED = 'data-hg-script'

/**
 * The MIME types a browser treats as JavaScript. Anything else (`application/ld+json`,
 * `application/json`, `text/plain`, `text/template`…) is a data block: it must be published to the
 * page for crawlers and other scripts to read, but never executed.
 */
const JAVASCRIPT_MIME_TYPES = new Set([
  'application/ecmascript',
  'application/javascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript',
])

/** No `type` at all means classic JavaScript, exactly as in a normal HTML document. */
export function isExecutableScriptType(type?: string | null): boolean {
  const value = type?.trim().toLowerCase()
  if (!value) return true
  if (value === 'module') return true
  // Browsers accept parameters: `text/javascript; charset=utf-8`.
  return JAVASCRIPT_MIME_TYPES.has(value.split(';')[0]!.trim())
}

/** Resolves when an external or module script has run, so the next one can be inserted in order. */
function settled(script: HTMLScriptElement): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      script.removeEventListener('load', done)
      script.removeEventListener('error', done)
      resolve()
    }
    script.addEventListener('load', done)
    script.addEventListener('error', done)
  })
}

/**
 * Flag the scripts the browser already ran while parsing the server-rendered page.
 *
 * A `<script>` in HTML that arrives over the wire executes as the parser reaches it — unlike markup
 * assigned with `innerHTML` afterwards. So on a hard load (and in a streamed Suspense chunk) the
 * pasted snippet has already run by the time React hydrates, and activating it a second time would
 * double-render every widget. Marking those nodes is what keeps "one paste = one execution" true on
 * both paths; `activateScripts` skips anything already marked.
 */
export function markParserInsertedScripts(root: HTMLElement): void {
  for (const script of Array.from(root.querySelectorAll<HTMLScriptElement>('script'))) {
    if (isExecutableScriptType(script.type) && !script.hasAttribute(ACTIVATED)) {
      script.setAttribute(ACTIVATED, '')
    }
  }
}

/**
 * Replace every inert `<script>` under `root` with a real one, in the order the editor pasted them.
 *
 * The wait between steps is what makes pasted widgets work: an external `<script src>` is fully
 * loaded before the inline snippet after it runs, so `Widget.init()` never executes before
 * `widget.js` arrives. Inline classic scripts run synchronously the moment they are inserted.
 *
 * Returns a cancel function — React 19 StrictMode mounts effects twice in development, and a
 * preview re-renders on every keystroke, so an in-flight pass must be abandonable rather than
 * allowed to finish against DOM that no longer exists.
 */
export function activateScripts(root: HTMLElement): () => void {
  const pending = Array.from(root.querySelectorAll<HTMLScriptElement>('script')).filter(
    (script) => !script.hasAttribute(ACTIVATED) && isExecutableScriptType(script.type),
  )
  if (pending.length === 0) return () => {}

  let cancelled = false

  void (async () => {
    // Yield before touching the DOM: a cancel that arrives in the same tick — React StrictMode's
    // second mount, a live-preview re-render — must stop the whole pass rather than race the
    // inline scripts, which would otherwise run synchronously during `activateScripts()`.
    await Promise.resolve()

    for (const inert of pending) {
      if (cancelled) return
      // React replaced the markup (or another pass already took this node) while we were waiting.
      if (!inert.isConnected || inert.hasAttribute(ACTIVATED)) continue

      const live = document.createElement('script')
      // Copy attributes verbatim: loader snippets are matched by the flags they carry
      // (`data-cfasync`, `data-no-defer`, `nowprocket`, `crossorigin`, `id`, `data-*`…).
      for (const attribute of Array.from(inert.attributes)) {
        live.setAttribute(attribute.name, attribute.value)
      }
      live.setAttribute(ACTIVATED, '')
      // A script with `src` ignores its body, exactly as it would in a normal document.
      if (!live.src) live.textContent = inert.textContent ?? ''

      inert.replaceWith(live)
      // Module scripts are deferred, so "inserted" is not yet "executed": wait for those too.
      if (live.src || live.type.trim().toLowerCase() === 'module') await settled(live)
    }
  })()

  return () => {
    cancelled = true
  }
}
