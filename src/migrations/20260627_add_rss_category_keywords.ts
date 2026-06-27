import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_rss_category_keywords_category" AS ENUM('royals', 'entertainment', 'celebrity', 'tv', 'music', 'film', 'lifestyle');
    CREATE TABLE IF NOT EXISTS "rss_category_keywords" (
      "id" serial PRIMARY KEY NOT NULL,
      "category" "enum_rss_category_keywords_category" NOT NULL,
      "filter_keywords" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "rss_category_keywords_id" integer;
    CREATE INDEX IF NOT EXISTS "rss_category_keywords_updated_at_idx" ON "rss_category_keywords" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "rss_category_keywords_created_at_idx" ON "rss_category_keywords" USING btree ("created_at");
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rss_category_keywords_fk" FOREIGN KEY ("rss_category_keywords_id") REFERENCES "public"."rss_category_keywords"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_rss_category_keywords_id_idx" ON "payload_locked_documents_rels" USING btree ("rss_category_keywords_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rss_category_keywords" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "rss_category_keywords" CASCADE;
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rss_category_keywords_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_rss_category_keywords_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "rss_category_keywords_id";
    DROP TYPE IF EXISTS "public"."enum_rss_category_keywords_category";
  `)
}
