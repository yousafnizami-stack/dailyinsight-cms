import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Clean up fe_articles if still present (idempotent)
  await db.execute(sql`
    DROP TABLE IF EXISTS "fe_articles_source_urls" CASCADE;
    DROP TABLE IF EXISTS "fe_articles_embeds" CASCADE;
    DROP TABLE IF EXISTS "fe_articles_tags" CASCADE;
    DROP TABLE IF EXISTS "fe_articles_headline_variants" CASCADE;
    DROP TABLE IF EXISTS "fe_articles" CASCADE;
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_fe_articles_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_fe_articles_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "fe_articles_id";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_status";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_author";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_article_type";
  `)

  // Add authorRef columns
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "author_ref_id" integer;
    ALTER TABLE "test_articles" ADD COLUMN IF NOT EXISTS "author_ref_id" integer;
    ALTER TABLE "rss_articles" ADD COLUMN IF NOT EXISTS "author_ref_id" integer;
    ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "photo_url" varchar;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "articles" ADD CONSTRAINT "articles_author_ref_id_authors_id_fk" FOREIGN KEY ("author_ref_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "test_articles" ADD CONSTRAINT "test_articles_author_ref_id_authors_id_fk" FOREIGN KEY ("author_ref_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "rss_articles" ADD CONSTRAINT "rss_articles_author_ref_id_authors_id_fk" FOREIGN KEY ("author_ref_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "articles_author_ref_idx" ON "articles" USING btree ("author_ref_id");
    CREATE INDEX IF NOT EXISTS "test_articles_author_ref_idx" ON "test_articles" USING btree ("author_ref_id");
    CREATE INDEX IF NOT EXISTS "rss_articles_author_ref_idx" ON "rss_articles" USING btree ("author_ref_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_author_ref_id_authors_id_fk";
    ALTER TABLE "test_articles" DROP CONSTRAINT IF EXISTS "test_articles_author_ref_id_authors_id_fk";
    ALTER TABLE "rss_articles" DROP CONSTRAINT IF EXISTS "rss_articles_author_ref_id_authors_id_fk";
    DROP INDEX IF EXISTS "articles_author_ref_idx";
    DROP INDEX IF EXISTS "test_articles_author_ref_idx";
    DROP INDEX IF EXISTS "rss_articles_author_ref_idx";
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "author_ref_id";
    ALTER TABLE "test_articles" DROP COLUMN IF EXISTS "author_ref_id";
    ALTER TABLE "rss_articles" DROP COLUMN IF EXISTS "author_ref_id";
  `)
}
