import * as migration_20260530_121458 from './20260530_121458';
import * as migration_20260531_123631 from './20260531_123631';
import * as migration_20260531_add_image_options from './20260531_add_image_options';
import * as migration_20260601_113806 from './20260601_113806';

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
    name: '20260601_113806'
  },
];
