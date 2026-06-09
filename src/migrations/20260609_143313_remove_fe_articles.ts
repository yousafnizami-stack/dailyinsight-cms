import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "fe_articles_source_urls" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "fe_articles_embeds" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "fe_articles_tags" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "fe_articles_headline_variants" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "fe_articles" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "fe_articles_source_urls" CASCADE;
    DROP TABLE IF EXISTS "fe_articles_embeds" CASCADE;
    DROP TABLE IF EXISTS "fe_articles_tags" CASCADE;
    DROP TABLE IF EXISTS "fe_articles_headline_variants" CASCADE;
    DROP TABLE IF EXISTS "fe_articles" CASCADE;
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_fe_articles_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_fe_articles_id_idx";
    ALTER TABLE IF EXISTS "payload_locked_documents_rels" DROP COLUMN IF EXISTS "fe_articles_id";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_status";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_author";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_source";
    DROP TYPE IF EXISTS "public"."enum_fe_articles_article_type";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_fe_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_fe_articles_author" AS ENUM('di-royal-reporter', 'di-entertainment-desk', 'di-music-desk', 'di-film-desk', 'web-desk', 'news-desk', 'celebrity-desk', 'royal-family-desk');
  CREATE TYPE "public"."enum_fe_articles_source" AS ENUM('kw-pipeline', 'rss-pipeline');
  CREATE TYPE "public"."enum_fe_articles_article_type" AS ENUM('news', 'listicle', 'profile', 'explainer', 'timeline', 'developing');
  CREATE TABLE "fe_articles_source_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar
  );
  
  CREATE TABLE "fe_articles_embeds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" varchar,
  	"embed_html" varchar,
  	"caption" varchar,
  	"insert_after_paragraph" numeric
  );
  
  CREATE TABLE "fe_articles_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "fe_articles_headline_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" varchar
  );
  
  CREATE TABLE "fe_articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"status" "enum_fe_articles_status" DEFAULT 'draft' NOT NULL,
  	"category_id" integer,
  	"author" "enum_fe_articles_author",
  	"featured_image_id" integer,
  	"body" jsonb,
  	"excerpt" varchar,
  	"review_note" varchar,
  	"source" "enum_fe_articles_source",
  	"featured" boolean DEFAULT false,
  	"slug" varchar NOT NULL,
  	"featured_image_url" varchar,
  	"featured_image_alt" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"published_at" timestamp(3) with time zone,
  	"published_date" timestamp(3) with time zone,
  	"confidence" numeric,
  	"reading_time" numeric,
  	"article_type" "enum_fe_articles_article_type",
  	"display_order" numeric,
  	"image_options" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fe_articles_id" integer;
  ALTER TABLE "fe_articles_source_urls" ADD CONSTRAINT "fe_articles_source_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fe_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fe_articles_embeds" ADD CONSTRAINT "fe_articles_embeds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fe_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fe_articles_tags" ADD CONSTRAINT "fe_articles_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fe_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fe_articles_headline_variants" ADD CONSTRAINT "fe_articles_headline_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fe_articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fe_articles" ADD CONSTRAINT "fe_articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fe_articles" ADD CONSTRAINT "fe_articles_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "fe_articles_source_urls_order_idx" ON "fe_articles_source_urls" USING btree ("_order");
  CREATE INDEX "fe_articles_source_urls_parent_id_idx" ON "fe_articles_source_urls" USING btree ("_parent_id");
  CREATE INDEX "fe_articles_embeds_order_idx" ON "fe_articles_embeds" USING btree ("_order");
  CREATE INDEX "fe_articles_embeds_parent_id_idx" ON "fe_articles_embeds" USING btree ("_parent_id");
  CREATE INDEX "fe_articles_tags_order_idx" ON "fe_articles_tags" USING btree ("_order");
  CREATE INDEX "fe_articles_tags_parent_id_idx" ON "fe_articles_tags" USING btree ("_parent_id");
  CREATE INDEX "fe_articles_headline_variants_order_idx" ON "fe_articles_headline_variants" USING btree ("_order");
  CREATE INDEX "fe_articles_headline_variants_parent_id_idx" ON "fe_articles_headline_variants" USING btree ("_parent_id");
  CREATE INDEX "fe_articles_category_idx" ON "fe_articles" USING btree ("category_id");
  CREATE INDEX "fe_articles_featured_image_idx" ON "fe_articles" USING btree ("featured_image_id");
  CREATE UNIQUE INDEX "fe_articles_slug_idx" ON "fe_articles" USING btree ("slug");
  CREATE INDEX "fe_articles_updated_at_idx" ON "fe_articles" USING btree ("updated_at");
  CREATE INDEX "fe_articles_created_at_idx" ON "fe_articles" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fe_articles_fk" FOREIGN KEY ("fe_articles_id") REFERENCES "public"."fe_articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_fe_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("fe_articles_id");`)
}
