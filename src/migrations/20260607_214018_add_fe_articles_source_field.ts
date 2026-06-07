import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_fe_articles_source" AS ENUM('kw-pipeline', 'rss-pipeline');
  ALTER TABLE "fe_articles" ADD COLUMN "source" "enum_fe_articles_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fe_articles" DROP COLUMN "source";
  DROP TYPE "public"."enum_fe_articles_source";`)
}
