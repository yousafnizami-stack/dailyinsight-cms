import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_social_post_queue_platform" AS ENUM('facebook');
  CREATE TABLE "social_post_queue" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"article_url" varchar NOT NULL,
  	"image_url" varchar NOT NULL,
  	"scheduled_for" timestamp(3) with time zone NOT NULL,
  	"posted" boolean DEFAULT false,
  	"posted_at" timestamp(3) with time zone,
  	"platform" "enum_social_post_queue_platform" DEFAULT 'facebook' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "social_post_queue_id" integer;
  CREATE INDEX "social_post_queue_updated_at_idx" ON "social_post_queue" USING btree ("updated_at");
  CREATE INDEX "social_post_queue_created_at_idx" ON "social_post_queue" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_social_post_queue_fk" FOREIGN KEY ("social_post_queue_id") REFERENCES "public"."social_post_queue"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_social_post_queue_id_idx" ON "payload_locked_documents_rels" USING btree ("social_post_queue_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "social_post_queue" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "social_post_queue" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_social_post_queue_fk";
  
  DROP INDEX "payload_locked_documents_rels_social_post_queue_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "social_post_queue_id";
  DROP TYPE "public"."enum_social_post_queue_platform";`)
}
