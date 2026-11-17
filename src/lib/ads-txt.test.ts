/**
 * `/ads.txt` — the AdSense publisher manifest, and the guardrail against it being broken again.
 *
 * AdSense has twice reported "ads.txt status: Not found" on a site whose repo *did* contain an
 * `ads.txt`, because the file in the repo was not the file AdSense crawls. The manifest is
 * `public/ads.txt`, and Next.js copies `public/` to the deployment root, so it is served at
 * `https://<host>/ads.txt`. A file at the repo root is never served to anyone — and the one that
 * used to sit there was not a manifest at all, but the `<script>` loader snippet (a page's
 * `<head>` content, in HTML, with Windows line endings). That snippet has since been deleted, so
 * the loader now lives only inline in the root layout and `public/ads.txt` is the only `ads.txt`
 * in the repo; this test keeps the second one from ever coming back.
 *
 * So this file pins down all three things AdSense actually checks, plus the trap that caused the
 * confusion:
 *
 *   1. the manifest exists in `public/`, at the exact spelling AdSense requests;
 *   2. its contents parse as ads.txt — one `google.com, pub-…, DIRECT, f08c47fec0942fa0` line, no
 *      BOM, no CRLF, nothing that makes an ads.txt parser skip the line;
 *   3. the publisher ID on that line is the same account the AdSense loader in the root layout
 *      loads, because a manifest naming a different publisher is read as "unauthorized";
 *   4. no second `ads.txt` exists at the repo root to be mistaken for it.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const manifestPath = path.join(repoRoot, 'public', 'ads.txt')
const layoutPath = path.join(repoRoot, 'src', 'app', '(frontend)', 'layout.tsx')

/** The IAB Tech Lab certification authority ID Google publishes for its own ads.txt line. */
const GOOGLE_CERTIFICATION_AUTHORITY_ID = 'f08c47fec0942fa0'

test('the manifest is served from public/, at the exact spelling AdSense requests', () => {
  // Next.js maps `public/ads.txt` to `<origin>/ads.txt`. A root-level file is never deployed.
  assert.ok(existsSync(manifestPath), 'public/ads.txt is the file served at /ads.txt')
  assert.ok(
    !existsSync(path.join(repoRoot, 'ads.txt')),
    'a repo-root ads.txt is never served and only invites the wrong file being edited',
  )
})

test('the served file is a valid ads.txt, not the AdSense <script> snippet', () => {
  const raw = readFileSync(manifestPath)
  const text = raw.toString('utf8')

  // Every one of these silently breaks parsing rather than 404ing, so AdSense reports "not found".
  assert.notEqual(raw.subarray(0, 3).toString('hex'), 'efbbbf', 'a UTF-8 BOM is not allowed')
  assert.ok(!text.includes('\r'), 'ads.txt must use LF line endings, not CRLF')
  assert.ok(!/<[a-z!/]/i.test(text), 'the manifest must not contain HTML or a <script> tag')
  assert.ok(text.endsWith('\n'), 'the file must end with a newline so the last record is read')

  const records = text
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim()) // ads.txt comments start with '#'
    .filter((line) => line !== '')

  assert.ok(records.length > 0, 'the manifest must contain at least one record')
  for (const record of records) {
    const fields = record.split(',').map((field) => field.trim())
    assert.equal(fields.length, 4, `not a 4-field ads.txt record: ${JSON.stringify(record)}`)
  }

  const google = records.map((record) => record.split(',').map((f) => f.trim()))
  assert.ok(
    google.some(
      ([domain, , relationship, cert]) =>
        domain.toLowerCase() === 'google.com' &&
        relationship.toUpperCase() === 'DIRECT' &&
        cert.toLowerCase() === GOOGLE_CERTIFICATION_AUTHORITY_ID,
    ),
    'the manifest must authorise google.com as DIRECT with Google’s certification authority ID',
  )
})

test('the manifest names the same publisher the AdSense loader on every page loads', () => {
  const manifestPublisher = /pub-\d{16}/.exec(readFileSync(manifestPath, 'utf8'))?.[0]
  assert.ok(manifestPublisher, 'the manifest must contain a 16-digit pub-… publisher ID')

  // `ca-pub-…` in the loader snippet and `pub-…` in ads.txt are the same account; a mismatch is
  // what AdSense reports as "ads.txt unauthorized" on a file it can otherwise read.
  const layout = readFileSync(layoutPath, 'utf8')
  const loadedPublisher = /ca-(pub-\d{16})/.exec(layout)?.[1]

  assert.equal(
    manifestPublisher,
    loadedPublisher,
    'public/ads.txt and the AdSense loader in the root layout must name the same publisher ID',
  )
})
