/**
 * Serialised production migrations.
 *
 * The failure these lock down is specific and expensive: Payload applies `prodMigrations` on boot,
 * `next build` boots Payload in several workers, and the workers used to run the same `ALTER TABLE`
 * together — failing the build with `column "…" already exists`. The tests below drive two wrappers
 * against one fake connection to prove the second one waits and then skips.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import test from 'node:test'

import { serialiseMigrations, type Migration, type MigrationDb } from './migration-guard'

/** Minimal stand-in for Payload's `sql` tag: records the query and its bound values. */
const sql = (strings: TemplateStringsArray, ...values: unknown[]) => ({
  text: strings.join('?'),
  values,
})

type Call = { text: string; values: unknown[] }

/**
 * A fake Postgres connection.
 *
 * `recorded` is the set of migration names in `payload_migrations`; `lockHolder` is the name of the
 * advisory lock currently held (one per database, like the real thing). Every call is logged so the
 * tests can assert on ordering.
 */
const fakeDb = (options: { tableExists?: boolean; recorded?: string[] } = {}) => {
  const calls: Call[] = []
  const state = {
    tableExists: options.tableExists ?? true,
    recorded: new Set(options.recorded ?? []),
    lockHolder: null as string | null,
    /** Runs at the end of every `execute`, to let a test simulate another process finishing. */
    onExecute: null as null | ((call: Call) => Promise<void> | void),
  }

  const db: MigrationDb = {
    execute: async (query: unknown) => {
      const call = query as Call
      calls.push(call)
      const text = call.text

      if (text.includes('pg_try_advisory_lock')) {
        const name = String(call.values[1])
        const locked = state.lockHolder === null
        if (locked) state.lockHolder = name
        return { rows: [{ locked }] }
      }

      if (text.includes('pg_advisory_unlock')) {
        state.lockHolder = null
        return { rows: [] }
      }

      if (text.includes('to_regclass')) {
        return { rows: [{ name: state.tableExists ? 'payload_migrations' : null }] }
      }

      if (text.includes('FROM payload_migrations')) {
        const name = String(call.values[0])
        return { rows: state.recorded.has(name) ? [{ '?column?': 1 }] : [] }
      }

      if (state.onExecute) await state.onExecute(call)

      // A DDL statement: simulate the row Payload inserts when a migration finishes.
      const migrating = call.values.find((v) => typeof v === 'string')
      if (migrating) state.recorded.add(String(migrating))
      return { rows: [] }
    },
  }

  return { db, calls, state }
}

const migration = (name: string, body: () => void): Migration & { runs: () => number } => {
  let runs = 0
  return {
    name,
    up: async () => {
      runs += 1
      body()
    },
    down: async () => {},
    runs: () => runs,
  }
}

test('a migration that is already recorded is skipped without running', async () => {
  const { db } = fakeDb({ recorded: ['20261106_120000_trip_brochure'] })
  const m = migration('20261106_120000_trip_brochure', () => {})

  await serialiseMigrations([m], sql)[0]!.up({ db } as never)

  assert.equal(m.runs(), 0)
})

test('a database with no migration table yet runs the first migration', async () => {
  const { db } = fakeDb({ tableExists: false })
  const m = migration('20261003_075051_initial', () => {})

  await serialiseMigrations([m], sql)[0]!.up({ db } as never)

  assert.equal(m.runs(), 1)
})

test('an unrecorded migration runs exactly once, even when two processes boot together', async () => {
  const { db, state } = fakeDb({ recorded: [] })
  let runs = 0
  const m: Migration = {
    name: '20261106_120000_trip_brochure',
    up: async () => {
      runs += 1
      // The winner holds the lock while it works, and records itself before releasing it.
      await new Promise((resolve) => setTimeout(resolve, 60))
      state.recorded.add(m.name)
    },
    down: async () => {},
  }

  const wrapped = serialiseMigrations([m], sql)
  const [first, second] = [wrapped[0]!, wrapped[0]!]

  // Both wrappers boot at the same moment, exactly as two build workers do.
  await Promise.all([first!.up({ db } as never), second!.up({ db } as never)])

  assert.equal(runs, 1, 'the second process must skip the migration the first one recorded')
  assert.equal(state.lockHolder, null, 'the lock is released even on the skip path')
})

test('the lock is released when the migration throws, so a retry can proceed', async () => {
  const { db, state } = fakeDb({ recorded: [] })
  const boom: Migration = {
    name: 'boom',
    up: async () => {
      throw new Error('DDL failed')
    },
    down: async () => {},
  }
  const failing = serialiseMigrations([boom], sql)[0]!

  await assert.rejects(() => failing.up({ db } as never), /DDL failed/)
  assert.equal(state.lockHolder, null)
})

test('a lock that never frees up times out with an actionable message', async () => {
  const { db, state } = fakeDb({ recorded: [] })
  state.lockHolder = 'someone-else' // another build is mid-migration and never finishes

  const m = serialiseMigrations([migration('slow', () => {})], sql)[0]!

  await assert.rejects(
    () => m.up({ db } as never),
    /Timed out after \d+s waiting for another process to run migration "slow"/,
  )
})

test('every migration keeps its name, order and down function', () => {
  const input: Migration[] = [
    { name: 'a', up: async () => {}, down: async () => {} },
    { name: 'b', up: async () => {}, down: async () => {} },
  ]

  const wrapped = serialiseMigrations(input, sql)

  assert.deepEqual(
    wrapped.map((m) => m.name),
    ['a', 'b'],
  )
  assert.equal(wrapped[0]!.down, input[0]!.down)
  assert.notEqual(wrapped[0]!.up, input[0]!.up, 'up is wrapped; everything else is passed through')
})
