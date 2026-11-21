import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Old seeds copied frontend defaults into editable SEO overrides. Unpin only the exact
// shipped values, independently, so a custom title paired with a stock description survives.
const stockTitle = 'Hike Globally | Family Tours, Trekking & Travel Guides'
const stockDescription =
  'Discover family tours, treks and global destinations with Hike Globally. Explore travel guides, expert tips and inspiring ideas for your next adventure.'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE pages_locales SET
      meta_title = NULLIF(meta_title, ${stockTitle}),
      meta_description = NULLIF(meta_description, ${stockDescription})
    WHERE _locale = 'en' AND slug = 'home'
      AND (meta_title = ${stockTitle} OR meta_description = ${stockDescription})
  `)
  // Keep the current draft consistent without rewriting historical revisions.
  await db.execute(sql`
    UPDATE _pages_v_locales SET
      version_meta_title = NULLIF(version_meta_title, ${stockTitle}),
      version_meta_description = NULLIF(version_meta_description, ${stockDescription})
    WHERE _locale = 'en' AND version_slug = 'home'
      AND _parent_id IN (SELECT id FROM _pages_v WHERE latest = true)
      AND (version_meta_title = ${stockTitle} OR version_meta_description = ${stockDescription})
  `)
}

export async function down(): Promise<void> {
  // Empty overrides resolve to the old defaults on rollback. Filling NULLs would also overwrite
  // intentional blanks on homepages that never used the seed, so no data write is appropriate.
}
