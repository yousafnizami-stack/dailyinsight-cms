import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const newValues = ['sophie-marshall', 'james-okafor', 'claire-dennison', 'tom-everett', 'rachel-hinds', 'priya-nair']
  const enums = ['enum_articles_author', 'enum_rss_articles_author', 'enum_test_articles_author']
  for (const enumName of enums) {
    for (const value of newValues) {
      await db.execute(sql.raw(`ALTER TYPE "public"."${enumName}" ADD VALUE IF NOT EXISTS '${value}'`))
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing enum values; no-op
}
