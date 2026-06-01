import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "used_urls" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"keyword" varchar,
  	"expires_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "image_options" jsonb;
  ALTER TABLE "test_articles" ADD COLUMN IF NOT EXISTS "image_options" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "used_urls_id" integer;
  CREATE UNIQUE INDEX "used_urls_url_idx" ON "used_urls" USING btree ("url");
  CREATE INDEX "used_urls_updated_at_idx" ON "used_urls" USING btree ("updated_at");
  CREATE INDEX "used_urls_created_at_idx" ON "used_urls" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_used_urls_fk" FOREIGN KEY ("used_urls_id") REFERENCES "public"."used_urls"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_used_urls_id_idx" ON "payload_locked_documents_rels" USING btree ("used_urls_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "used_urls" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "used_urls" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_used_urls_fk";
  
  DROP INDEX "payload_locked_documents_rels_used_urls_id_idx";
  ALTER TABLE "articles" DROP COLUMN "image_options";
  ALTER TABLE "test_articles" DROP COLUMN "image_options";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "used_urls_id";`)
}
