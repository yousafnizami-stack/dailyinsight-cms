import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO categories (name, slug, updated_at, created_at)
    VALUES ('Other', 'other', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM categories WHERE slug = 'other';
  `)
}
