import * as migration_20260530_121458 from './20260530_121458';
import * as migration_20260531_123631 from './20260531_123631';

export const migrations = [
  {
    up: migration_20260530_121458.up,
    down: migration_20260530_121458.down,
    name: '20260530_121458',
  },
  {
    up: migration_20260531_123631.up,
    down: migration_20260531_123631.down,
    name: '20260531_123631'
  },
];
