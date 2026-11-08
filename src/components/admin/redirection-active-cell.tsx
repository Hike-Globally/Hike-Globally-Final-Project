'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DefaultCellComponentProps } from 'payload'

/**
 * List-view cell for `isActive`: a switch that saves as soon as it is flipped.
 *
 * A redirect is a one-field decision — "is this rule on?" — so sending an editor into the edit view
 * to toggle a checkbox is friction. The switch writes through Payload's own REST route (same
 * session cookie, same CSRF rules), and falls back to the server's message if the toggle is
 * refused (it is refused when activating would create a loop).
 *
 * The rendered position is always the row's own value: the click saves, then `router.refresh()`
 * re-renders the table from the server. Holding a second copy of the value in state would have to
 * be synchronised with that refresh, and a stale copy in a list that paginates and sorts is a worse
 * failure than the few hundred milliseconds the save takes.
 */
export default function RedirectionActiveCell({
  cellData,
  rowData,
  collectionSlug,
}: DefaultCellComponentProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = Boolean(cellData)
  const id = (rowData as { id?: string | number } | undefined)?.id
  const slug = collectionSlug ?? 'redirections'

  const toggle = async () => {
    if (id === undefined || id === null || pending) return

    const next = !active
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/${slug}/${id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: next }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          message?: string
          errors?: { message?: string }[]
        }
        setError(body.errors?.[0]?.message ?? body.message ?? 'The rule could not be updated.')
        return
      }

      router.refresh()
    } catch (toggleError) {
      setError((toggleError as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <span className="hg-redirect-toggle">
      <button
        aria-checked={active}
        aria-label={active ? 'Deactivate this redirection' : 'Activate this redirection'}
        className={`hg-redirect-toggle__switch${active ? ' hg-redirect-toggle__switch--on' : ''}`}
        disabled={pending}
        onClick={toggle}
        role="switch"
        title={error ?? (active ? 'Active — click to deactivate' : 'Inactive — click to activate')}
        type="button"
      >
        <span aria-hidden="true" className="hg-redirect-toggle__knob" />
      </button>
      <span className="hg-redirect-toggle__label">
        {pending ? 'Saving…' : active ? 'Active' : 'Inactive'}
      </span>
      {error ? (
        <span className="hg-redirect-toggle__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
