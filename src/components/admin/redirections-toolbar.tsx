'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useListQuery, useSelection } from '@payloadcms/ui'
import type { Where } from 'payload'

/**
 * The bar above the Redirections table (Payload's `beforeListTable` slot).
 *
 * Payload's list view already provides search, per-column sorting, the page controls and an
 * advanced filter builder. This bar adds the things that are specific to redirects:
 *
 *   • quick filters — status code and active/inactive, as two selects instead of a where-builder
 *   • bulk actions — activate / deactivate / delete the ticked rows
 *   • CSV export and import, with an honest summary of what an import did
 */

type ImportRow = {
  line: number
  source: string
  status: 'added' | 'skipped' | 'failed'
  reason?: string
}

type ImportSummary = {
  added: number
  skipped: number
  failed: number
  rows: ImportRow[]
}

type QuickFilters = { notation?: string; status: string; active: string }

const STATUS_OPTIONS = [
  { label: 'Any status', value: '' },
  { label: '301 — Permanent', value: '301' },
  { label: '302 — Temporary', value: '302' },
  { label: '307 — Temporary (keeps method)', value: '307' },
  { label: '308 — Permanent (keeps method)', value: '308' },
]

const ACTIVE_OPTIONS = [
  { label: 'Active or inactive', value: '' },
  { label: 'Active only', value: 'true' },
  { label: 'Inactive only', value: 'false' },
]

/** Reads the two quick filters back out of whatever `where` clause is currently applied. */
const readFilters = (where: Where | undefined): QuickFilters => {
  const conditions: Where[] = []
  const collect = (clause: Where | undefined) => {
    if (!clause) return
    if (Array.isArray((clause as { and?: Where[] }).and)) {
      for (const child of (clause as { and: Where[] }).and) collect(child)
      return
    }
    conditions.push(clause)
  }
  collect(where)

  let status = ''
  let active = ''

  for (const condition of conditions) {
    const statusCode = (condition as { statusCode?: { equals?: unknown } }).statusCode
    if (statusCode?.equals !== undefined) status = String(statusCode.equals)

    const isActive = (condition as { isActive?: { equals?: unknown } }).isActive
    if (isActive?.equals !== undefined) active = String(isActive.equals)
  }

  return { status, active }
}

