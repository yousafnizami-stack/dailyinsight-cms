import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// NOTE: the auto-generated diff for this migration also included `ALTER TABLE "media" ADD
// COLUMN "subjects"` and `ALTER TABLE "pipeline_prompt" ADD COLUMN
// "article_brief_system_prompt"` — both already live on the database via their own
// already-applied-and-recorded migrations (20260727_165142_add_media_subjects_field and
// 20260727_154645_add_article_brief_system_prompt_field respectively). drizzle-kit's
// schema snapshot history doesn't fully track those hand-written raw-SQL migrations, so it
// re-proposed them here — same stale-snapshot situation documented in
// 20260706_211141_add_carousels_collection.ts. Verified directly against the live DB
// (`\d media` / `\d pipeline_prompt`) that both columns already exist, and hand-trimmed
// this migration down to ONLY the new PendingDrafts collection's tables/columns to avoid
// "already exists" failures / touching unrelated tables.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pending_drafts_author" AS ENUM('di-royal-reporter', 'di-entertainment-desk', 'di-music-desk', 'di-film-desk', 'web-desk', 'news-desk', 'celebrity-desk', 'royal-family-desk', 'sophie-marshall', 'james-okafor', 'claire-dennison', 'tom-everett', 'rachel-hinds', 'priya-nair');
  CREATE TABLE "pending_drafts_source_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );

  CREATE TABLE "pending_drafts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"category_id" integer,
  	"author" "enum_pending_drafts_author",
  	"keyword" varchar,
  	"featured_image_id" integer,
  	"body" jsonb,
  	"excerpt" varchar,
  	"review_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pending_drafts_id" integer;
  ALTER TABLE "pending_drafts_source_urls" ADD CONSTRAINT "pending_drafts_source_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pending_drafts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pending_drafts" ADD CONSTRAINT "pending_drafts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pending_drafts" ADD CONSTRAINT "pending_drafts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pending_drafts_source_urls_order_idx" ON "pending_drafts_source_urls" USING btree ("_order");
  CREATE INDEX "pending_drafts_source_urls_parent_id_idx" ON "pending_drafts_source_urls" USING btree ("_parent_id");
  CREATE INDEX "pending_drafts_category_idx" ON "pending_drafts" USING btree ("category_id");
  CREATE INDEX "pending_drafts_featured_image_idx" ON "pending_drafts" USING btree ("featured_image_id");
  CREATE INDEX "pending_drafts_updated_at_idx" ON "pending_drafts" USING btree ("updated_at");
  CREATE INDEX "pending_drafts_created_at_idx" ON "pending_drafts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pending_drafts_fk" FOREIGN KEY ("pending_drafts_id") REFERENCES "public"."pending_drafts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pending_drafts_id_idx" ON "payload_locked_documents_rels" USING btree ("pending_drafts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pending_drafts_source_urls" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pending_drafts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pending_drafts_source_urls" CASCADE;
  DROP TABLE "pending_drafts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pending_drafts_fk";
  DROP INDEX "payload_locked_documents_rels_pending_drafts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pending_drafts_id";
  DROP TYPE "public"."enum_pending_drafts_author";`)
}
