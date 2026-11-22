import type { DestinationCard } from '@/lib/data'
import type { Media } from '@/payload-types'

/**
 * Fixed card lists for the two homepage destination sliders.
 *
 * "DESTINATIONS" shows the five Nepal development regions. "DESTINATIONS AROUND THE WORLD"
 * shows the six continents. Both render with the same `DestinationCarousel` and card design.
 * The cards are static on purpose, so the homepage always shows exactly these entries.
 */

const photo = (url: string, alt: string) =>
  ({ id: 0, url, alt, createdAt: '', updatedAt: '' }) as unknown as Media

const nepalRegion = (
  id: number,
  name: string,
  tagline: string,
  image: string,
): DestinationCard => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  country: 'Nepal',
  tagline,
  heroImage: photo(image, `${name} landscape`),
  region: 'annapurna',
  featured: true,
})

const continent = (id: number, name: string, tagline: string, image: string): DestinationCard => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  country: 'Continent',
  tagline,
  heroImage: photo(image, `${name} landscape`),
  region: 'annapurna',
  featured: true,
})

export const NEPAL_REGION_CARDS: DestinationCard[] = [
  nepalRegion(
    101,
    'Central Nepal',
    'Temple cities, the glaciers of Langtang and the quiet hills of Helambu.',
    '/images/regions/central-nepal.jpg',
  ),
  nepalRegion(
    102,
    'Eastern Nepal',
    'Home of Everest and Kanchenjunga, with sherpa villages and high trails.',
    '/images/regions/eastern-nepal.jpg',
  ),
  nepalRegion(
    103,
    'Far Western Nepal',
    'Api Nampa conservation area, remote valleys and a culture older than the roads.',
    '/images/regions/far-western-nepal.jpg',
  ),
  nepalRegion(
    104,
    'Mid-Western Nepal',
    'Rara, the country’s largest lake, in a national park far from the crowds.',
    '/images/regions/mid-western-nepal.jpg',
  ),
  nepalRegion(
    105,
    'Western Nepal',
    'Dhaulagiri and Annapurna country, plus the ochre cliffs of Mustang.',
    '/images/regions/western-nepal.jpg',
  ),
]

export const WORLD_REGION_CARDS: DestinationCard[] = [
  continent(
    201,
    'Asia',
    'Himalayan trails, ancient temples and mountain cultures across the continent.',
    '/images/regions/asia.jpg',
  ),
  continent(
    202,
    'Africa',
    'Savanna, highland and desert treks across one of the oldest landscapes on Earth.',
    '/images/regions/africa.jpg',
  ),
  continent(
    203,
    'Europe',
    'Alpine passes, dramatic ridgelines and centuries-old mountain huts.',
    '/images/regions/europe.jpg',
  ),
  continent(
    204,
    'Australia',
    'Red outback, coastal ranges and wilderness walks under wide open skies.',
    '/images/regions/australia.jpg',
  ),
  continent(
    205,
    'North America',
    'Rocky Mountain lakes, granite domes and national park summits.',
    '/images/regions/north-america.jpg',
  ),
  continent(
    206,
    'South America',
    'Patagonian spires, Andean passes and glacier-fed valleys.',
    '/images/regions/south-america.jpg',
  ),
]
