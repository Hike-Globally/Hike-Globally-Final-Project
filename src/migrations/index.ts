import * as migration_20261003_075051_initial from './20261003_075051_initial';
import * as migration_20261003_081622_localize_arrays from './20261003_081622_localize_arrays';
import * as migration_20261003_084733_localize_blocks from './20261003_084733_localize_blocks';

export const migrations = [
  {
    up: migration_20261003_075051_initial.up,
    down: migration_20261003_075051_initial.down,
    name: '20261003_075051_initial',
  },
  {
    up: migration_20261003_081622_localize_arrays.up,
    down: migration_20261003_081622_localize_arrays.down,
    name: '20261003_081622_localize_arrays',
  },
  {
    up: migration_20261003_084733_localize_blocks.up,
    down: migration_20261003_084733_localize_blocks.down,
    name: '20261003_084733_localize_blocks'
  },
];
