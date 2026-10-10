import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Expands trip `difficulty` from five rungs to the nine-level scale used by the homepage
 * slider (Easy through Extreme, including the four compound levels in between).
 *
 * Existing rows keep their values — every previous enum member is still valid. The column is
 * widened via text so the change can run inside Payload's migration transaction (PostgreSQL
 * rejects `ALTER TYPE ... ADD VALUE` in a transaction on older servers).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "trips" ALTER COLUMN "difficulty" DROP DEFAULT;
    ALTER TABLE "trips" ALTER COLUMN "difficulty" SET DATA TYPE text;
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" DROP DEFAULT;
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" SET DATA TYPE text;
    DROP TYPE "public"."enum_trips_difficulty";
    DROP TYPE "public"."enum__trips_v_version_difficulty";
    CREATE TYPE "public"."enum_trips_difficulty" AS ENUM('easy', 'easy-moderate', 'moderate', 'moderate-challenging', 'challenging', 'challenging-strenuous', 'strenuous', 'strenuous-extreme', 'extreme');
    CREATE TYPE "public"."enum__trips_v_version_difficulty" AS ENUM('easy', 'easy-moderate', 'moderate', 'moderate-challenging', 'challenging', 'challenging-strenuous', 'strenuous', 'strenuous-extreme', 'extreme');
    ALTER TABLE "trips" ALTER COLUMN "difficulty" SET DATA TYPE "public"."enum_trips_difficulty" USING "difficulty"::"public"."enum_trips_difficulty";
    ALTER TABLE "trips" ALTER COLUMN "difficulty" SET DEFAULT 'moderate';
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" SET DATA TYPE "public"."enum__trips_v_version_difficulty" USING "version_difficulty"::"public"."enum__trips_v_version_difficulty";
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" SET DEFAULT 'moderate';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "trips" ALTER COLUMN "difficulty" DROP DEFAULT;
    ALTER TABLE "trips" ALTER COLUMN "difficulty" SET DATA TYPE text;
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" DROP DEFAULT;
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" SET DATA TYPE text;
    DROP TYPE "public"."enum_trips_difficulty";
    DROP TYPE "public"."enum__trips_v_version_difficulty";
    CREATE TYPE "public"."enum_trips_difficulty" AS ENUM('easy', 'moderate', 'challenging', 'strenuous', 'extreme');
    CREATE TYPE "public"."enum__trips_v_version_difficulty" AS ENUM('easy', 'moderate', 'challenging', 'strenuous', 'extreme');
    ALTER TABLE "trips" ALTER COLUMN "difficulty" SET DATA TYPE "public"."enum_trips_difficulty" USING (
      CASE
        WHEN "difficulty" IN ('easy', 'moderate', 'challenging', 'strenuous', 'extreme') THEN "difficulty"
        WHEN "difficulty" = 'easy-moderate' THEN 'easy'
        WHEN "difficulty" = 'moderate-challenging' THEN 'moderate'
        WHEN "difficulty" = 'challenging-strenuous' THEN 'challenging'
        WHEN "difficulty" = 'strenuous-extreme' THEN 'strenuous'
        ELSE 'moderate'
      END
    )::"public"."enum_trips_difficulty";
    ALTER TABLE "trips" ALTER COLUMN "difficulty" SET DEFAULT 'moderate';
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" SET DATA TYPE "public"."enum__trips_v_version_difficulty" USING (
      CASE
        WHEN "version_difficulty" IN ('easy', 'moderate', 'challenging', 'strenuous', 'extreme') THEN "version_difficulty"
        WHEN "version_difficulty" = 'easy-moderate' THEN 'easy'
        WHEN "version_difficulty" = 'moderate-challenging' THEN 'moderate'
        WHEN "version_difficulty" = 'challenging-strenuous' THEN 'challenging'
        WHEN "version_difficulty" = 'strenuous-extreme' THEN 'strenuous'
        ELSE 'moderate'
      END
    )::"public"."enum__trips_v_version_difficulty";
    ALTER TABLE "_trips_v" ALTER COLUMN "version_difficulty" SET DEFAULT 'moderate';
  `)
}
