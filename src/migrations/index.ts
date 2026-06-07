import * as migration_20260530_121458 from './20260530_121458';
import * as migration_20260531_123631 from './20260531_123631';
import * as migration_20260531_add_image_options from './20260531_add_image_options';
import * as migration_20260601_113806 from './20260601_113806';
import * as migration_20260601_133934 from './20260601_133934';
import * as migration_20260605_181717 from './20260605_181717';
import * as migration_20260607_103856_add_caption_to_media from './20260607_103856_add_caption_to_media';
import * as migration_20260607_131131_add_rss_sources_collection from './20260607_131131_add_rss_sources_collection';
import * as migration_20260607_132618_add_rss_articles from './20260607_132618_add_rss_articles';
import * as migration_20260607_151321_add_rss_test_prompt_fields from './20260607_151321_add_rss_test_prompt_fields';
import * as migration_20260607_205425_add_fe_articles_collection from './20260607_205425_add_fe_articles_collection';
import * as migration_20260607_214018_add_fe_articles_source_field from './20260607_214018_add_fe_articles_source_field';

export const migrations = [
  {
    up: migration_20260530_121458.up,
    down: migration_20260530_121458.down,
    name: '20260530_121458',
  },
  {
    up: migration_20260531_123631.up,
    down: migration_20260531_123631.down,
    name: '20260531_123631',
  },
  {
    up: migration_20260531_add_image_options.up,
    down: migration_20260531_add_image_options.down,
    name: '20260531_add_image_options',
  },
  {
    up: migration_20260601_113806.up,
    down: migration_20260601_113806.down,
    name: '20260601_113806',
  },
  {
    up: migration_20260601_133934.up,
    down: migration_20260601_133934.down,
    name: '20260601_133934',
  },
  {
    up: migration_20260605_181717.up,
    down: migration_20260605_181717.down,
    name: '20260605_181717',
  },
  {
    up: migration_20260607_103856_add_caption_to_media.up,
    down: migration_20260607_103856_add_caption_to_media.down,
    name: '20260607_103856_add_caption_to_media',
  },
  {
    up: migration_20260607_131131_add_rss_sources_collection.up,
    down: migration_20260607_131131_add_rss_sources_collection.down,
    name: '20260607_131131_add_rss_sources_collection',
  },
  {
    up: migration_20260607_132618_add_rss_articles.up,
    down: migration_20260607_132618_add_rss_articles.down,
    name: '20260607_132618_add_rss_articles',
  },
  {
    up: migration_20260607_151321_add_rss_test_prompt_fields.up,
    down: migration_20260607_151321_add_rss_test_prompt_fields.down,
    name: '20260607_151321_add_rss_test_prompt_fields',
  },
  {
    up: migration_20260607_205425_add_fe_articles_collection.up,
    down: migration_20260607_205425_add_fe_articles_collection.down,
    name: '20260607_205425_add_fe_articles_collection',
  },
  {
    up: migration_20260607_214018_add_fe_articles_source_field.up,
    down: migration_20260607_214018_add_fe_articles_source_field.down,
    name: '20260607_214018_add_fe_articles_source_field'
  },
];
