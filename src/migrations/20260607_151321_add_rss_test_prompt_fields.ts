import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pipeline_prompt" ADD COLUMN "rss_system_prompt" varchar;
  ALTER TABLE "pipeline_prompt" ADD COLUMN "test_system_prompt" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pipeline_prompt" DROP COLUMN "rss_system_prompt";
  ALTER TABLE "pipeline_prompt" DROP COLUMN "test_system_prompt";`)
}
