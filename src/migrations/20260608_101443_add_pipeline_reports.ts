import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pipeline_reports_type" AS ENUM('kw-pipeline', 'rss-pipeline');
  CREATE TABLE "pipeline_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_pipeline_reports_type" NOT NULL,
  	"run_date" timestamp(3) with time zone NOT NULL,
  	"duration" varchar,
  	"article_saved" numeric,
  	"skipped" numeric,
  	"failed" numeric,
  	"sources" jsonb,
  	"articles_list" jsonb,
  	"skipped_list" jsonb,
  	"errors" jsonb,
  	"claude_calls" numeric,
  	"serp_api_usage" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pipeline_reports_id" integer;
  CREATE INDEX "pipeline_reports_updated_at_idx" ON "pipeline_reports" USING btree ("updated_at");
  CREATE INDEX "pipeline_reports_created_at_idx" ON "pipeline_reports" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pipeline_reports_fk" FOREIGN KEY ("pipeline_reports_id") REFERENCES "public"."pipeline_reports"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_pipeline_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("pipeline_reports_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pipeline_reports" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pipeline_reports" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pipeline_reports_fk";
  
  DROP INDEX "payload_locked_documents_rels_pipeline_reports_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pipeline_reports_id";
  DROP TYPE "public"."enum_pipeline_reports_type";`)
}
