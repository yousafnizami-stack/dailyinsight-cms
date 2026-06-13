import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE authors ADD COLUMN IF NOT EXISTS photo_url varchar;
  `)

  await db.execute(sql`
    INSERT INTO authors (name, slug, role, bio, photo_url, updated_at, created_at)
    VALUES
      ('Sophie Marshall', 'sophie-marshall', 'Royal Correspondent', 'Sophie Marshall has covered the British Royal Family for over a decade, reporting on official engagements, succession matters and the personalities behind the palace walls. Based in London, she brings context and clarity to one of the worlds most followed institutions.', 'https://res.cloudinary.com/dz1ntkkne/image/upload/v1781338390/kj8d22cnbp7hjcc3v1rn.png', NOW(), NOW()),
      ('James Okafor', 'james-okafor', 'Celebrity & Entertainment Writer', 'James Okafor covers the celebrity world from red carpets to social media storms. With a sharp eye for the story behind the headline, he tracks the biggest names in entertainment across film, television and beyond.', 'https://res.cloudinary.com/dz1ntkkne/image/upload/v1781338435/gep3kmecq9rm5ou6s6l8.png', NOW(), NOW()),
      ('Claire Dennison', 'claire-dennison', 'Music Editor', 'Claire Dennison has spent her career immersed in the UK and international music scene. From album reviews to artist profiles, she covers the artists, trends and moments shaping music culture today.', 'https://res.cloudinary.com/dz1ntkkne/image/upload/v1781338549/n0jjt5b1qs5sfauvqxw4.png', NOW(), NOW()),
      ('Tom Everett', 'tom-everett', 'Film Correspondent', 'Tom Everett covers cinema for Daily Insight, from major studio releases to independent films making waves on the festival circuit. He specialises in the stories behind productions and the talent driving them.', 'https://res.cloudinary.com/dz1ntkkne/image/upload/v1781338592/ylg0kntkvsxqzbpnyuv6.png', NOW(), NOW()),
      ('Rachel Hinds', 'rachel-hinds', 'TV & Streaming Writer', 'Rachel Hinds tracks the ever-expanding world of television and streaming, covering everything from prestige drama to reality TV. She keeps readers ahead of what to watch and why it matters.', 'https://res.cloudinary.com/dz1ntkkne/image/upload/v1781338648/z1iefvlgvh9av3obg00s.png', NOW(), NOW()),
      ('Priya Nair', 'priya-nair', 'Lifestyle Editor', 'Priya Nair covers lifestyle, wellness and the cultural moments that shape how we live. Her writing spans fashion, health, relationships and the trends worth paying attention to.', 'https://res.cloudinary.com/dz1ntkkne/image/upload/v1781338696/mtqvymijz8rzubf3mckz.png', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM authors WHERE slug IN ('sophie-marshall','james-okafor','claire-dennison','tom-everett','rachel-hinds','priya-nair');
    ALTER TABLE authors DROP COLUMN IF EXISTS photo_url;
  `)
}
