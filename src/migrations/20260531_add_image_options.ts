import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "image_options" jsonb;
    ALTER TABLE "test_articles" ADD COLUMN IF NOT EXISTS "image_options" jsonb;
  `)
}
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "image_options";
    ALTER TABLE "test_articles" DROP COLUMN IF EXISTS "image_options";
  `)
}
