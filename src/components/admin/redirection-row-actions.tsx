'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'

/**
 * List-view actions for one row: edit, and delete behind an inline confirmation.
 *
 * Payload's list only offers bulk deletion, so a single bad rule would otherwise need a checkbox, a
 * scroll to the bulk bar and a confirmation there. The confirmation is inline rather than a modal
 * so the row — and the URL being removed — stays visible while the decision is made.
 */
export default function RedirectionRowActions({
  rowData,
  collectionSlug,
}: DefaultCellComponentProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const id = (rowData as { id?: string | number } | undefined)?.id
  const source = (rowData as { sourcePath?: string } | undefined)?.sourcePath ?? ''
  const slug = collectionSlug ?? 'redirections'

  if (id === undefined || id === null) return <span className="hg-view-live--none">—</span>

  const remove = async () => {
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/${slug}/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string }
        setError(body.message ?? 'The rule could not be deleted.')
        return
      }

      setConfirming(false)
      router.refresh()
    } catch (deleteError) {
      setError((deleteError as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <span className="hg-redirect-actions">
      {confirming ? (
        <>
          <span className="hg-redirect-actions__question">
            Delete {source || 'this rule'}?
          </span>
          <button
            className="hg-redirect-actions__link hg-redirect-actions__link--danger"
            disabled={pending}
            onClick={remove}
            type="button"
          >
            {pending ? 'Deleting…' : 'Yes, delete'}
          </button>
          <button
            className="hg-redirect-actions__link"
            disabled={pending}
            onClick={() => {
              setConfirming(false)
              setError(null)
            }}
            type="button"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <Link className="hg-redirect-actions__link" href={`/admin/collections/${slug}/${id}`}>
            Edit
          </Link>
          <button
            className="hg-redirect-actions__link hg-redirect-actions__link--danger"
            onClick={() => setConfirming(true)}
            type="button"
          >
            Delete
          </button>
        </>
      )}
      {error ? (
        <span className="hg-redirect-actions__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  )
}
