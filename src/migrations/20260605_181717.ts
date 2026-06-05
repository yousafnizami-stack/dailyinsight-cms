import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pipeline_settings_schedule" AS ENUM('8am', '8pm', 'both', 'off');
  CREATE TABLE "pipeline_prompt" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"system_prompt" varchar DEFAULT 'You are a senior entertainment journalist writing for DailyInsight.co.uk, a UK entertainment and Royal Family news website. Your style is The Mirror meets Hello! Magazine — punchy, warm, slightly gossipy, always readable. Write one aggregated article combining the key facts from the sources provided. Use UK spelling. 500-600 words. Include: a compelling headline, opening hook paragraph, 3-4 subheadings with short paragraphs, one blockquote with the most dramatic quote from the sources. Return JSON only: { title, excerpt, body (as HTML with h2, p, blockquote tags), category, reviewNote } where category must be exactly one of: royals, celebrity, tv, music, film, lifestyle, entertainment — and reviewNote is a 2-3 sentence editorial note covering: category accuracy, facts to verify before publishing, sensitive claims, and whether the story is time-sensitive. IMPORTANT: If the source articles cover different unrelated stories, identify the topic that appears in the majority of sources and write only about that topic. Completely ignore any source that covers a different topic to the majority. Do not combine unrelated stories into one article. Do not put descriptive phrases, emotions or adjectives in single quotes as if they were film titles or direct quotes. Only use single quotes for actual direct quotes from real people.' NOT NULL,
  	"word_count_min" numeric DEFAULT 500,
  	"word_count_max" numeric DEFAULT 600,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pipeline_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"schedule" "enum_pipeline_settings_schedule" DEFAULT '8am',
  	"max_urls_per_keyword" numeric DEFAULT 3,
  	"min_content_threshold" numeric DEFAULT 500,
  	"dedup_expiry_hours" numeric DEFAULT 24,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pipeline_test_prompt" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"system_prompt" varchar,
  	"enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "articles" ALTER COLUMN "author" SET DATA TYPE text;
  DROP TYPE "public"."enum_articles_author";
  CREATE TYPE "public"."enum_articles_author" AS ENUM('di-royal-reporter', 'di-entertainment-desk', 'di-music-desk', 'di-film-desk', 'web-desk', 'news-desk', 'celebrity-desk', 'royal-family-desk');
  ALTER TABLE "articles" ALTER COLUMN "author" SET DATA TYPE "public"."enum_articles_author" USING "author"::"public"."enum_articles_author";
  ALTER TABLE "test_articles" ALTER COLUMN "author" SET DATA TYPE text;
  DROP TYPE "public"."enum_test_articles_author";
  CREATE TYPE "public"."enum_test_articles_author" AS ENUM('di-royal-reporter', 'di-entertainment-desk', 'di-music-desk', 'di-film-desk', 'web-desk', 'news-desk', 'celebrity-desk');
  ALTER TABLE "test_articles" ALTER COLUMN "author" SET DATA TYPE "public"."enum_test_articles_author" USING "author"::"public"."enum_test_articles_author";
  DROP INDEX "authors_slug_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "authors" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "media" ADD COLUMN "title" varchar;
  ALTER TABLE "authors" ADD COLUMN "role" varchar;
  CREATE UNIQUE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pipeline_prompt" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pipeline_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pipeline_test_prompt" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pipeline_prompt" CASCADE;
  DROP TABLE "pipeline_settings" CASCADE;
  DROP TABLE "pipeline_test_prompt" CASCADE;
  ALTER TABLE "articles" ALTER COLUMN "author" SET DATA TYPE text;
  DROP TYPE "public"."enum_articles_author";
  CREATE TYPE "public"."enum_articles_author" AS ENUM('DI Royal Reporter', 'DI Entertainment Desk', 'DI Music Desk', 'DI Film Desk', 'Web Desk', 'News Desk');
  ALTER TABLE "articles" ALTER COLUMN "author" SET DATA TYPE "public"."enum_articles_author" USING "author"::"public"."enum_articles_author";
  ALTER TABLE "test_articles" ALTER COLUMN "author" SET DATA TYPE text;
  DROP TYPE "public"."enum_test_articles_author";
  CREATE TYPE "public"."enum_test_articles_author" AS ENUM('DI Royal Reporter', 'DI Entertainment Desk', 'DI Music Desk', 'DI Film Desk', 'Web Desk', 'News Desk');
  ALTER TABLE "test_articles" ALTER COLUMN "author" SET DATA TYPE "public"."enum_test_articles_author" USING "author"::"public"."enum_test_articles_author";
  DROP INDEX "authors_slug_idx";
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "authors" ALTER COLUMN "slug" DROP NOT NULL;
  CREATE INDEX "authors_slug_idx" ON "authors" USING btree ("slug");
  ALTER TABLE "media" DROP COLUMN "title";
  ALTER TABLE "authors" DROP COLUMN "role";
  DROP TYPE "public"."enum_pipeline_settings_schedule";`)
}
