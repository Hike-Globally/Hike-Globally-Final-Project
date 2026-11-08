'use client'

import { useEffect, useState } from 'react'
import { useDocumentInfo, useField } from '@payloadcms/ui'

/**
 * The advisory panel under the destination field in the Redirections edit form.
 *
 * Two rules can be individually valid and still be a poor pair: `/a → /b` where `/b → /c` sends the
 * visitor through two hops, and search engines see the ranking signal land on `/b` instead of `/c`.
 * Payload's validation hook can only *refuse* a save, so the softer "you probably mean `/c`" advice
 * lives here: the form asks the `analyse` endpoint (same pure rules the hook uses) after a short
 * pause and offers a one-click fix.
 *
 * Loops are shown here too, so the editor sees the problem before pressing Save — but the loop is
 * still refused by the server, which is what actually guarantees it never reaches the proxy.
 */

type Analysis = {
  warnings?: { field?: string; message: string }[]
  loop?: string[] | null
  chain?: { via: string; finalDestination: string } | null
}

export default function RedirectionCheckField() {
  const { id } = useDocumentInfo()
  const { value: source } = useField<string>({ path: 'sourcePath' })
  const { value: destination, setValue: setDestination } = useField<string>({
    path: 'destinationUrl',
  })
  const { value: statusCode } = useField<string>({ path: 'statusCode' })

  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      // Cleared here rather than in the effect body: a synchronous setState during the render's
      // effect would schedule a second render on every keystroke.
      if (!source && !destination) {
        setAnalysis(null)
        return
      }

      setChecking(true)
      try {
        const params = new URLSearchParams({
          source: source ?? '',
          destination: destination ?? '',
          status: String(statusCode ?? '301'),
        })
        if (id !== undefined && id !== null) params.set('id', String(id))

        const response = await fetch(`/api/redirections/analyse?${params.toString()}`, {
          credentials: 'same-origin',
          signal: controller.signal,
        })

        if (!response.ok) {
          setAnalysis(null)
          return
        }

        setAnalysis((await response.json()) as Analysis)
      } catch {
        if (!controller.signal.aborted) setAnalysis(null)
      } finally {
        if (!controller.signal.aborted) setChecking(false)
      }
    }, 400)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [source, destination, statusCode, id])

  if (!source && !destination) return null

  const warnings = analysis?.warnings ?? []
  const loop = analysis?.loop ?? null
  const chain = analysis?.chain ?? null

  if (!warnings.length && !loop) {
    if (!checking) return null
    return <p className="hg-redirect-hint hg-redirect-hint--muted">Checking this rule…</p>
  }

  return (
    <div className="hg-redirect-hint">
      {loop ? (
        <p className="hg-redirect-hint__error">
          <strong>Redirect loop:</strong> {loop.join(' → ')}. A rule that sends visitors back to
          where they started can never be saved.
        </p>
      ) : null}

      {warnings.map((warning) => (
        <p className="hg-redirect-hint__warning" key={warning.message}>
          {warning.message}
          {chain?.finalDestination && destination !== chain.finalDestination ? (
            <button
              className="hg-redirect-hint__action"
              onClick={() => setDestination(chain.finalDestination)}
              type="button"
            >
              Point straight at {chain.finalDestination}
            </button>
          ) : null}
        </p>
      ))}
    </div>
  )
}
