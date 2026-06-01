import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_keywords_category" AS ENUM('royals', 'entertainment', 'celebrity', 'tv', 'music', 'film', 'lifestyle');
  CREATE TABLE "keywords" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL,
  	"category" "enum_keywords_category" NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "keywords_id" integer;
  CREATE INDEX "keywords_updated_at_idx" ON "keywords" USING btree ("updated_at");
  CREATE INDEX "keywords_created_at_idx" ON "keywords" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_keywords_fk" FOREIGN KEY ("keywords_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_keywords_id_idx" ON "payload_locked_documents_rels" USING btree ("keywords_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "keywords" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "keywords" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_keywords_fk";
  
  DROP INDEX "payload_locked_documents_rels_keywords_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "keywords_id";
  DROP TYPE "public"."enum_keywords_category";`)
}
