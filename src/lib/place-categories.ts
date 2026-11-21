import { sitePath } from '@/i18n/config'
import type { Media } from '@/payload-types'

/**
 * The nine "Browse places" categories.
 *
 * One object is the single source of truth for the homepage carousel, the
 * dedicated `/places/<category>` pages, the CMS multi-select options and the
 * sitemap. The values are stable slugs: they become both Payload select values
 * and URL segments, so an editor's choice can be queried without a lookup table.
 */
export const PLACE_CATEGORY_VALUES = [
  'lakes',
  'waterfalls',
  'mountain-passes',
  'canyons',
  'base-camps',
  'caves',
  'bike-tours',
  'mountain-peaks',
  'temples',
] as const

export type PlaceCategoryValue = (typeof PLACE_CATEGORY_VALUES)[number]

export type PlaceCategory = {
  value: PlaceCategoryValue
  label: string
  image: string
  alt: string
  /** Short sentence on the homepage card and the places index. */
  description: string
  /** Longer editorial introduction on the dedicated category page. */
  intro: string
}

export const placeCategories: PlaceCategory[] = [
  {
    value: 'lakes',
    label: 'Lakes',
    image: '/images/places/lakes.jpg',
    alt: 'A still alpine lake reflecting snow-covered Himalayan peaks',
    description: 'Mirror-still water beneath the high ridges.',
    intro:
      'From glacier-fed tarns to pilgrimage lakes, these routes make stillness the destination. Come for dawn reflections, shoreline camps and the quiet passes above the water.',
  },
  {
    value: 'waterfalls',
    label: 'Waterfalls',
    image: '/images/places/waterfalls.jpg',
    alt: 'A waterfall dropping through a mossy mountain gorge',
    description: 'Follow the sound of water through steep valleys.',
    intro:
      'Waterfalls mark the places where a landscape changes its mind. These journeys follow river corridors, spray-filled gorges and the lush trails that gather around them.',
  },
  {
    value: 'mountain-passes',
    label: 'Mountain Passes',
    image: '/images/places/mountain-passes.jpg',
    alt: 'A high mountain pass trail between snow-covered ridges',
    description: 'Wind-scoured crossings with the world opening beyond.',
    intro:
      'A pass is a threshold: one valley behind, another entirely ahead. Explore high crossings, ancient trade routes and the long views earned by the climb between them.',
  },
  {
    value: 'canyons',
    label: 'Canyons',
    image: '/images/places/canyons.jpg',
    alt: 'Sculpted ochre canyon walls around a dry riverbed',
    description: 'Deep-cut gorges, warm stone and shifting light.',
    intro:
      'Canyons compress distance into layers of stone, shadow and sky. Look for narrow riverbeds, improbable cliff dwellings and trails that read the geology one bend at a time.',
  },
  {
    value: 'base-camps',
    label: 'Base Camps',
    image: '/images/places/base-camps.jpg',
    alt: 'Expedition tents glowing beneath a snow-covered Himalayan peak',
    description: 'The last inhabited line before the mountain begins.',
    intro:
      'Base camps are temporary villages built around a shared ambition. Discover the approaches, rituals and stark beauty of the places where expeditions pause before going higher.',
  },
  {
    value: 'caves',
    label: 'Caves',
    image: '/images/places/caves.jpg',
    alt: 'A limestone cave opening onto a misty mountain valley',
    description: 'Cool chambers, carved sanctuaries and hidden valleys.',
    intro:
      'Caves hold geology, shelter and story in the same dark room. These routes lead to limestone chambers, cliff retreats and sacred spaces shaped as much by people as by water.',
  },
  {
    value: 'bike-tours',
    label: 'Bike Tours',
    image: '/images/places/bike-tours.jpg',
    alt: 'A cyclist on a high-altitude dirt trail above an alpine valley',
    description: 'Two wheels, long descents and roads with a horizon.',
    intro:
      'Some landscapes are best measured by cadence. Bike tours trade footfall for momentum: gravel roads, technical descents, village stops and a wider radius of discovery.',
  },
  {
    value: 'mountain-peaks',
    label: 'Mountain Peaks',
    image: '/images/places/mountain-peaks.jpg',
    alt: 'A snow-capped Himalayan summit rising above a sea of clouds',
    description: 'Summits, ridgelines and the architecture of altitude.',
    intro:
      'Peaks give a route its scale long before it reaches them. Browse summit approaches, panoramic ridges and the high places that turn a day on the trail into a landmark.',
  },
  {
    value: 'temples',
    label: 'Temples',
    image: '/images/places/temples.jpg',
    alt: 'A Himalayan temple with prayer flags and misty mountains behind it',
    description: 'Sacred architecture on the edge of the mountains.',
    intro:
      'Temples and monasteries hold the human history of a trail. These routes connect shrines, festival paths, carved courtyards and the communities that still keep them alive.',
  },
]

export const placeCategoryOptions = placeCategories.map(({ label, value }) => ({
  label,
  value,
}))

export const isPlaceCategoryValue = (value: unknown): value is PlaceCategoryValue =>
  typeof value === 'string' &&
  (PLACE_CATEGORY_VALUES as readonly string[]).includes(value)

/** Unknown CMS values are ignored rather than rendered as broken category links. */
export const getPlaceCategory = (value: unknown): PlaceCategory | null =>
  isPlaceCategoryValue(value) ? (placeCategories.find((item) => item.value === value) ?? null) : null

/** Resolve a stored multi-select value to the full, ordered category objects. */
export const resolvePlaceCategories = (
  values: readonly unknown[] | null | undefined,
): PlaceCategory[] =>
  Array.isArray(values)
    ? values
        .map(getPlaceCategory)
        .filter((category): category is PlaceCategory => category !== null)
    : []

export const PLACE_INDEX_PATH = sitePath('/places')

export const placeCategoryPath = (value: PlaceCategoryValue): string =>
  sitePath(`/places/${value}`)

export const placeCategoryPaths = (): string[] =>
  placeCategories.map((category) => placeCategoryPath(category.value))

/** A static image shaped like a Media document, for PageHeader, metadata and JSON-LD. */
export const placeCategoryMedia = (category: PlaceCategory): Media =>
  ({
    id: placeCategories.findIndex((item) => item.value === category.value) + 1,
    url: category.image,
    alt: category.alt,
    mimeType: 'image/jpeg',
    width: 1200,
    height: 1600,
    focalX: 50,
    focalY: 50,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }) as unknown as Media
