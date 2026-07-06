import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// NOTE: the auto-generated diff for this migration also included CREATE TABLE statements
// for "horoscopes"/"horoscopes_signs"/"rss_category_keywords" and new rel columns on
// payload_locked_documents_rels for them — those tables/columns were already pushed live
// to the database directly (via the `push: true` postgresAdapter option used in dev),
// so drizzle-kit's schema snapshot history didn't know about them and re-included them in
// this diff. Verified directly against the live DB (information_schema.tables/columns)
// that they already exist, and hand-trimmed this migration down to ONLY the new Carousels
// collection's tables/columns to avoid "already exists" failures / touching unrelated
// tables.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "carousels_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar
  );

  CREATE TABLE "carousels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "carousels_id" integer;
  ALTER TABLE "carousels_images" ADD CONSTRAINT "carousels_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "carousels_images" ADD CONSTRAINT "carousels_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."carousels"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "carousels_images_order_idx" ON "carousels_images" USING btree ("_order");
  CREATE INDEX "carousels_images_parent_id_idx" ON "carousels_images" USING btree ("_parent_id");
  CREATE INDEX "carousels_images_image_idx" ON "carousels_images" USING btree ("image_id");
  CREATE INDEX "carousels_updated_at_idx" ON "carousels" USING btree ("updated_at");
  CREATE INDEX "carousels_created_at_idx" ON "carousels" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carousels_fk" FOREIGN KEY ("carousels_id") REFERENCES "public"."carousels"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_carousels_id_idx" ON "payload_locked_documents_rels" USING btree ("carousels_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "carousels_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "carousels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "carousels_images" CASCADE;
  DROP TABLE "carousels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_carousels_fk";
  DROP INDEX "payload_locked_documents_rels_carousels_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "carousels_id";`)
}
