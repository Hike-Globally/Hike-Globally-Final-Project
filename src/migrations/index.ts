import * as migration_20261003_075051_initial from './20261003_075051_initial'
import * as migration_20261003_081622_localize_arrays from './20261003_081622_localize_arrays'
import * as migration_20261003_084733_localize_blocks from './20261003_084733_localize_blocks'
import * as migration_20261005_162110_media_storage from './20261005_162110_media_storage'
import * as migration_20261007_163309_trip_content_sections from './20261007_163309_trip_content_sections'
import * as migration_20261009_124959_trip_itinerary_food from './20261009_124959_trip_itinerary_food'
import * as migration_20261010_124847_nav_item_children from './20261010_124847_nav_item_children'
import * as migration_20261010_180000_trip_difficulty_levels from './20261010_180000_trip_difficulty_levels'

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
    name: '20261003_084733_localize_blocks',
  },
  {
    up: migration_20261005_162110_media_storage.up,
    down: migration_20261005_162110_media_storage.down,
    name: '20261005_162110_media_storage',
  },
  {
    up: migration_20261007_163309_trip_content_sections.up,
    down: migration_20261007_163309_trip_content_sections.down,
    name: '20261007_163309_trip_content_sections',
  },
  {
    up: migration_20261009_124959_trip_itinerary_food.up,
    down: migration_20261009_124959_trip_itinerary_food.down,
    name: '20261009_124959_trip_itinerary_food',
  },
  {
    up: migration_20261010_124847_nav_item_children.up,
    down: migration_20261010_124847_nav_item_children.down,
    name: '20261010_124847_nav_item_children',
  },
  {
    up: migration_20261010_180000_trip_difficulty_levels.up,
    down: migration_20261010_180000_trip_difficulty_levels.down,
    name: '20261010_180000_trip_difficulty_levels',
  },
]
