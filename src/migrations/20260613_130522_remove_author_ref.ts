import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add new named author enum values (idempotent — Postgres ignores duplicate ADD VALUE)
  await db.execute(sql`
    ALTER TYPE "public"."enum_articles_author" ADD VALUE IF NOT EXISTS 'sophie-marshall';
    ALTER TYPE "public"."enum_articles_author" ADD VALUE IF NOT EXISTS 'james-okafor';
    ALTER TYPE "public"."enum_articles_author" ADD VALUE IF NOT EXISTS 'claire-dennison';
    ALTER TYPE "public"."enum_articles_author" ADD VALUE IF NOT EXISTS 'tom-everett';
    ALTER TYPE "public"."enum_articles_author" ADD VALUE IF NOT EXISTS 'rachel-hinds';
    ALTER TYPE "public"."enum_articles_author" ADD VALUE IF NOT EXISTS 'priya-nair';
    ALTER TYPE "public"."enum_rss_articles_author" ADD VALUE IF NOT EXISTS 'sophie-marshall';
    ALTER TYPE "public"."enum_rss_articles_author" ADD VALUE IF NOT EXISTS 'james-okafor';
    ALTER TYPE "public"."enum_rss_articles_author" ADD VALUE IF NOT EXISTS 'claire-dennison';
    ALTER TYPE "public"."enum_rss_articles_author" ADD VALUE IF NOT EXISTS 'tom-everett';
    ALTER TYPE "public"."enum_rss_articles_author" ADD VALUE IF NOT EXISTS 'rachel-hinds';
    ALTER TYPE "public"."enum_rss_articles_author" ADD VALUE IF NOT EXISTS 'priya-nair';
    ALTER TYPE "public"."enum_test_articles_author" ADD VALUE IF NOT EXISTS 'sophie-marshall';
    ALTER TYPE "public"."enum_test_articles_author" ADD VALUE IF NOT EXISTS 'james-okafor';
    ALTER TYPE "public"."enum_test_articles_author" ADD VALUE IF NOT EXISTS 'claire-dennison';
    ALTER TYPE "public"."enum_test_articles_author" ADD VALUE IF NOT EXISTS 'tom-everett';
    ALTER TYPE "public"."enum_test_articles_author" ADD VALUE IF NOT EXISTS 'rachel-hinds';
    ALTER TYPE "public"."enum_test_articles_author" ADD VALUE IF NOT EXISTS 'priya-nair';
  `)

  // Drop author_ref FK constraints and indexes, then columns (all guarded)
  await db.execute(sql`
    ALTER TABLE "articles" DROP CONSTRAINT IF EXISTS "articles_author_ref_id_authors_id_fk";
    ALTER TABLE "rss_articles" DROP CONSTRAINT IF EXISTS "rss_articles_author_ref_id_authors_id_fk";
    ALTER TABLE "test_articles" DROP CONSTRAINT IF EXISTS "test_articles_author_ref_id_authors_id_fk";
    DROP INDEX IF EXISTS "articles_author_ref_idx";
    DROP INDEX IF EXISTS "rss_articles_author_ref_idx";
    DROP INDEX IF EXISTS "test_articles_author_ref_idx";
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "author_ref_id";
    ALTER TABLE "rss_articles" DROP COLUMN IF EXISTS "author_ref_id";
    ALTER TABLE "test_articles" DROP COLUMN IF EXISTS "author_ref_id";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "author_ref_id" integer;
    ALTER TABLE "rss_articles" ADD COLUMN IF NOT EXISTS "author_ref_id" integer;
    ALTER TABLE "test_articles" ADD COLUMN IF NOT EXISTS "author_ref_id" integer;
    DO $$ BEGIN
      ALTER TABLE "articles" ADD CONSTRAINT "articles_author_ref_id_authors_id_fk" FOREIGN KEY ("author_ref_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "rss_articles" ADD CONSTRAINT "rss_articles_author_ref_id_authors_id_fk" FOREIGN KEY ("author_ref_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "test_articles" ADD CONSTRAINT "test_articles_author_ref_id_authors_id_fk" FOREIGN KEY ("author_ref_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    CREATE INDEX IF NOT EXISTS "articles_author_ref_idx" ON "articles" USING btree ("author_ref_id");
    CREATE INDEX IF NOT EXISTS "rss_articles_author_ref_idx" ON "rss_articles" USING btree ("author_ref_id");
    CREATE INDEX IF NOT EXISTS "test_articles_author_ref_idx" ON "test_articles" USING btree ("author_ref_id");
  `)
}
