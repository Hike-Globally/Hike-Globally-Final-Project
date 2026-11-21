/**
 * UI strings (labels, buttons, empty states).
 *
 * TRADE-OFF: chrome copy lives in TypeScript, not in Payload.
 *   Pro — zero database queries to render a page, fully typed (a missing key is a build error),
 *         and no editor can break the layout with a 300-character button label.
 *   Con — changing a button label needs a deploy instead of a CMS save.
 *
 * All *content* (trips, destinations, posts, page blocks, navigation) still comes from Payload.
 *
 * `en` is the English source dictionary. The editable DE/FR UI dictionaries below are built
 * from `ui-translations.ts`; full frontend dictionaries (including CMS fallback strings) are
 * loaded lazily by the cookie-driven translation runtime. Payload stays single-locale and URLs
 * are unchanged. Existing components keep importing `dictionary` — the English source — and
 * their rendered output is translated in the browser for DE/FR visitors.
 */

import type { FrontendLocale } from './config'
import { normalizeTranslationKey } from './translate'
import { uiTranslations } from './ui-translations'

const affiliateDescription =
  'Hike Globally is a travel affiliate platform. We publish trip guides and connect travelers with independent operators who run the trips.'

export const en = {
  common: {
    affiliateDescription,
    readMore: 'Read more',
    viewAll: 'View all',
    viewTrip: 'View trip',
    viewDestination: 'Explore destination',
    backTo: 'Back to',
    loading: 'Loading',
    all: 'All',
    reset: 'Reset filters',
    noResultsTitle: 'Nothing matches those filters yet',
    noResultsText:
      'Try widening your search — or tell us what you are dreaming of and we will build it.',
    skipToContent: 'Skip to content',
    menu: 'Menu',
    close: 'Close',
    language: 'Language',
    share: 'Share',
    copied: 'Link copied',
    shareError: 'Could not copy link',
    from: 'From',
    perPerson: 'per person',
    perGroup: 'per group',
    days: 'days',
    nights: 'nights',
    featured: 'Featured',
    updatedOn: 'Updated',
  },
  nav: {
    home: 'Home',
    trips: 'Trips',
    destinations: 'Destinations',
    places: 'Places',
    blog: 'Journal',
    inquiry: 'Plan your trip',
    contact: 'Contact',
  },
  footer: {
    label: 'Footer',
    about: 'About',
    company: 'Company',
    legalPages: 'Legal pages',
    contactUs: 'Contact us',
    allTrips: 'All trips',
    aboutUs: 'About us',
    sitemap: 'Sitemap',
    privacy: 'Privacy',
    terms: 'Terms',
    introductionFallback: affiliateDescription,
    copyright: '© {year} {site}. All rights reserved.',
  },
  trips: {
    listingTitle: 'Trekking trips & expeditions',
    listingSubtitle:
      'Explore trekking routes from the Khumbu to Dolpo. Compare itineraries, difficulty and starting prices for trips run by independent operators.',
    filterTitle: 'Find your trip',
    difficulty: 'Difficulty',
    duration: 'Duration',
    destination: 'Destination',
    season: 'Season',
    maxPrice: 'Max price',
    any: 'Any',
    sort: 'Sort by',
    sortFeatured: 'Featured first',
    sortPriceAsc: 'Price: low to high',
    sortPriceDesc: 'Price: high to low',
    sortDurationAsc: 'Shortest first',
    sortDurationDesc: 'Longest first',
    resultCount_one: '{count} trip',
    resultCount_other: '{count} trips',
    difficultyEasy: 'Easy',
    difficultyEasyModerate: 'Easy - Moderate',
    difficultyModerate: 'Moderate',
    difficultyModerateChallenging: 'Moderate - Challenging',
    difficultyChallenging: 'Challenging',
    difficultyChallengingStrenuous: 'Challenging - Strenuous',
    difficultyStrenuous: 'Strenuous',
    difficultyStrenuousExtreme: 'Strenuous - Extreme',
    difficultyExtreme: 'Extreme',
    seasonSpring: 'Spring',
    seasonSummer: 'Summer',
    seasonAutumn: 'Autumn',
    seasonWinter: 'Winter',
    typeTrekking: 'Trekking',
    typeExpedition: 'Expedition',
    typePeakClimbing: 'Peak climbing',
    typeCultural: 'Cultural tour',
    typeHeli: 'Helicopter tour',
    typeMultiSport: 'Multi-sport',
  },
  author: {
    education: 'Education',
    credentials: 'Professional credentials',
    website: 'Website',
    profiles: 'Author profiles',
  },
  trip: {
    aboutGuide: 'About the itinerary expert',
    overview: 'Trip overview',
    itinerary: 'Detailed Itinerary',
    /** Label on the switch beside the itinerary heading — opens/closes every day at once. */
    expandAll: 'Expand all',
    essentialInformation: 'Essential Information You Must Know',
    hotelsNearDestination: 'Hotels Near Destination',
    included: "What's included",
    notIncluded: "What's not included",
    packingList: 'Packing list',
    /** Standfirst under the packing-list heading. */
    packingListIntro:
      'Everything a porter will carry and everything you keep on your back, split into three bags. Tick items off as you pack — the checklist stays in this browser.',
    packingItemsStat: 'Items',
    packingGroupsStat: 'Groups',
    packingPackedStat: 'Packed',
    packingStartTicking: 'Start ticking items off',
    packingAllPacked: 'Everything packed — see you on the trail',
    packingYourProgress: 'Your packing',
    packingLocalNote: 'Saved in this browser only — nothing is sent to us.',
    packingReset: 'Reset',
    // These sit under a group heading at ~174px wide on a phone, so each is kept to a length that
    // finishes on the second line at 390px rather than being clipped mid-word by the line clamp.
    packingBlurbClothing: 'Layers for sun and cold. Boots never new.',
    packingBlurbEquipment: 'The kit that carries you and keeps you dry.',
    packingBlurbPersonal: 'Documents, medicine and the comforts of home.',
    gallery: 'Gallery',
    faqs: 'Frequently Asked Questions',
    related: 'You may also like',
    highlights: 'Key Highlights',
    /** Small uppercase labels above the two “Who Is This Trip For / Not For” card headings. */
    audienceForEyebrow: 'The right fit',
    audienceNotForEyebrow: 'Not the right fit',
    factsTitle: 'Trip at a glance',
    duration: 'Duration',
    groupSize: 'Group size',
    maxAltitude: 'Max altitude',
    difficulty: 'Difficulty',
    bestSeason: 'Best season',
    destination: 'Destination',
    accommodation: 'Accommodation',
    altitude: 'Altitude',
    food: 'Food',
    foodIncluded: 'Included',
    foodNotIncluded: 'Not included',
    foodPartial: 'Partly included',
    pricePerPerson: 'Price per person',
    pricePerGroup: 'Price per group',
    difficultyLevel: 'Difficulty level',
    bookThisTrek: 'Book This Trek',
    downloadBrochure: 'Download Trip Brochure',
    day: 'Day',
    elevation: 'Elevation',
    enquire: 'Request this trip',
    bookNow: 'Book now',
    shareTrip: 'Share this trip',
    departures: 'Departures',
    allDates: 'All dates',
    enquireDate: 'Enquire',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    departureDateLegend: 'Departure date',
    selectedWindowLegend: 'Selected trek',
    noDeparturesInMonth: 'No departures scheduled in this month.',
    viewAllDates: 'View all dates',
    notFound: 'That trip no longer exists.',
  },
  destinations: {
    listingTitle: 'Destinations',
    homeSectionTitle: 'Destinations in Nepal',
    listingSubtitle:
      'Eight mountain regions, one country that rearranges your sense of scale. Start with the classics or go looking for the quiet ones.',
    tripsCount_one: '{count} trip',
    tripsCount_other: '{count} trips',
    bestTime: 'Best time to visit',
    gettingThere: 'Getting there',
    about: 'About',
    region: 'Region',
    country: 'Country',
    tripsHere: 'Trips in',
    notFound: 'That destination no longer exists.',
    seasonSpring: 'Spring (Mar–May)',
    seasonSummer: 'Summer (Jun–Aug)',
    seasonAutumn: 'Autumn (Sep–Nov)',
    seasonWinter: 'Winter (Dec–Feb)',
    regionKhumbu: 'Khumbu / Everest',
    regionAnnapurna: 'Annapurna',
    regionLangtang: 'Langtang',
    regionManaslu: 'Manaslu',
    regionMustang: 'Mustang',
    regionDolpo: 'Dolpo',
    regionKanchenjunga: 'Kanchenjunga',
    regionPokhara: 'Pokhara & Lakeside',
    regionKathmandu: 'Kathmandu Valley',
    regionOther: 'Other',
  },
  blog: {
    listingTitle: 'The Hike Globally journal',
    listingSubtitle:
      'Trip reports, packing lists, and hard-won advice from guides who spend 200 days a year on the trail.',
    /** Eyebrow of the `/blog` hero band, above the display headline. */
    heroEyebrow: 'Dispatches from the Himalaya',
    /** Side note beside the hero's jump link, as on `/trips` and `/destinations`. */
    heroNote: 'Written by the guides who lead the way.',
    featured: 'Featured story',
    latest: 'Latest stories',
    readTime: '{minutes} min read',
    readStory: 'Read story',
    /** Foot of the homepage journal index — the column-level link to `/blog`. */
    browseJournal: 'Browse the journal',
    by: 'By',
    publishedOn: 'Published',
    related: 'Keep reading',
    relatedSubtitle: 'More field notes for the road ahead.',
    backToJournal: 'Back to the journal',
    fieldNotes: 'Field notes',
    inThisStory: 'In this story',
    readingProgress: 'Article reading progress',
    aboutAuthor: 'The voice behind the story',
    planningEyebrow: 'Your next trail',
    planningTitle: 'The best stories are still ahead.',
    planningText:
      'Dreaming beyond the page? Our local guides will help you find the route that feels like yours.',
    planningLink: 'Plan your trip',
    /** Heading of the post's FAQ section — the same wording as on trip pages. */
    faqs: 'Frequently Asked Questions',
    notFound: 'That article no longer exists.',
    allCategories: 'All topics',
    categoryTrekkingGuides: 'Trekking guides',
    categoryGear: 'Gear & packing',
    categoryDestinations: 'Destination guides',
    categoryCulture: 'Culture & people',
    categoryHealthSafety: 'Health & safety',
    categorySustainability: 'Sustainability',
    categoryTripReports: 'Trip reports',
    categoryNews: 'News',
  },
  inquiry: {
    title: 'Plan your trip',
    subtitle: 'Tell us what you have in mind and we’ll help point you in the right direction.',
    formTitle: 'Request a quote',
    name: 'Full name',
    email: 'Email address',
    phone: 'Phone / WhatsApp',
    country: 'Country of residence',
    trip: 'Trip of interest',
    tripPlaceholder: 'Select a trip',
    noTrip: 'Not sure yet — help me choose',
    travellers: 'Travellers',
    startDate: 'Preferred start date',
    flexible: 'Dates are flexible',
    message: 'Tell us about your plans',
    messagePlaceholder:
      'Fitness level, time of year, must-sees, dietary needs, anything else we should know…',
    submit: 'Send enquiry',
    submitting: 'Sending…',
    required: 'Required',
    successTitle: 'Thank you — your enquiry is on its way',
    successText: 'Thank you for getting in touch. We’ll be in contact about your enquiry.',
    successBackHome: 'Back to the homepage',
    successBrowseTrips: 'Browse more trips',
    privacyNote: 'We only use your details to answer your enquiry. No newsletters, no resale.',
    openWhatsApp: 'Chat on WhatsApp',
    emailUs: 'Email us directly',
    callUs: 'Call us',
    contact: 'Contact',
  },
  cta: {
    /** Eyebrow of the homepage's closing card (the fallback render path). */
    eyebrow: 'Plan your trip',
    /** Headline of the homepage's closing card — the `<i>…</i>` becomes its serif italic line. */
    heading: 'Ready to walk where the <i>map runs out of names?</i>',
    /** Button of the homepage's closing card. */
    action: 'Start your enquiry',
    replyTime: 'Replies within 24 hours',
    localGuides: 'Led by local Sherpa guides',
    smallGroups: 'Small groups, tailored to you',
    /** Rotating stamp around the closing card's mountain mark. */
    stamp: 'HIKE GLOBALLY · NEPAL · EST. 2012 · ',
    coordinates: '27.9881° N · 86.9250° E',
    region: 'Khumbu, Nepal',
  },
  notFound: {
    title: 'This trail runs out here',
    text: 'The page you were looking for has moved or never existed. Let us point you back to the good stuff.',
    home: 'Back to the homepage',
    trips: 'Browse trips',
  },
  structuredData: {
    organization: 'Hike Globally',
  },
} as const

