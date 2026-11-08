/**
 * CSV import/export tests. The import summary is a promise to the admin ("3 added, 1 skipped
 * because it already exists, 1 failed because …"), so it has to be planned accurately before a
 * single row is written.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import type { RedirectionRule } from '@/lib/redirections'
import {
  parseCsv,
  planRedirectionsImport,
  serializeRedirectionsCsv,
} from '@/lib/redirections-csv'

const rule = (sourcePath: string, destinationUrl = '/new'): RedirectionRule => ({
  id: sourcePath,
  sourcePath,
  destinationUrl,
  statusCode: 301,
  isActive: true,
})

/* -------------------------------------------------------------------------------------------- */
/* Parsing                                                                                       */
/* -------------------------------------------------------------------------------------------- */

test('parses the documented header and rows', () => {
  const result = parseCsv(
    ['source,destination,status_code,is_active,note', '/old,/new,301,true,Retired page', '/a,/b,302,false,'].join(
      '\n',
    ),
  )

  assert.equal(result.ok, true)
  if (!result.ok) return

  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rows[0], {
    line: 2,
    source: '/old',
    destination: '/new',
    statusCode: '301',
    isActive: 'true',
    note: 'Retired page',
  })
  assert.equal(result.rows[1].isActive, 'false')
})

test('handles quoted fields, doubled quotes, CRLF and a BOM', () => {
  const result = parseCsv(
    '\uFEFFsource,destination,status_code,is_active,note\r\n"/old, with comma","/new",301,true,"say ""hi"""\r\n',
  )

  assert.equal(result.ok, true)
  if (!result.ok) return

  assert.equal(result.rows[0].source, '/old, with comma')
  assert.equal(result.rows[0].note, 'say "hi"')
})

test('accepts the header spellings a spreadsheet or the API might produce', () => {
  const result = parseCsv('Source Path,Destination URL,Status,Active,Notes\n/old,/new,301,yes,moved')

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.rows[0].source, '/old')
  assert.equal(result.rows[0].isActive, 'yes')
})

test('rejects a file without source and destination columns', () => {
  assert.equal(parseCsv('alpha,beta\n/a,/b').ok, false)
})

test('rejects empty files, header-only files and unclosed quotes', () => {
  assert.equal(parseCsv('').ok, false)
  assert.equal(parseCsv('source,destination\n').ok, false)
  assert.equal(parseCsv('source,destination\n"/a,/b\n').ok, false)
})

test('caps the number of rows', () => {
  const rows = ['source,destination']
  for (let index = 0; index < 10; index += 1) rows.push(`/s${index},/d${index}`)

  const result = parseCsv(rows.join('\n'), 5)
  assert.equal(result.ok, false)
})

/* -------------------------------------------------------------------------------------------- */
/* Import planning                                                                               */
/* -------------------------------------------------------------------------------------------- */

test('plans added, skipped and failed rows with reasons', () => {
  const existing = [rule('/already-there')]
  const csv = [
    'source,destination,status_code,is_active,note',
    '/new-page,/target,301,true,Fine',
    '/already-there,/target,301,true,Duplicate',
    '/bad-dest,javascript:alert(1),301,true,Unsafe',
    '/bad-status,/target,410,true,Bad code',
    '/bad-active,/target,301,maybe,Bad flag',
  ].join('\n')

  const plan = planRedirectionsImport({ csv, existingRules: existing })

  assert.equal(plan.added, 1)
  assert.equal(plan.skipped, 1)
  assert.equal(plan.failed, 3)

  const bySource = new Map(plan.outcomes.map((outcome) => [outcome.line, outcome]))
  assert.equal(bySource.get(2)?.status, 'added')
  assert.equal(bySource.get(3)?.status, 'skipped')
  assert.match((bySource.get(3) as { reason: string }).reason, /already exists/)

  assert.equal(bySource.get(4)?.status, 'failed')
  assert.match((bySource.get(4) as { reason: string }).reason, /http|path/i)

  assert.equal(bySource.get(5)?.status, 'failed')
  assert.match((bySource.get(5) as { reason: string }).reason, /301, 302, 307 or 308/)

  assert.equal(bySource.get(6)?.status, 'failed')
  assert.match((bySource.get(6) as { reason: string }).reason, /true or false/)
})

test('normalises what it accepts, so an import cannot introduce a duplicate spelling', () => {
  const plan = planRedirectionsImport({
    csv: [
      'source,destination',
      'https://hikeglobally.com/Old-Page/,/new',
      '/old-page/,/somewhere-else',
    ].join('\n'),
    existingRules: [],
  })

  assert.equal(plan.added, 1)
  assert.equal(plan.skipped, 1)
  assert.equal(plan.outcomes[0].status, 'added')
  assert.equal((plan.outcomes[0] as { row: { sourcePath: string } }).row.sourcePath, '/old-page')
})

test('a file that loops internally fails the offending row instead of creating it', () => {
  const plan = planRedirectionsImport({
    csv: ['source,destination', '/a,/b', '/b,/a'].join('\n'),
    existingRules: [],
  })

  assert.equal(plan.added, 1)
  assert.equal(plan.failed, 1)
  assert.match((plan.outcomes[1] as { reason: string }).reason, /loop/i)
})

test('protected and empty sources are reported as failures, not silently dropped', () => {
  const plan = planRedirectionsImport({
    csv: ['source,destination', '/admin,/new', ',/new'].join('\n'),
    existingRules: [],
  })

  assert.equal(plan.added, 0)
  assert.equal(plan.failed, 2)
})

test('a parse error is returned without touching anything', () => {
  const plan = planRedirectionsImport({ csv: 'nonsense', existingRules: [] })
  assert.ok(plan.parseError)
  assert.equal(plan.outcomes.length, 0)
})

/* -------------------------------------------------------------------------------------------- */
/* Export                                                                                        */
/* -------------------------------------------------------------------------------------------- */

test('exports the importable columns, sorted, with quotes where needed', () => {
  const csv = serializeRedirectionsCsv([
    { sourcePath: '/z', destinationUrl: 'https://example.com/a,b', statusCode: '308', isActive: false, note: 'say "hi"' },
    { sourcePath: '/a', destinationUrl: '/b', statusCode: 301, isActive: true, note: '' },
  ])

  const lines = csv.trim().split('\n')
  assert.equal(lines[0], 'source,destination,status_code,is_active,note')
  assert.equal(lines[1], '/a,/b,301,true,')
  assert.equal(lines[2], '/z,"https://example.com/a,b",308,false,"say ""hi"""')
})

test('an export can be imported back unchanged', () => {
  const csv = serializeRedirectionsCsv([
    { sourcePath: '/old', destinationUrl: '/new', statusCode: '301', isActive: true, note: 'Moved' },
  ])

  const plan = planRedirectionsImport({ csv, existingRules: [] })
  assert.equal(plan.added, 1)

  const row = (plan.outcomes[0] as { row: { sourcePath: string; destinationUrl: string; note?: string } }).row
  assert.deepEqual(
    { sourcePath: row.sourcePath, destinationUrl: row.destinationUrl, note: row.note },
    { sourcePath: '/old', destinationUrl: '/new', note: 'Moved' },
  )
})
