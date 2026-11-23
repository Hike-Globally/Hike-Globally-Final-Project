import { BRAND } from '@/lib/brand-colors'
import { sitePath } from '@/i18n/config'

/**
 * The nine-rung hiking difficulty scale.
 *
 * One list drives the CMS select on a trip, the homepage slider after the hero, the /trips
 * filter, and trip detail — so a level added (or renamed) here cannot drift
 * between the editor and the public site.
 *
 * The meter is one colour on every rung: `BRAND.paper`, warm paper on the ink
 * slider card it is drawn on. Intensity is already encoded twice — by the fill
 * width (20% → 100%) and by the rung's own label — so a nine-step rainbow would
 * only add noise, and one quiet colour keeps the scale inside the palette.
 */
export const DIFFICULTY_LEVELS = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Gentle days on welcoming trails — a beautiful first step into the mountains.',
    image: '/images/difficulty/easy.jpg',
    meter: '20%',
    meterColor: BRAND.paper,
    objectPosition: 'center',
  },
  {
    value: 'easy-moderate',
    label: 'Easy - Moderate',
    description: 'Unhurried walks, a little more elevation, and plenty of time to take it in.',
    image: '/images/difficulty/easy-moderate.jpg',
    meter: '29%',
    meterColor: BRAND.paper,
    objectPosition: '50% 58%',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Steady trail days with rewarding climbs and room to find your rhythm.',
    image: '/images/difficulty/moderate.jpg',
    meter: '39%',
    meterColor: BRAND.paper,
    objectPosition: '50% 58%',
  },
  {
    value: 'moderate-challenging',
    label: 'Moderate - Challenging',
    description: 'Longer days, sustained ascents, and trails that ask a little more of you.',
    image: '/images/difficulty/moderate-challenging.jpg',
    meter: '49%',
    meterColor: BRAND.paper,
    objectPosition: '50% 55%',
  },
  {
    value: 'challenging',
    label: 'Challenging',
    description: 'Big mountain days for hikers ready to work for an unforgettable view.',
    image: '/images/difficulty/challenging.jpg',
    meter: '60%',
    meterColor: BRAND.paper,
    objectPosition: '50% 55%',
  },
  {
    value: 'challenging-strenuous',
    label: 'Challenging - Strenuous',
    description: 'Long, demanding days at altitude — preparation makes all the difference.',
    image: '/images/difficulty/challenging-strenuous.jpg',
    meter: '70%',
    meterColor: BRAND.paper,
    objectPosition: '50% 62%',
  },
  {
    value: 'strenuous',
    label: 'Strenuous',
    description: 'A serious endurance test across remote terrain and consecutive hard days.',
    image: '/images/difficulty/strenuous.jpg',
    meter: '80%',
    meterColor: BRAND.paper,
    objectPosition: '50% 65%',
  },
  {
    value: 'strenuous-extreme',
    label: 'Strenuous - Extreme',
    description: 'High, exposed routes for seasoned trekkers with experience to match.',
    image: '/images/difficulty/strenuous-extreme.jpg',
    meter: '90%',
    meterColor: BRAND.paper,
    objectPosition: '50% 63%',
  },
  {
    value: 'extreme',
    label: 'Extreme',
    description: 'Technical, high-altitude objectives for experienced expedition climbers.',
    image: '/images/difficulty/extreme.jpg',
    meter: '100%',
    meterColor: BRAND.paper,
    objectPosition: '50% 67%',
  },
] as const

export type Difficulty = (typeof DIFFICULTY_LEVELS)[number]['value']

export const DIFFICULTY_VALUES: readonly Difficulty[] = DIFFICULTY_LEVELS.map(
  (level) => level.value,
)

/** Query string used to deep-link `/trips` from a homepage slider card. */
export const DIFFICULTY_QUERY_PARAM = 'difficulty'

const difficultySet: ReadonlySet<string> = new Set(DIFFICULTY_VALUES)

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && difficultySet.has(value)

export const difficultyLabel = (value: string): string =>
  DIFFICULTY_LEVELS.find((level) => level.value === value)?.label ?? value

/** Payload `select` options — labels match the public site exactly. */
export const difficultySelectOptions: { label: string; value: Difficulty }[] =
  DIFFICULTY_LEVELS.map(({ value, label }) => ({ label, value }))

export const parseDifficultyParam = (value: string | null | undefined): Difficulty | null =>
  value && isDifficulty(value) ? value : null

export const readDifficultyFromSearch = (search: string): Difficulty | 'all' => {
  const query = search.startsWith('?') ? search.slice(1) : search
  return parseDifficultyParam(new URLSearchParams(query).get(DIFFICULTY_QUERY_PARAM)) ?? 'all'
}

/** Build the search string for `/trips`, preserving any other params already on the URL. */
export const writeDifficultySearch = (search: string, value: Difficulty | 'all'): string => {
  const query = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(query)
  if (value === 'all') params.delete(DIFFICULTY_QUERY_PARAM)
  else params.set(DIFFICULTY_QUERY_PARAM, value)
  const next = params.toString()
  return next ? `?${next}` : ''
}

/** Public href for the trips listing filtered to one difficulty rung. */
export const tripsByDifficultyPath = (value: Difficulty): string =>
  sitePath(`/trips?${DIFFICULTY_QUERY_PARAM}=${encodeURIComponent(value)}`)
