import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_drafts" ADD COLUMN "published_article_id_id" integer;
  ALTER TABLE "pending_drafts" ADD CONSTRAINT "pending_drafts_published_article_id_id_articles_id_fk" FOREIGN KEY ("published_article_id_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pending_drafts_published_article_id_idx" ON "pending_drafts" USING btree ("published_article_id_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_drafts" DROP CONSTRAINT "pending_drafts_published_article_id_id_articles_id_fk";
  
  DROP INDEX "pending_drafts_published_article_id_idx";
  ALTER TABLE "pending_drafts" DROP COLUMN "published_article_id_id";`)
}
