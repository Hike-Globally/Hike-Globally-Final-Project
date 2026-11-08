import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * SEO → Redirections: the `redirections` table (collection `src/collections/Redirections.ts`).
 *
 * What this creates, and why each piece is needed:
 *
 *   redirections                     the rules themselves. `source_path` is unique — that index, not
 *                                    the hook, is what makes a duplicate impossible under
 *                                    concurrency — and `status_code` is a Postgres enum, so a value
 *                                    outside 301/302/307/308 cannot be stored even by a raw query.
 *   enum_redirections_status_code    the four status codes Payload's select offers.
 *   payload_locked_documents_rels    Payload's document locks are on by default, so the lock table
 *                                    needs a `redirections_id` column (and its FK + index) or the
 *                                    edit view fails when it takes the lock.
 *
 * Timestamps and defaults mirror what `payload migrate:create` emits for the same config: Payload's
 * `updated_at` / `created_at` indexes included, `hit_count numeric DEFAULT 0`, `is_active boolean
 * DEFAULT true`.
 *
 * Everything is guarded (`IF NOT EXISTS`, `duplicate_object`) so a half-applied run, a development
 * database that already pushed the schema, or two boots racing cannot fail the deploy. Concurrent
 * boots are additionally serialised by `src/lib/migration-guard.ts`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_redirections_status_code" AS ENUM('301', '302', '307', '308');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "redirections" (
      "id" serial PRIMARY KEY NOT NULL,
      "source_path" varchar NOT NULL,
      "destination_url" varchar NOT NULL,
      "status_code" "enum_redirections_status_code" DEFAULT '301' NOT NULL,
      "is_active" boolean DEFAULT true,
      "note" varchar,
      "hit_count" numeric DEFAULT 0,
      "last_hit_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "redirections_source_path_idx"
      ON "redirections" USING btree ("source_path");
    CREATE INDEX IF NOT EXISTS "redirections_is_active_idx"
      ON "redirections" USING btree ("is_active");
    CREATE INDEX IF NOT EXISTS "redirections_updated_at_idx"
      ON "redirections" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "redirections_created_at_idx"
      ON "redirections" USING btree ("created_at");
  `)

  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "redirections_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_redirections_fk"
        FOREIGN KEY ("redirections_id")
        REFERENCES "public"."redirections"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_redirections_id_idx"
      ON "payload_locked_documents_rels" USING btree ("redirections_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_redirections_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_redirections_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "redirections_id";
    DROP TABLE IF EXISTS "redirections" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_redirections_status_code";
  `)
}
