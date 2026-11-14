'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

import { activateScripts, markParserInsertedScripts } from '@/lib/custom-html'

const subscribe = () => () => {}

/**
 * `false` while React is reusing the DOM the server sent (hydration), `true` once the client owns
 * the markup — a client-side navigation, a live-preview update, or a re-render after hydration.
 *
 * The distinction decides whether the pasted scripts have run yet: `<script>` in the HTML that
 * arrived over the wire already executed while the browser parsed the page, whereas `<script>`
 * assigned through `innerHTML` on the client is inert. Getting this wrong either double-runs every
 * widget on a hard load or leaves them dead after an in-app navigation.
 */
function useClientRenderedMarkup(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

/**
 * Publishes a Custom HTML section's code exactly as it was written and then makes it run.
 *
 * The markup goes in through `dangerouslySetInnerHTML`, so it is server-rendered byte-for-byte —
 * crawlers, ad-network placement checks and the first paint all see what the editor pasted, and its
 * scripts execute during parsing like any other script on the page. `activateScripts` covers the
 * remaining path: markup React inserted on the client, where browsers never execute `<script>`
 * elements created from `innerHTML`. Both paths are marked, so a snippet can never run twice.
 */
export function CustomHtml({ html, className }: { html: string; className?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const clientRendered = useClientRenderedMarkup()

  useEffect(() => {
    const node = container.current
    if (!node) return undefined
    if (!clientRendered) {
      // Already executed during parsing — just record that so nothing activates them again.
      markParserInsertedScripts(node)
      return undefined
    }
    return activateScripts(node)
  }, [html, clientRendered])

  return <div ref={container} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