/** Widens the literal types of the dictionary (literal string types -> string). */
type Widen<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends (...args: never[]) => unknown
      ? T[K]
      : Widen<T[K]>
}

export type Dictionary = Widen<typeof en>

/** English source dictionary, kept as the default for existing server/client imports. */
export const dictionary: Dictionary = en

function localizeValue(value: unknown, translations: Record<string, string>): unknown {
  if (typeof value === 'string') {
    return translations[normalizeTranslationKey(value)] ?? value
  }
  if (Array.isArray(value)) {
    return value.map((item) => localizeValue(item, translations))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        localizeValue(item, translations),
      ]),
    )
  }
  return value
}

/** Typed, editable UI dictionaries for the frontend-only language switcher. */
export const de: Dictionary = localizeValue(en, uiTranslations.de) as Dictionary
export const fr: Dictionary = localizeValue(en, uiTranslations.fr) as Dictionary

export const dictionaries: Record<FrontendLocale, Dictionary> = {
  en: dictionary,
  de,
  fr,
}

export const getDictionary = (locale: FrontendLocale): Dictionary =>
  dictionaries[locale] ?? dictionary

/** Tiny ICU-style interpolation: t('{count} trips', { count: 12 }) */
export const t = (template: string, values: Record<string, string | number> = {}): string =>
  template.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? `{${key}}`))

/**
 * Plural-aware helper for pairs like `{count} trip` / `{count} trips`.
 * Pass the dictionary group that holds the `_one` / `_other` keys (e.g. `dict.trips`).
 */
export const plural = (
  group: Record<string, string>,
  count: number,
  values: Record<string, string | number> = {},
): string => {
  const keys = Object.keys(group)
  const one = group[keys.find((key) => key.endsWith('_one')) ?? keys[0]!]!
  const other = group[keys.find((key) => key.endsWith('_other')) ?? keys[0]!]!
  return t(count === 1 ? one : other, { count, ...values })
}

/**
 * Human label for a blog category value.
 *
 * The category filter on `/blog` and the `articleSection` of a post's BlogPosting markup both need
 * the same readable name for `'health-safety'`, so the lookup lives here instead of being
 * re-implemented in a component (and silently missing the structured data).
 */
const categoryKey = (value: string): keyof Dictionary['blog'] =>
  `category${value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}` as keyof Dictionary['blog']

export const blogCategoryLabelForDictionary = (value: string, dict: Dictionary): string =>
  dict.blog[categoryKey(value)] ?? value

export const blogCategoryLabel = (value: string): string =>
  blogCategoryLabelForDictionary(value, dictionary)
