import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Gives every account a public profile slug — the `/authors/<slug>` URL.
 *
 * Two steps, in this order, because the column is `unique`:
 *
 *   1. Add `users.slug` as nullable.
 *   2. Backfill it from `name`, de-duplicating in `id` order, so the first account keeps the
 *      readable slug and the second becomes `name-2`. Existing accounts therefore get a working
 *      URL the moment the migration finishes — nothing is left for an editor to fix by hand.
 *   3. Only then create the unique index, which is what makes a duplicate impossible from here on.
 *
 * Users are not versioned, so there is no `_users_v` pair to keep in sync (unlike Trips).
 * The slugify below mirrors `formatSlug()` in `src/fields/slug.ts`; it is duplicated rather than
 * imported so the migration stays a self-contained, one-shot script that cannot break when the
 * shared helper changes later.
 */
const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (é -> e)
    .replace(/ß/g, 'ss')
    .replace(/[’'“”]/g, '') // drop apostrophes/quotes
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase()

type UserRow = { id: number; name: string; slug: string | null }

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "slug" varchar;`)

  const result = (await db.execute(
    sql`SELECT "id", "name", "slug" FROM "users" ORDER BY "id" ASC`,
  )) as unknown as UserRow[] | { rows?: UserRow[] }

  const rows = Array.isArray(result) ? result : (result?.rows ?? [])
  const used = new Set<string>()

  // Reserve the slugs that already exist first, so a backfill can never steal one.
  for (const row of rows) {
    if (row.slug) used.add(row.slug)
  }

  for (const row of rows) {
    if (row.slug) continue

    const base = slugify(row.name)
    if (!base) continue

    let candidate = base
    for (let attempt = 2; used.has(candidate); attempt += 1) {
      candidate = `${base}-${attempt}`
    }
    used.add(candidate)

    await db.execute(sql`UPDATE "users" SET "slug" = ${candidate} WHERE "id" = ${row.id}`)
  }

  // Payload names a field's unique index `<table>_<field>_idx`, matching `users_email_idx`.
  await db.execute(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_slug_idx" ON "users" USING btree ("slug");`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "users_slug_idx";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "slug";
  `)
}
