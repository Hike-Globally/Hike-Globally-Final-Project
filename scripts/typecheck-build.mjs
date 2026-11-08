/**
 * Strict, whole-project TypeScript gate in front of `next build`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Why this exists
 * ─────────────────────────────────────────────────────────────────────────────
 * On 2026-11-08 the Destinations landing page was rewritten with a hardcoded array of regions:
 *
 *     region: 'eastern' | 'central' | 'western' | 'mid-western' | 'far-western'
 *
 * while `Destination['region']` is Payload's select union (`'khumbu' | 'annapurna' | …`). Five
 * `TS2322` errors. The Vercel deployment failed on the PR and again on the merge commit
 * (`dpl_FHjkF8…`, `dpl_HzGMnq…`), the branch had to be reverted, and the only thing the pull
 * request ever showed was "Deployment has failed" — no file, no line, no reason.
 *
 * `next build` does type-check (`typescript.ignoreBuildErrors` is false), so the error would have
 * stopped the build anyway. What it did not do was make the failure *legible*: the type check is
 * one late line inside a long build log, it runs after the whole app has compiled, and its output
 * never reaches the PR. This step runs the same check as a named, first-class step — in ~13 s,
 * before `next build` compiles anything, printing the file, line, expected type and a short
 * "refusing to build" summary that survives in the Vercel log and reads the same locally.
 *
 * It is also a *whole-project* check: `tsconfig.json` includes every `.ts`/`.tsx` file in the repo,
 * so a module nothing imports yet is type-checked too, which is exactly where a landing page gets
 * written before it is wired up.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Why it is a script and not `tsc --noEmit` in the build command
 * ─────────────────────────────────────────────────────────────────────────────
 * Two reasons:
 *
 *   1. `tsconfig.json` sets `incremental: true`; `tsc --noEmit` with `incremental` writes a
 *      `.tsbuildinfo` and, because `noEmit` disables the incremental read path in some versions,
 *      either does nothing useful or errors with TS5069. This script loads the project's own
 *      options and forces `incremental: false`, so it behaves identically on a laptop, in CI and on
 *      Vercel with no extra configuration.
 *
 *   2. It skips cleanly (exit 0) when the toolchain is not installed — e.g. a production install
 *      with `--omit=dev`, where `typescript` is absent and there is nothing to compile with. A gate
 *      that crashes the build because its own tool is missing would be worse than no gate.
 *
 * Usage:
 *   node scripts/typecheck-build.mjs        # part of `npm run build`
 *   npm run typecheck                       # the same check, directly
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const log = (message) => console.log(`[typecheck-build] ${message}`)

let ts
try {
  ts = require('typescript')
} catch {
  log('TypeScript is not installed (production install?) — skipping the type gate.')
  process.exit(0)
}

const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json')
if (!configPath) {
  log('No tsconfig.json found — skipping the type gate.')
  process.exit(0)
}

const readConfig = ts.readConfigFile(configPath, ts.sys.readFile)
if (readConfig.error) {
  console.error(
    `[typecheck-build] tsconfig.json could not be read: ${ts.flattenDiagnosticMessageText(
      readConfig.error.messageText,
      ' ',
    )}`,
  )
  process.exit(1)
}

const parsed = ts.parseJsonConfigFileContent(
  readConfig.config,
  ts.sys,
  process.cwd(),
  undefined,
  configPath,
)

log(`Type-checking ${parsed.fileNames.length} files (strict, whole project)…`)

const program = ts.createProgram(parsed.fileNames, {
  ...parsed.options,
  noEmit: true,
  // See the header: incremental + noEmit is the one combination that misbehaves.
  incremental: false,
})

const diagnostics = ts.getPreEmitDiagnostics(program)

if (diagnostics.length === 0) {
  log('No type errors.')
  process.exit(0)
}

const host = {
  getCanonicalFileName: (fileName) => fileName,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => '\n',
}

console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host))
console.error(
  `\n[typecheck-build] ${diagnostics.length} type error${
    diagnostics.length === 1 ? '' : 's'
  } — refusing to build. The production build would fail on these, and a deploy must not\n` +
    'ship them.\n' +
    'Fix the errors above (or run `npm run typecheck` for the same output), then rebuild.',
)
process.exit(1)
