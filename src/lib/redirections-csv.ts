/**
 * CSV import / export for the Redirections module.
 *
 * The file format is the one an editor can produce in a spreadsheet:
 *
 *     source,destination,status_code,is_active,note
 *     /old-page,/new-page,301,true,Retired in the 2026 relaunch
 *
 * Import is planned *before* anything is written (see `planRedirectionsImport`): the same pure
 * validation the form uses decides which rows are added, which are skipped because a rule already
 * exists, and which failed and why. That makes the summary an honest report instead of a partial
 * write, and it keeps the endpoint to one database call per accepted row.
 */

import {
  analyseRedirection,
  normaliseDestinationUrl,
  normalisePathForMatch,
  normaliseSourcePath,
  toStatusCode,
  type RedirectionRule,
  type RedirectStatusCodeString,
} from './redirections'

export const REDIRECTION_CSV_COLUMNS = [
  'source',
  'destination',
  'status_code',
  'is_active',
  'note',
] as const

/** Accepted header spellings, so a CSV exported from the database panel or hand-written both work. */
const HEADER_ALIASES: Record<string, (typeof REDIRECTION_CSV_COLUMNS)[number]> = {
  source: 'source',
  source_path: 'source',
  sourcepath: 'source',
  from: 'source',
  destination: 'destination',
  destination_url: 'destination',
  destinationurl: 'destination',
  to: 'destination',
  status_code: 'status_code',
  statuscode: 'status_code',
  status: 'status_code',
  is_active: 'is_active',
  isactive: 'is_active',
  active: 'is_active',
  enabled: 'is_active',
  note: 'note',
  notes: 'note',
  comment: 'note',
}

export type CsvRecord = {
  /** 1-based line number in the uploaded file, header included — what a summary points at. */
  line: number
  source: string
  destination: string
  statusCode: string
  isActive: string
  note: string
}

export type CsvParseResult =
  | { ok: true; rows: CsvRecord[] }
  | { ok: false; error: string }

/**
 * A small RFC 4180 reader: quoted fields, doubled quotes, CRLF or LF, a leading BOM and blank
 * lines. Spreadsheet exports are the normal input, so this accepts their dialects rather than
 * demanding a canonical one.
 */
export const parseCsv = (input: string, maxRows = 1000): CsvParseResult => {
  const text = input.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (inQuotes) return { ok: false, error: 'The CSV has an unclosed quote.' }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const nonEmpty = rows.filter((cells) => cells.some((cell) => cell.trim().length > 0))
  if (nonEmpty.length === 0) return { ok: false, error: 'The file is empty.' }

  // "Source Path", "source_path" and "source" are the same column.
  const header = nonEmpty[0].map((cell) => cell.trim().toLowerCase().replace(/[\s-]+/g, '_'))
  const mapped = header.map((cell) => HEADER_ALIASES[cell])
  if (!mapped.includes('source') || !mapped.includes('destination')) {
    return {
      ok: false,
      error: 'The header must include “source” and “destination” columns.',
    }
  }

  const dataRows = nonEmpty.slice(1)
  if (dataRows.length === 0) return { ok: false, error: 'The file has no data rows.' }
  if (dataRows.length > maxRows) {
    return { ok: false, error: `Import at most ${maxRows} rows at a time.` }
  }

  const records: CsvRecord[] = dataRows.map((cells, rowIndex) => {
    const value = (name: (typeof REDIRECTION_CSV_COLUMNS)[number]): string => {
      const columnIndex = mapped.indexOf(name)
      return columnIndex === -1 ? '' : (cells[columnIndex] ?? '').trim()
    }

    return {
      // +2: one for the header row, one for 1-based numbering.
      line: rowIndex + 2,
      source: value('source'),
      destination: value('destination'),
      statusCode: value('status_code'),
      isActive: value('is_active'),
      note: value('note'),
    }
  })

  return { ok: true, rows: records }
}

export type ImportedRedirection = {
  line: number
  sourcePath: string
  destinationUrl: string
  statusCode: RedirectStatusCodeString
  isActive: boolean
  note?: string
}

export type ImportOutcome =
  | { line: number; source: string; status: 'added'; row: ImportedRedirection }
  | { line: number; source: string; status: 'skipped'; reason: string }
  | { line: number; source: string; status: 'failed'; reason: string }

export type ImportPlan = {
  outcomes: ImportOutcome[]
  /** Convenience copies of the counts the admin summary reports. */
  added: number
  skipped: number
  failed: number
}

const parseBoolean = (value: string): boolean | null => {
  if (value === '') return true
  const normalised = value.toLowerCase()
  if (['true', '1', 'yes', 'y', 'on', 'active', 'enabled'].includes(normalised)) return true
  if (['false', '0', 'no', 'n', 'off', 'inactive', 'disabled'].includes(normalised)) return false
  return null
}

