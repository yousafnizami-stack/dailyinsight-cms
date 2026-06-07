import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rss_sources_category" AS ENUM('royals', 'entertainment', 'celebrity', 'tv', 'music', 'film', 'lifestyle');
  CREATE TABLE "rss_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"category" "enum_rss_sources_category",
  	"weight" numeric DEFAULT 0.85 NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rss_sources_id" integer;
  CREATE INDEX "rss_sources_updated_at_idx" ON "rss_sources" USING btree ("updated_at");
  CREATE INDEX "rss_sources_created_at_idx" ON "rss_sources" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rss_sources_fk" FOREIGN KEY ("rss_sources_id") REFERENCES "public"."rss_sources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_rss_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("rss_sources_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rss_sources" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rss_sources" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rss_sources_fk";
  
  DROP INDEX "payload_locked_documents_rels_rss_sources_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rss_sources_id";
  DROP TYPE "public"."enum_rss_sources_category";`)
}
