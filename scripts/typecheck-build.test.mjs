/**
 * The whole-project type gate in front of `next build`.
 *
 * This exists because a real deploy was lost to exactly the bug it prevents: PR #200 shipped
 * `region: 'eastern'` (and four siblings) into a field typed `Destination['region']`. The Vercel
 * deployment failed on the PR and again on the merge commit — reported only as "Deployment has
 * failed" — and the merge had to be reverted. These tests pin both halves of the guarantee:
 *
 *   1. it FAILS on a type error, with the offending file named, so a deploy cannot ship one;
 *   2. it SKIPS (exit 0) when TypeScript is not installed, so a production-only install is not
 *      blocked by its own tooling.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = fileURLToPath(new URL('./typecheck-build.mjs', import.meta.url))

/** Builds a throwaway project with the given `tsconfig.json` and files. */
const fixture = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'hg-typecheck-'))
  for (const [path, contents] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(join(full, '..'), { recursive: true })
    writeFileSync(full, contents)
  }
  return root
}

const run = (cwd) => spawnSync(process.execPath, [script], { cwd, encoding: 'utf8' })

const TSCONFIG = JSON.stringify({
  compilerOptions: {
    strict: true,
    noEmit: true,
    incremental: true,
    skipLibCheck: true,
    target: 'ES2022',
    module: 'esnext',
    moduleResolution: 'bundler',
    types: [],
  },
  include: ['**/*.ts'],
})

test('a clean project passes', () => {
  const cwd = fixture({
    'tsconfig.json': TSCONFIG,
    'src/fine.ts': 'export const value: number = 1\n',
  })

  const result = run(cwd)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /No type errors/)
})

test('a type error fails the build, naming the file', () => {
  const cwd = fixture({
    'tsconfig.json': TSCONFIG,
    'src/regression.ts': [
      "type Region = 'khumbu' | 'annapurna'",
      'type Destination = { region: Region }',
      "const card: Destination = { region: 'eastern' }",
      'export default card',
      '',
    ].join('\n'),
  })

  const result = run(cwd)
  assert.equal(result.status, 1, 'a type error must not reach `next build`')
  assert.match(result.stderr, /regression\.ts/, 'the failing file must be named')
  assert.match(result.stderr, /refusing to build/i)
})

test('a project with no tsconfig is skipped rather than failed', () => {
  const cwd = fixture({ 'README.md': 'nothing to compile\n' })

  const result = run(cwd)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /No tsconfig\.json/)
})