/**
 * Decides what an upload would do, without writing anything. Rows are checked in file order and
 * each accepted row joins the rule set for the next one, so a file that lists the same source twice
 * reports the second occurrence as skipped rather than racing the unique index.
 */
export const planRedirectionsImport = ({
  csv,
  existingRules,
  siteUrl,
  maxRows = 1000,
}: {
  csv: string
  existingRules: RedirectionRule[]
  siteUrl?: string
  maxRows?: number
}): ImportPlan & { parseError?: string } => {
  const parsed = parseCsv(csv, maxRows)
  if (!parsed.ok) {
    return { outcomes: [], added: 0, skipped: 0, failed: 0, parseError: parsed.error }
  }

  const rules: RedirectionRule[] = [...existingRules]
  const outcomes: ImportOutcome[] = []

  for (const record of [...parsed.rows].sort((a, b) => a.line - b.line)) {
    const source = normaliseSourcePath(record.source)
    const sourceLabel = source.ok ? source.value : record.source

    const statusCode = record.statusCode === '' ? '301' : record.statusCode
    if (!['301', '302', '307', '308'].includes(statusCode)) {
      outcomes.push({
        line: record.line,
        source: sourceLabel,
        status: 'failed',
        reason: `status_code must be 301, 302, 307 or 308 (got “${record.statusCode}”).`,
      })
      continue
    }

    const isActive = parseBoolean(record.isActive)
    if (isActive === null) {
      outcomes.push({
        line: record.line,
        source: sourceLabel,
        status: 'failed',
        reason: `is_active must be true or false (got “${record.isActive}”).`,
      })
      continue
    }

    // A source that already has a rule is *skipped*, not failed: re-importing an export is a
    // normal thing to do and should not look like an error.
    const alreadyExists =
      source.ok &&
      rules.some((rule) => normalisePathForMatch(rule.sourcePath) === source.value)

    if (alreadyExists) {
      outcomes.push({
        line: record.line,
        source: sourceLabel,
        status: 'skipped',
        reason: 'A redirection for this source path already exists.',
      })
      continue
    }

    const analysis = analyseRedirection(
      {
        sourcePath: record.source,
        destinationUrl: record.destination,
        statusCode,
      },
      rules,
      { siteUrl },
    )

    const messages = [
      analysis.errors.sourcePath,
      analysis.errors.destinationUrl,
      analysis.errors.statusCode,
    ].filter((message): message is string => Boolean(message))

    if (messages.length > 0) {
      outcomes.push({
        line: record.line,
        source: sourceLabel,
        status: 'failed',
        reason: messages.join(' '),
      })
      continue
    }

    const destination = normaliseDestinationUrl(record.destination)
    if (!destination.ok) {
      outcomes.push({
        line: record.line,
        source: sourceLabel,
        status: 'failed',
        reason: destination.error,
      })
      continue
    }

    const row: ImportedRedirection = {
      line: record.line,
      sourcePath: analysis.sourcePath,
      destinationUrl: destination.value,
      statusCode: String(toStatusCode(statusCode)) as RedirectStatusCodeString,
      isActive,
      note: record.note || undefined,
    }

    rules.push({
      id: `import-${record.line}`,
      sourcePath: row.sourcePath,
      destinationUrl: row.destinationUrl,
      statusCode: Number(row.statusCode),
      isActive: row.isActive,
    })

    outcomes.push({
      line: record.line,
      source: row.sourcePath,
      status: 'added',
      row,
    })
  }

  return {
    outcomes,
    added: outcomes.filter((outcome) => outcome.status === 'added').length,
    skipped: outcomes.filter((outcome) => outcome.status === 'skipped').length,
    failed: outcomes.filter((outcome) => outcome.status === 'failed').length,
  }
}

const escapeCsvCell = (value: string): string =>
  /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

/** Serialises rules for download — the exact columns import accepts, so the round trip is lossless. */
export const serializeRedirectionsCsv = (
  rules: Array<{
    sourcePath: string
    destinationUrl: string
    statusCode: string | number
    isActive?: boolean | null
    note?: string | null
  }>,
): string => {
  const lines = [REDIRECTION_CSV_COLUMNS.join(',')]

  for (const rule of [...rules].sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))) {
    lines.push(
      [
        escapeCsvCell(rule.sourcePath),
        escapeCsvCell(rule.destinationUrl),
        escapeCsvCell(String(toStatusCode(rule.statusCode))),
        escapeCsvCell(rule.isActive === false ? 'false' : 'true'),
        escapeCsvCell(rule.note ?? ''),
      ].join(','),
    )
  }

  return `${lines.join('\n')}\n`
}