export default function RedirectionsToolbar() {
  const router = useRouter()
  const list = useListQuery()
  const selection = useSelection()

  const fileInput = useRef<HTMLInputElement>(null)

  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const filters = readFilters(list?.query?.where)
  const selectedIds = selection?.selectedIDs ?? []

  const applyFilters = (next: Partial<QuickFilters>) => {
    const merged = { ...filters, ...next }
    const conditions: Where[] = []

    if (merged.status) conditions.push({ statusCode: { equals: merged.status } })
    if (merged.active) conditions.push({ isActive: { equals: merged.active === 'true' } })

    const where: Where | undefined =
      conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : { and: conditions }

    void list?.handleWhereChange?.(where as Where)
  }

  const runBulk = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedIds.length === 0) return

    setBusy(action)
    setMessage(null)

    try {
      const response = await fetch('/api/redirections/bulk', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds }),
      })

      const body = (await response.json().catch(() => ({}))) as {
        message?: string
        affected?: number
      }

      if (!response.ok) {
        setMessage({ tone: 'error', text: body.message ?? 'The action could not be completed.' })
        return
      }

      const verb =
        action === 'delete' ? 'deleted' : action === 'activate' ? 'activated' : 'deactivated'
      setMessage({
        tone: 'ok',
        text: `${body.affected ?? selectedIds.length} redirection(s) ${verb}.`,
      })
      router.refresh()
    } catch (error) {
      setMessage({ tone: 'error', text: (error as Error).message })
    } finally {
      setBusy(null)
    }
  }

  const importFile = async (file: File) => {
    setBusy('import')
    setMessage(null)
    setSummary(null)

    try {
      const csv = await file.text()
      const response = await fetch('/api/redirections/import', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv }),
      })

      const body = (await response.json().catch(() => ({}))) as ImportSummary & { message?: string }

      if (!response.ok) {
        setMessage({ tone: 'error', text: body.message ?? 'The file could not be imported.' })
        return
      }

      setSummary(body)
      router.refresh()
    } catch (error) {
      setMessage({ tone: 'error', text: (error as Error).message })
    } finally {
      setBusy(null)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div className="hg-redirects">
      <div className="hg-redirects__bar">
        <div className="hg-redirects__filters">
          <label className="hg-redirects__field">
            <span className="hg-redirects__label">Status code</span>
            <select
              className="hg-redirects__select"
              onChange={(event) => applyFilters({ status: event.target.value })}
              value={filters.status}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="hg-redirects__field">
            <span className="hg-redirects__label">State</span>
            <select
              className="hg-redirects__select"
              onChange={(event) => applyFilters({ active: event.target.value })}
              value={filters.active}
            >
              {ACTIVE_OPTIONS.map((option) => (
                <option key={option.value || 'any'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {filters.status || filters.active ? (
            <button
              className="hg-redirects__reset"
              onClick={() => applyFilters({ status: '', active: '' })}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="hg-redirects__bulk">
          <span className="hg-redirects__selection-note">
            {selectedIds.length === 0
              ? 'Tick rows for bulk actions'
              : `${selectedIds.length} selected`}
          </span>
          <button
            className="hg-redirects__button"
            disabled={selectedIds.length === 0 || busy !== null}
            onClick={() => void runBulk('activate')}
            type="button"
          >
            {busy === 'activate' ? 'Activating…' : 'Activate'}
          </button>
          <button
            className="hg-redirects__button"
            disabled={selectedIds.length === 0 || busy !== null}
            onClick={() => void runBulk('deactivate')}
            type="button"
          >
            {busy === 'deactivate' ? 'Deactivating…' : 'Deactivate'}
          </button>
          <button
            className="hg-redirects__button hg-redirects__button--danger"
            disabled={selectedIds.length === 0 || busy !== null}
            onClick={() => void runBulk('delete')}
            type="button"
          >
            {busy === 'delete' ? 'Deleting…' : 'Delete selected'}
          </button>
        </div>

        <div className="hg-redirects__csv">
          <a className="hg-redirects__button" href="/api/redirections/export" download>
            Export CSV
          </a>

          <input
            accept=".csv,text/csv"
            className="hg-redirects__file"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importFile(file)
            }}
            ref={fileInput}
            type="file"
          />
          <button
            className="hg-redirects__button"
            disabled={busy !== null}
            onClick={() => fileInput.current?.click()}
            type="button"
          >
            {busy === 'import' ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>

      {message ? (
        <p
          className={`hg-redirects__message hg-redirects__message--${message.tone}`}
          role={message.tone === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </p>
      ) : null}

      {summary ? (
        <div className="hg-redirects__summary" role="status">
          <div className="hg-redirects__summary-head">
            <strong>Import finished.</strong>
            <span>
              {summary.added} added · {summary.skipped} skipped · {summary.failed} failed
            </span>
            <button
              aria-label="Dismiss the import summary"
              className="hg-redirects__summary-close"
              onClick={() => setSummary(null)}
              type="button"
            >
              ×
            </button>
          </div>

          {summary.skipped + summary.failed > 0 ? (
            <ul className="hg-redirects__summary-list">
              {summary.rows
                .filter((row) => row.status !== 'added')
                .slice(0, 50)
                .map((row) => (
                  <li key={`${row.line}-${row.source}`}>
                    <span className="hg-redirects__summary-line">Line {row.line}</span>
                    <span className="hg-redirects__summary-source">{row.source || '(empty)'}</span>
                    <span
                      className={`hg-redirects__summary-status hg-redirects__summary-status--${row.status}`}
                    >
                      {row.status}
                    </span>
                    <span className="hg-redirects__summary-reason">{row.reason}</span>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
