import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Packing list categories.
 *
 * The single flat `packingList` array becomes three accordions on the trip page, driven by a new
 * `category` column on `trips_packing_list` (and `_trips_v_version_packing_list` for drafts):
 *
 *   'clothing-footwear' | 'trekking-equipment' | 'personal-items'
 *
 * Existing rows are **back-filled in SQL**, not left null. A null category would still render (the
 * frontend falls back to a keyword guess — see `src/lib/trip-packing.ts`), but the editor would then
 * show every historical item as unfiled and an editor would have to triage the list by hand. The
 * CASE below uses the same literal vocabulary as the frontend, so live pages do not change shape on
 * deploy: whatever an editor sees after the migration is what the public page already showed.
 *
 * Nullable on purpose: the field is a localized optional select, so a translation can be saved
 * without re-tagging every row, and `down()` can simply drop the column.
 *
 * Re-runnable: the types are created inside a `DO` block that swallows "already exists", the
 * columns use IF NOT EXISTS, and the back-fill only touches rows where `category` is still null.
 * Concurrent boots are serialised by `src/lib/migration-guard.ts`.
 */

/** The three category values, as a literal SQL list (used inside the enum definitions). */
const CATEGORY_VALUES = `'clothing-footwear', 'trekking-equipment', 'personal-items'`

/**
 * Classifies a legacy item by whole word (`\m` … `\M` in a POSIX regex, so "cap" does not catch
 * "capacity"). Clothing wins, then personal items, then equipment — the same precedence as
 * `inferPackingCategory()` in `src/lib/trip-packing.ts`.
 */
const CLASSIFY_ITEM = sql.raw(`CASE
  WHEN "item" ~* '(\\mjacket\\M|\\mdown\\M|\\mfleece\\M|\\mshirt\\M|\\msock\\M|\\msocks\\M|\\mtrouser\\M|\\mpant\\M|\\mpants\\M|\\mshort\\M|\\mshorts\\M|\\mboot\\M|\\mboots\\M|\\mshoe\\M|\\mshoes\\M|\\msandal\\M|\\msandals\\M|\\mglove\\M|\\mgloves\\M|\\mmitten\\M|\\mmittens\\M|\\mhat\\M|\\mbeanie\\M|\\mcap\\M|\\mscarf\\M|\\mbuff\\M|\\mlayer\\M|\\mlayers\\M|\\mthermal\\M|\\munderwear\\M|\\mgaiter\\M|\\mgaiters\\M|\\msunglass\\M|\\msunglasses\\M|\\mgoggle\\M|\\mgoggles\\M|\\mclothing\\M|\\mfootwear\\M|\\mliner\\M|\\mliners\\M)'
  THEN 'clothing-footwear'
  WHEN "item" ~* '(\\mpassport\\M|\\mvisa\\M|\\mpermit\\M|\\minsurance\\M|\\mmoney\\M|\\mcash\\M|\\mtowel\\M|\\mtoiletries\\M|\\mtoothbrush\\M|\\mtoothpaste\\M|\\msoap\\M|\\msunscreen\\M|\\msunblock\\M|\\mbalm\\M|\\mmedicine\\M|\\mmedication\\M|\\mpill\\M|\\mpills\\M|\\mdiamox\\M|\\mpurification\\M|\\mbottle\\M|\\mbladder\\M|\\mbook\\M|\\mjournal\\M|\\mnotebook\\M|\\mphone\\M|\\mcharger\\M|\\mbattery\\M|\\mbatteries\\M|\\mcamera\\M|\\msnack\\M|\\msnacks\\M|\\melectrolyte\\M|\\melectrolytes\\M|\\msanitiser\\M|\\msanitizer\\M|\\mearplug\\M|\\mearplugs\\M|\\mtissue\\M|\\mtissues\\M|\\mrazor\\M|\\mbrush\\M)'
  THEN 'personal-items'
  ELSE 'trekking-equipment'
END`)

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // `CREATE TYPE` has no IF NOT EXISTS in older Postgres, so each one runs in a DO block that
  // treats "already exists" as success.
  await db.execute(
    sql.raw(`DO $$ BEGIN
      CREATE TYPE "public"."enum_trips_packing_list_category" AS ENUM(${CATEGORY_VALUES});
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`),
  )
  await db.execute(
    sql.raw(`DO $$ BEGIN
      CREATE TYPE "public"."enum__trips_v_version_packing_list_category" AS ENUM(${CATEGORY_VALUES});
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;`),
  )

  await db.execute(sql`
    ALTER TABLE "trips_packing_list"
      ADD COLUMN IF NOT EXISTS "category" "public"."enum_trips_packing_list_category";
    ALTER TABLE "_trips_v_version_packing_list"
      ADD COLUMN IF NOT EXISTS "category" "public"."enum__trips_v_version_packing_list_category";

    UPDATE "trips_packing_list"
      SET "category" = ${CLASSIFY_ITEM}::"public"."enum_trips_packing_list_category"
      WHERE "category" IS NULL;

    UPDATE "_trips_v_version_packing_list"
      SET "category" = ${CLASSIFY_ITEM}::"public"."enum__trips_v_version_packing_list_category"
      WHERE "category" IS NULL;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "trips_packing_list" DROP COLUMN IF EXISTS "category";
    ALTER TABLE "_trips_v_version_packing_list" DROP COLUMN IF EXISTS "category";
    DROP TYPE IF EXISTS "public"."enum_trips_packing_list_category";
    DROP TYPE IF EXISTS "public"."enum__trips_v_version_packing_list_category";`)
}
