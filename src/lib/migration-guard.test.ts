/**
 * Serialised production migrations.
 *
 * The failure these lock down is specific and expensive: Payload applies `prodMigrations` on boot,
 * `next build` boots Payload in several workers, and the workers used to run the same `ALTER TABLE`
 * together — failing the build with `column "…" already exists` (2026-11-06) and then with a 120s
 * lock timeout (2026-11-07). The tests below drive two wrappers against one fake connection to
 * prove the second one waits, skips, and never repeats the DDL.
 *
 * The fake models the part that actually matters: `@payloadcms/drizzle` records the migration
 * *after* `up` returns and commits after that (`dist/migrate.js` → `runMigrationFile`), and a
 * transaction-scoped advisory lock is dropped by Postgres at that COMMIT/ROLLBACK — not by us.
 * `runAsPayloadDoes` below reproduces that ordering, so a lock released too early cannot pass.
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
 * `recorded` is the set of migration names visible in `payload_migrations` (i.e. committed);
 * `lockHolder` is the name holding the advisory lock (one per database, like the real thing).
 * Every call is logged so the tests can assert on ordering.
 */
const fakeDb = (options: { tableExists?: boolean; recorded?: string[] } = {}) => {
  const calls: Call[] = []
  const state = {
    tableExists: options.tableExists ?? true,
    recorded: new Set(options.recorded ?? []),
    lockHolder: null as string | null,
  }

  const db: MigrationDb = {
    execute: async (query: unknown) => {
      const call = query as Call
      calls.push(call)
      const text = call.text

      if (text.includes('pg_try_advisory_xact_lock')) {
        const name = String(call.values[1])
        const locked = state.lockHolder === null
        if (locked) state.lockHolder = name
        return { rows: [{ locked }] }
      }

      if (text.includes('to_regclass')) {
        return { rows: [{ name: state.tableExists ? 'payload_migrations' : null }] }
      }

      if (text.includes('FROM payload_migrations')) {
        const name = String(call.values[0])
        return { rows: state.recorded.has(name) ? [{ '?column?': 1 }] : [] }
      }

      throw new Error(`unexpected query in migration-guard test: ${text}`)
    },
  }

  /** COMMIT: the row becomes visible to every other process and Postgres drops the xact lock. */
  const commit = (name: string): void => {
    state.recorded.add(name)
    state.lockHolder = null
  }

  /** ROLLBACK: the lock goes, the row never appears. */
  const rollback = (): void => {
    state.lockHolder = null
  }

  return { db, calls, state, commit, rollback }
}

type Fake = ReturnType<typeof fakeDb>

/**
 * Runs a wrapped migration the way `@payloadcms/drizzle` does — `up` inside the transaction, then
 * the `payload_migrations` row, then COMMIT (ROLLBACK if `up` threw) — so the tests exercise the
 * real ordering rather than an idealised one.
 */
const runAsPayloadDoes = async (wrapped: Migration, fake: Fake): Promise<void> => {
  try {
    await wrapped.up({ db: fake.db } as never)
  } catch (err) {
    fake.rollback()
    throw err
  }
  fake.commit(wrapped.name)
}

/** Short timings so the timeout path costs milliseconds instead of production's two minutes. */
const fast = { lockTimeoutMs: 1_000, lockPollMs: 5 }

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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

test('a migration that is already recorded is skipped without taking a lock', async () => {
  const fake = fakeDb({ recorded: ['20261106_120000_trip_brochure'] })
  const m = migration('20261106_120000_trip_brochure', () => {})

  await serialiseMigrations([m], sql)[0]!.up({ db: fake.db } as never)

  assert.equal(m.runs(), 0)
  assert.equal(
    fake.calls.some((call) => call.text.includes('pg_try_advisory_xact_lock')),
    false,
    'an up-to-date database takes no lock at all',
  )
})

test('a database with no migration table yet runs the first migration', async () => {
  const fake = fakeDb({ tableExists: false })
  const m = migration('20261003_075051_initial', () => {})

  await serialiseMigrations([m], sql)[0]!.up({ db: fake.db } as never)

  assert.equal(m.runs(), 1)
})

