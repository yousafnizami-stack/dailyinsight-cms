import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pending_drafts_status" AS ENUM('draft', 'published');
  ALTER TABLE "pending_drafts" ADD COLUMN "status" "enum_pending_drafts_status" DEFAULT 'draft' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_drafts" DROP COLUMN "status";
  DROP TYPE "public"."enum_pending_drafts_status";`)
}
