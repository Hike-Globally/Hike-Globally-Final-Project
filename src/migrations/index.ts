import * as migration_20261003_075051_initial from './20261003_075051_initial'
import * as migration_20261003_081622_localize_arrays from './20261003_081622_localize_arrays'
import * as migration_20261003_084733_localize_blocks from './20261003_084733_localize_blocks'
import * as migration_20261005_162110_media_storage from './20261005_162110_media_storage'
import * as migration_20261007_163309_trip_content_sections from './20261007_163309_trip_content_sections'
import * as migration_20261009_124959_trip_itinerary_food from './20261009_124959_trip_itinerary_food'
import * as migration_20261010_124847_nav_item_children from './20261010_124847_nav_item_children'
import * as migration_20261010_180000_trip_difficulty_levels from './20261010_180000_trip_difficulty_levels'
import * as migration_20261013_093000_trip_blog_keywords from './20261013_093000_trip_blog_keywords'
import * as migration_20261013_100000_trip_packing_list from './20261013_100000_trip_packing_list'
import * as migration_20261014_142919_page_sections from './20261014_142919_page_sections'
import * as migration_20261015_073000_trip_faq_categories from './20261015_073000_trip_faq_categories'
import * as migration_20261019_045205_blog_faqs from './20261019_045205_blog_faqs'
import * as migration_20261104_120136_trip_additional_sections from './20261104_120136_trip_additional_sections'
import * as migration_20261104_124123_trip_key_takeaways from './20261104_124123_trip_key_takeaways'
import * as migration_20261104_144321_trip_departure_dates from './20261104_144321_trip_departure_dates'
import * as migration_20261105_120000_hero_full_screen from './20261105_120000_hero_full_screen'
import * as migration_20261106_120000_trip_brochure from './20261106_120000_trip_brochure'
import * as migration_20261107_120000_trip_audience from './20261107_120000_trip_audience'
import * as migration_20261108_120000_trip_packing_categories from './20261108_120000_trip_packing_categories'
import * as migration_20261108_150000_redirections from './20261108_150000_redirections'
import * as migration_20261115_120000_home_hero_split_heading from './20261115_120000_home_hero_split_heading'
import * as migration_20261115_180000_link_preview from './20261115_180000_link_preview'
import * as migration_20261115_200000_link_preview_in_page_section from './20261115_200000_link_preview_in_page_section'
import * as migration_20261119_120000_author_expertise from './20261119_120000_author_expertise'
import * as migration_20261119_170704_multi_url_preview from './20261119_170704_multi_url_preview'
import * as migration_20261119_180000_internal_link_keywords from './20261119_180000_internal_link_keywords'
import * as migration_20261119_190000_hotels_near_destination from './20261119_190000_hotels_near_destination'
import * as migration_20261119_200000_multi_url_preview_images from './20261119_200000_multi_url_preview_images'

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
  {
    up: migration_20261013_093000_trip_blog_keywords.up,
    down: migration_20261013_093000_trip_blog_keywords.down,
    name: '20261013_093000_trip_blog_keywords',
  },
  {
    up: migration_20261013_100000_trip_packing_list.up,
    down: migration_20261013_100000_trip_packing_list.down,
    name: '20261013_100000_trip_packing_list',
  },
  {
    up: migration_20261014_142919_page_sections.up,
    down: migration_20261014_142919_page_sections.down,
    name: '20261014_142919_page_sections',
  },
  {
    up: migration_20261015_073000_trip_faq_categories.up,
    down: migration_20261015_073000_trip_faq_categories.down,
    name: '20261015_073000_trip_faq_categories',
  },
  {
    up: migration_20261019_045205_blog_faqs.up,
    down: migration_20261019_045205_blog_faqs.down,
    name: '20261019_045205_blog_faqs',
  },
  {
    up: migration_20261104_120136_trip_additional_sections.up,
    down: migration_20261104_120136_trip_additional_sections.down,
    name: '20261104_120136_trip_additional_sections',
  },
  {
    up: migration_20261104_124123_trip_key_takeaways.up,
    down: migration_20261104_124123_trip_key_takeaways.down,
    name: '20261104_124123_trip_key_takeaways',
  },
  {
    up: migration_20261104_144321_trip_departure_dates.up,
    down: migration_20261104_144321_trip_departure_dates.down,
    name: '20261104_144321_trip_departure_dates',
  },
  {
    up: migration_20261105_120000_hero_full_screen.up,
    down: migration_20261105_120000_hero_full_screen.down,
    name: '20261105_120000_hero_full_screen',
  },
  {
    up: migration_20261106_120000_trip_brochure.up,
    down: migration_20261106_120000_trip_brochure.down,
    name: '20261106_120000_trip_brochure',
  },
  {
    up: migration_20261107_120000_trip_audience.up,
    down: migration_20261107_120000_trip_audience.down,
    name: '20261107_120000_trip_audience',
  },
  {
    up: migration_20261108_120000_trip_packing_categories.up,
    down: migration_20261108_120000_trip_packing_categories.down,
    name: '20261108_120000_trip_packing_categories',
  },
  {
    up: migration_20261108_150000_redirections.up,
    down: migration_20261108_150000_redirections.down,
    name: '20261108_150000_redirections',
  },
  {
    up: migration_20261115_120000_home_hero_split_heading.up,
    down: migration_20261115_120000_home_hero_split_heading.down,
    name: '20261115_120000_home_hero_split_heading',
  },
  {
    up: migration_20261115_180000_link_preview.up,
    down: migration_20261115_180000_link_preview.down,
    name: '20261115_180000_link_preview',
  },
  {
    up: migration_20261115_200000_link_preview_in_page_section.up,
    down: migration_20261115_200000_link_preview_in_page_section.down,
    name: '20261115_200000_link_preview_in_page_section',
  },
  {
    up: migration_20261119_120000_author_expertise.up,
    down: migration_20261119_120000_author_expertise.down,
    name: '20261119_120000_author_expertise',
  },
  {
    up: migration_20261119_170704_multi_url_preview.up,
    down: migration_20261119_170704_multi_url_preview.down,
    name: '20261119_170704_multi_url_preview',
  },
  {
    up: migration_20261119_180000_internal_link_keywords.up,
    down: migration_20261119_180000_internal_link_keywords.down,
    name: '20261119_180000_internal_link_keywords',
  },
  {
    up: migration_20261119_190000_hotels_near_destination.up,
    down: migration_20261119_190000_hotels_near_destination.down,
    name: '20261119_190000_hotels_near_destination',
  },
  {
    up: migration_20261119_200000_multi_url_preview_images.up,
    down: migration_20261119_200000_multi_url_preview_images.down,
    name: '20261119_200000_multi_url_preview_images',
  },
]
