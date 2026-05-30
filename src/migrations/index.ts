import * as migration_20260530_110132 from './20260530_110132';

export const migrations = [
  {
    up: migration_20260530_110132.up,
    down: migration_20260530_110132.down,
    name: '20260530_110132'
  },
];
