/**
 * UI strings (labels, buttons, empty states).
 *
 * TRADE-OFF: chrome copy lives in TypeScript, not in Payload.
 *   Pro — zero database queries to render a page, fully typed (a missing key is a build error),
 *         and no editor can break the layout with a 300-character button label.
 *   Con — changing a button label needs a deploy instead of a CMS save.
 *
 * All *content* (trips, destinations, posts, page blocks, navigation) still comes from Payload.
 */

const en = {
  common: {
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
    privacy: 'Privacy',
    terms: 'Terms',
    introductionFallback:
      'Hike Globally offers curated travel packages and unforgettable adventures, helping you explore breathtaking destinations and create memories that last a lifetime.',
    copyright: '© {year} {site}. All rights reserved.',
  },
  trips: {
    listingTitle: 'Trekking trips & expeditions',
    listingSubtitle:
      'Small groups, local Sherpa guides, and itineraries we have walked ourselves — from the Khumbu to the hidden valleys of Dolpo.',
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
  trip: {
    overview: 'Trip overview',
    itinerary: 'Detailed Itinerary',
    /** Label on the switch beside the itinerary heading — opens/closes every day at once. */
    expandAll: 'Expand all',
    essentialInformation: 'Essential Information You Must Know',
    included: "What's included",
    notIncluded: "What's not included",
    gallery: 'Gallery',
    faqs: 'Frequently Asked Questions',
    related: 'You may also like',
    highlights: 'Highlights',
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
    day: 'Day',
    elevation: 'Elevation',
    enquire: 'Request this trip',
    bookNow: 'Book now',
    shareTrip: 'Share this trip',
    notFound: 'That trip no longer exists.',
  },
  destinations: {
    listingTitle: 'Destinations',
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
    featured: 'Featured story',
    latest: 'Latest stories',
    readTime: '{minutes} min read',
    readStory: 'Read story',
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
    subtitle:
      'Tell us roughly what you have in mind. A real person — usually the guide who would lead you — replies within 24 hours.',
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
    successText:
      'We have received your message and will reply within 24 hours, usually with a first draft itinerary.',
    successBackHome: 'Back to the homepage',
    successBrowseTrips: 'Browse more trips',
    privacyNote: 'We only use your details to answer your enquiry. No newsletters, no resale.',
    openWhatsApp: 'Chat on WhatsApp',
    emailUs: 'Email us directly',
    callUs: 'Call us',
    contact: 'Contact',
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

/** The one and only UI dictionary. */
export const dictionary: Dictionary = en

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
