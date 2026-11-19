import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

/**
 * Public author expertise and optional trip attribution. Existing profiles and trips stay valid:
 * every new scalar is nullable, and no credentials or guide assignments are backfilled.
 * Users are not versioned; Trips need both live and draft/version relationship columns.
 * The matching snapshot is generated from Payload's current configuration.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" varchar;
    ALTER TABLE "users_locales" ADD COLUMN IF NOT EXISTS "job_title" varchar;
    ALTER TABLE "users_locales" ADD COLUMN IF NOT EXISTS "education" varchar;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_socials_platform" AS ENUM('instagram', 'facebook', 'youtube', 'tiktok', 'linkedin', 'x');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "users_credentials" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "credential" varchar NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "users_socials" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "platform" "public"."enum_users_socials_platform" NOT NULL,
      "url" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "users_credentials" ADD CONSTRAINT "users_credentials_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "users_socials" ADD CONSTRAINT "users_socials_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "users_credentials_order_idx" ON "users_credentials" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_credentials_parent_id_idx" ON "users_credentials" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "users_socials_order_idx" ON "users_socials" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "users_socials_parent_id_idx" ON "users_socials" USING btree ("_parent_id");

    ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "guide_id" integer;
    ALTER TABLE "_trips_v" ADD COLUMN IF NOT EXISTS "version_guide_id" integer;
    DO $$ BEGIN
      ALTER TABLE "trips" ADD CONSTRAINT "trips_guide_id_users_id_fk"
        FOREIGN KEY ("guide_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "_trips_v" ADD CONSTRAINT "_trips_v_version_guide_id_users_id_fk"
        FOREIGN KEY ("version_guide_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "trips_guide_idx" ON "trips" USING btree ("guide_id");
    CREATE INDEX IF NOT EXISTS "_trips_v_version_version_guide_idx" ON "_trips_v" USING btree ("version_guide_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "trips" DROP COLUMN IF EXISTS "guide_id";
    ALTER TABLE "_trips_v" DROP COLUMN IF EXISTS "version_guide_id";
    DROP TABLE IF EXISTS "users_credentials";
    DROP TABLE IF EXISTS "users_socials";
    DROP TYPE IF EXISTS "public"."enum_users_socials_platform";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "website";
    ALTER TABLE "users_locales" DROP COLUMN IF EXISTS "job_title";
    ALTER TABLE "users_locales" DROP COLUMN IF EXISTS "education";
  `)
}