test('an unrecorded migration runs exactly once, even when two processes boot together', async () => {
  const fake = fakeDb({ recorded: [] })
  let runs = 0
  const m: Migration = {
    name: '20261107_120000_trip_audience',
    up: async () => {
      runs += 1
      // The winner holds the lock while it works, exactly as two build workers overlap.
      await sleep(60)
    },
    down: async () => {},
  }

  const wrapped = serialiseMigrations([m], sql, fast)[0]!
  const finished: string[] = []

  const winner = runAsPayloadDoes(wrapped, fake).then(() => finished.push('winner'))
  await sleep(10) // the second worker boots while the first is mid-migration
  const loser = runAsPayloadDoes(wrapped, fake).then(() => finished.push('loser'))
  await Promise.all([winner, loser])

  assert.equal(runs, 1, 'the second process must skip the migration the first one recorded')
  assert.deepEqual(finished, ['winner', 'loser'], 'the second process waits for the commit')
  assert.equal(fake.state.lockHolder, null)
})

test('the lock outlives `up`, so nobody slips in before the row is committed', async () => {
  // The bug this pins down: releasing a session-level lock inside `up` hands the lock over while
  // the winner's `payload_migrations` row is still uncommitted. The next process then sees
  // "not recorded" and runs the same DDL again.
  const fake = fakeDb({ recorded: [] })
  let runs = 0
  const slippery: Migration = {
    name: 'slippery',
    up: async () => {
      runs += 1
    },
    down: async () => {},
  }
  const wrapped = serialiseMigrations([slippery], sql, fast)[0]!

  await wrapped.up({ db: fake.db } as never)
  assert.equal(fake.state.recorded.has('slippery'), false, 'Payload has not committed yet')

  let secondReturned = false
  const second = wrapped.up({ db: fake.db } as never).then(() => {
    secondReturned = true
  })

  await sleep(40)
  assert.equal(secondReturned, false, 'it must still be waiting: the winner has not committed')
  assert.equal(runs, 1, 'and it must not have re-run the migration in that window')

  fake.commit('slippery') // COMMIT drops the lock and publishes the row
  await second

  assert.equal(secondReturned, true)
  assert.equal(runs, 1, 'the second process sees the committed row and skips')
})

test('a waiter returns as soon as the other process commits, without burning the timeout', async () => {
  const fake = fakeDb({ recorded: [] })
  fake.state.lockHolder = 'another-process' // a lock we will never be handed
  const m = migration('20261107_120000_trip_audience', () => {
    throw new Error('must not run')
  })
  const wrapped = serialiseMigrations([m], sql, { lockTimeoutMs: 5_000, lockPollMs: 5 })[0]!

  const started = Date.now()
  const pending = wrapped.up({ db: fake.db } as never)
  await sleep(30)
  fake.state.recorded.add('20261107_120000_trip_audience') // the other process commits
  await pending

  assert.ok(
    Date.now() - started < 5_000,
    'returned on the recorded check rather than waiting out the timeout',
  )
  assert.equal(m.runs(), 0)
})

test('a lock that never frees up and never commits times out with an actionable message', async () => {
  const fake = fakeDb({ recorded: [] })
  fake.state.lockHolder = 'someone-else' // another build is mid-migration and never finishes

  const m = serialiseMigrations([migration('slow', () => {})], sql, {
    lockTimeoutMs: 120,
    lockPollMs: 5,
  })[0]!

  await assert.rejects(
    () => m.up({ db: fake.db } as never),
    /Timed out after [\d.]+s waiting for another process to run migration "slow"/,
  )
})

test('a rolled-back migration frees the lock, so a retry can run it', async () => {
  const fake = fakeDb({ recorded: [] })
  const boom: Migration = {
    name: 'boom',
    up: async () => {
      throw new Error('DDL failed')
    },
    down: async () => {},
  }
  const failing = serialiseMigrations([boom], sql, fast)[0]!

  await assert.rejects(() => failing.up({ db: fake.db } as never), /DDL failed/)
  assert.equal(
    fake.state.lockHolder,
    'boom',
    'releasing the lock is Postgres’ job at ROLLBACK, not ours',
  )

  fake.rollback()
  assert.equal(fake.state.lockHolder, null)

  const retry = migration('boom', () => {})
  await serialiseMigrations([retry], sql, fast)[0]!.up({ db: fake.db } as never)
  assert.equal(retry.runs(), 1, 'the next process can take the lock and migrate')
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
