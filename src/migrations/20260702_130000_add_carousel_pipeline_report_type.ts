import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pipeline_reports_type" ADD VALUE IF NOT EXISTS 'carousel-pipeline';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing a value from an enum type directly
  // (it would require recreating the type and repointing the column).
  // No-op: rolling back this migration does not revert the enum value.
}
