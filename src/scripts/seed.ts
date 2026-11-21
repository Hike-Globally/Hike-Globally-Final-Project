/**
 * ============================================================================
 * Seed script — `npm run seed`
 * ============================================================================
 * Creates a complete, ready-to-look-at website:
 *   • an admin user and an author
 *   • generated mountain imagery (SVG → JPEG via sharp, so the repo stays tiny)
 *   • 4 destinations, 6 trips, 5 journal posts
 *   • the homepage, an about page, and the header/footer/settings globals
 *
 * Everything is created in English — the site's only language.
 *
 * Revalidation is disabled for the run: there is no Next.js request scope in a CLI process.
 */
process.env.DISABLE_REVALIDATION = 'true'

import sharp from 'sharp'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'

import config from '../payload.config'
import { BRAND, mixHex } from '../lib/brand-colors'
import type { Page } from '../payload-types'

/* -------------------------------------------------------------------------- */
/* Lexical helpers — build rich text without copy-pasting JSON                 */
/* -------------------------------------------------------------------------- */

/**
 * Seed-only mirrors of the CMS option values. Spelling them out here means a typo in the seed
 * ("moderate" vs "Moderate") is a compile error rather than a validation error at runtime.
 */
type Season = 'spring' | 'summer' | 'autumn' | 'winter'
type Region =
  | 'khumbu'
  | 'annapurna'
  | 'langtang'
  | 'manaslu'
  | 'mustang'
  | 'dolpo'
  | 'kanchenjunga'
  | 'pokhara'
  | 'kathmandu'
  | 'other'
type PostCategory =
  | 'destinations'
  | 'trekking-guides'
  | 'gear'
  | 'culture'
  | 'health-safety'
  | 'sustainability'
  | 'trip-reports'
  | 'news'

/**
 * Lexical stores rich text as structured JSON. Payload's generated type expects every node to
 * carry `type` and `version`, so the helpers below are typed accordingly — a malformed node
 * becomes a compile error instead of a validation error halfway through the seed.
 */
type LexicalNode = { type: string; version: number; [key: string]: unknown }

type RichTextValue = {
  root: {
    type: string
    children: LexicalNode[]
    direction: 'ltr' | 'rtl' | null
    format: '' | 'left' | 'start' | 'center' | 'right' | 'end' | 'justify'
    indent: number
    version: number
    [key: string]: unknown
  }
  [key: string]: unknown
}

const text = (value: string, format = 0): LexicalNode => ({
  type: 'text',
  version: 1,
  text: value,
  format,
})

const paragraph = (value: string): LexicalNode => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [text(value)],
})

const heading = (value: string, tag: 'h2' | 'h3' = 'h2'): LexicalNode => ({
  type: 'heading',
  version: 1,
  tag,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [text(value)],
})

const bulletList = (items: string[]): LexicalNode => ({
  type: 'list',
  version: 1,
  listType: 'bullet',
  tag: 'ul',
  format: '',
  indent: 0,
  direction: 'ltr',
  children: items.map((item, index) => ({
    type: 'listitem',
    version: 1,
    value: index + 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [paragraph(item)],
  })),
})

const richText = (...nodes: LexicalNode[]): RichTextValue => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: nodes },
})

/**
 * A packing list filed into the three accordions the trip page renders — Clothing and Footwear,
 * Trekking Equipment, Personal Items. Seeded this way so a fresh install demonstrates the grouped
 * view instead of a wall of untagged rows.
 */
const packingList = (
  groups: {
    clothing?: string[]
    equipment?: string[]
    personal?: string[]
  },
) => [
  ...(groups.clothing ?? []).map((item) => ({ item, category: 'clothing-footwear' as const })),
  ...(groups.equipment ?? []).map((item) => ({ item, category: 'trekking-equipment' as const })),
  ...(groups.personal ?? []).map((item) => ({ item, category: 'personal-items' as const })),
]

/* -------------------------------------------------------------------------- */
/* Image generation                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Palettes for the generated mountain scenes — `[sky top, horizon, light]`.
 *
 * Every entry is a brand colour or a tint mixed from one (the same source of
 * truth the canvas and SVG chrome use, `src/lib/brand-colors.ts`), so the seeded
 * placeholder photography sits in the same world as the interface around it
 * instead of introducing ambers and olives the UI never uses.
 */
const HAZE_TINT = mixHex(BRAND.white, BRAND.haze, 0.4)
const DUSK_BLUE = mixHex(BRAND.ink, BRAND.deep, 0.45)
const PALETTES: [string, string, string][] = [
  [BRAND.ink, BRAND.deep, BRAND.mist],
  [BRAND.ink, BRAND.slate, BRAND.haze],
  [DUSK_BLUE, BRAND.haze, HAZE_TINT],
  [BRAND.ink, DUSK_BLUE, BRAND.mist],
  [BRAND.ink, BRAND.slate, HAZE_TINT],
  [BRAND.ink, BRAND.deep, BRAND.white],
]

/** Deterministic pseudo-random so the same seed always produces the same scene. */
const rand = (seed: number) => {
  let value = seed * 9301 + 49297
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

const scene = (index: number, label: string): string => {
  const [deep, mid, light] = PALETTES[index % PALETTES.length]!
  const random = rand(index + 7)
  const width = 1920
  const height = 1280

  const ridge = (
    baseY: number,
    amplitude: number,
    roughness: number,
    fill: string,
    opacity: number,
  ) => {
    const points: string[] = [`0,${height}`, `0,${baseY}`]
    const steps = 7
    for (let step = 0; step <= steps; step += 1) {
      const x = (width / steps) * step
      const y = baseY - amplitude * (0.4 + random() * roughness)
      points.push(`${Math.round(x)},${Math.round(y)}`)
    }
    points.push(`${width},${height}`)
    return `<polygon points="${points.join(' ')}" fill="${fill}" opacity="${opacity}"/>`
  }

  const sunX = 380 + random() * 1100
  const sunY = 220 + random() * 220

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="sky${index}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${deep}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${light}"/>
    </linearGradient>
    <linearGradient id="fade${index}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${deep}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${deep}" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#sky${index})"/>
  <circle cx="${Math.round(sunX)}" cy="${Math.round(sunY)}" r="${Math.round(70 + random() * 60)}" fill="${light}" opacity="0.55"/>
  ${ridge(780, 320, 1, mid, 0.75)}
  ${ridge(920, 260, 0.9, deep, 0.85)}
  ${ridge(1080, 180, 0.7, deep, 1)}
  <rect y="${height - 460}" width="${width}" height="460" fill="url(#fade${index})"/>
  <text x="96" y="${height - 96}" font-family="Helvetica, Arial, sans-serif" font-size="54" font-weight="600" fill="${light}" opacity="0.85">${label}</text>
</svg>`
}

const renderImage = async (index: number, label: string): Promise<Buffer> =>
  sharp(Buffer.from(scene(index, label)))
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer()

/* -------------------------------------------------------------------------- */
/* Seed                                                                        */
/* -------------------------------------------------------------------------- */

const run = async () => {
  const payload = await getPayload({ config })

  console.log('∙ Seeding Hike Globally…')

  /* ---------- users ---------- */
  const existingUsers = await payload.find({ collection: 'users', limit: 1 })

  let authorId: number

  if (existingUsers.docs.length === 0) {
    const admin = await payload.create({
      collection: 'users',
      data: {
        name: 'Hike Globally Admin',
        email: 'admin@hikeglobally.com',
        password: 'hike-globally-2026',
        roles: ['admin'],
        bio: 'Keeps the route notes honest and the tea bills paid.',
      },
    })

    const author = await payload.create({
      collection: 'users',
      data: {
        name: 'Sarita Gurung',
        email: 'sarita@hikeglobally.com',
        password: 'hike-globally-2026',
        roles: ['editor'],
        bio: 'UIAGM/IFMGA aspirant guide from Ghandruk. Twelve years on the trail, eight winter crossings.',
      },
    })

    authorId = author.id
    console.log(`  ✓ Created users (admin: ${admin.email} / sarita@hikeglobally.com)`)
  } else {
    const users = await payload.find({ collection: 'users', limit: 10 })
    const author =
      users.docs.find((user) => user.email !== 'admin@hikeglobally.com') ?? users.docs[0]!
    authorId = author.id
    console.log('  • Users already exist — reusing them')
  }

  /* ---------- media ---------- */
  const existingMedia = await payload.count({ collection: 'media' })
  let mediaIds: number[] = []

  if (existingMedia.totalDocs > 0) {
    const media = await payload.find({ collection: 'media', limit: 40, sort: 'id' })
    mediaIds = media.docs.map((doc) => doc.id)
    console.log('  • Media already exists — reusing it')
  } else {
    const labels = [
      'Ama Dablam at dawn',
      'Khumbu冰川',
      'Annapurna south face',
      'Langtang valley',
      'Mustang, Lo Manthang',
      'Manaslu base camp',
      'Prayer flags, Tengboche',
      'Suspension bridge, Bhote Koshi',
      'Yak train, Thame',
      'Pokhara, Phewa lake',
      'Kathmandu, Boudhanath',
      'Trail to Gokyo Ri',
    ].map((label, index) => (index === 1 ? 'Khumbu icefall' : label))

    for (const [index, label] of labels.entries()) {
      const buffer = await renderImage(index, label)

      const media = await payload.create({
        collection: 'media',
        data: {
          alt: `${label} — Himalayan landscape photographed on a Hike Globally expedition`,
          caption: label,
        },
        file: {
          name: `${label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}.jpg`,
          data: buffer,
          mimetype: 'image/jpeg',
          size: buffer.byteLength,
        },
      })

      mediaIds.push(media.id)
    }

    console.log(`  ✓ Created ${mediaIds.length} images`)
  }

  const imageAt = (index: number) => mediaIds[index % mediaIds.length]!

  /* ---------- destinations ---------- */
  const destinationData = [
    {
      name: 'Khumbu & Everest',
      tagline:
        'The valley that invented Himalayan trekking — icefalls, Sherpa monasteries and the world’s highest skyline.',
      country: 'Nepal',
      region: 'khumbu' as const,
      bestSeasons: ['spring', 'autumn', 'winter'],
      coordinates: { latitude: 27.9881, longitude: 86.925 },
      featured: true,
      description: richText(
        paragraph(
          'The Khumbu is where Himalayan trekking was invented, and it has never been surpassed for sheer drama. Within a single day’s walk you move from rhododendron forest to glacial moraine, from mani walls to 8,000-metre summits.',
        ),
        heading('Why the Khumbu'),
        paragraph(
          'Lukla’s airstrip is the front door, but the valley quickly opens into something older than tourism: Tengboche’s monastery, Khumjung’s potato terraces, the yak pastures above Thame. Trails are well graded, teahouses are excellent, and the high passes (Cho La, Renjo La, Kongma La) let you build anything from a 12-day classic to a three-week traverse.',
        ),
        bulletList([
          'Best lodge infrastructure in Nepal — hot showers and apple pie at 4,300 m',
          'Tengboche and Pangboche monasteries, both active centres of Sherpa Buddhism',
          'Everest Base Camp, Kala Patthar, Gokyo Lakes and the Three Passes in one region',
          'Sagarmatha National Park permits, checked at Monjo and Namche',
        ]),
      ),
      gettingThere: richText(
        paragraph(
          'Fly Kathmandu → Lukla (35 minutes, weather-dependent) or drive to Jiri / Salleri and walk in overland for a lower, slower acclimatisation profile. We build in a contingency day in Kathmandu at the start of every Khumbu itinerary — Lukla flights move to their own schedule.',
        ),
      ),
    },
    {
      name: 'Annapurna',
      tagline:
        'Rice terraces to ice amphitheatre in one week — the most varied trekking in the Himalaya.',
      country: 'Nepal',
      region: 'annapurna' as const,
      bestSeasons: ['spring', 'autumn'],
      coordinates: { latitude: 28.53, longitude: 83.87 },
      featured: true,
      description: richText(
        paragraph(
          'The Annapurna region packs more landscape per kilometre than anywhere else on earth. Start in subtropical rice terraces at 800 m and finish inside a glacial amphitheatre ringed by 7,000-metre peaks — in the space of seven walking days.',
        ),
        heading('Two classic routes'),
        paragraph(
          'The Annapurna Base Camp trek follows the Modi Khola into the sanctuary itself. The Annapurna Circuit crosses Thorong La (5,416 m) into the rain-shadow desert of Mustang. Both are lodge-based, both are teahouse-comfortable, and both can be combined with the Khopra Ridge or Mardi Himal for quieter walking.',
        ),
        bulletList([
          'Gurung and Magar villages — Ghandruk, Chomrong, Manang',
          'Sunrise from Poon Hill over Dhaulagiri and Annapurna I',
          'Natural hot springs at Tatopani and the Kali Gandaki gorge',
          'ACAP permits and TIMS, arranged in Pokhara',
        ]),
      ),
      gettingThere: richText(
        paragraph(
          'Pokhara is the gateway: a 25-minute flight or a 6–8 hour drive from Kathmandu. Most itineraries begin at Nayapul or Besisahar, both a short private transfer from Lakeside.',
        ),
      ),
    },
    {
      name: 'Langtang',
      tagline:
        'Kathmandu’s closest wilderness — Tamang villages, yak pastures and a valley that recovered from tragedy.',
      country: 'Nepal',
      region: 'langtang' as const,
      bestSeasons: ['spring', 'autumn', 'winter'],
      coordinates: { latitude: 28.21, longitude: 85.55 },
      featured: true,
      description: richText(
        paragraph(
          'Two days’ drive from Kathmandu and you are in a valley that feels a century away. Langtang is Tamang country: butter tea, hand-carved windows, and a monastery at Kyanjin Gompa that sits directly under the Langtang Lirung icefall.',
        ),
        heading('The valley today'),
        paragraph(
          'The 2015 earthquake destroyed the village of Langtang; the valley has been rebuilt by the families who stayed. Walking here is the most direct way to put your trip money into a community that needs it. Combine with the Gosainkunda lakes or the Tamang Heritage Trail for a longer loop.',
        ),
        bulletList([
          'Closest trekking region to Kathmandu — 6–7 hours by road to Syabrubesi',
          'Kyanjin Ri (4,773 m) and Tsergo Ri (4,984 m) as acclimatisation summits',
          'Langtang National Park: red panda, Himalayan tahr, 250+ bird species',
          'Excellent winter option when the Khumbu is cold',
        ]),
      ),
      gettingThere: richText(
        paragraph(
          'Private jeep or local bus from Kathmandu to Syabrubesi via Trishuli (roughly 7 hours). We use private transport for comfort and to keep the schedule under our control.',
        ),
      ),
    },
    {
      name: 'Mustang',
      tagline:
        'A Tibetan kingdom behind the rain shadow — ochre cliffs, cave monasteries and 700-year-old walled cities.',
      country: 'Nepal',
      region: 'mustang' as const,
      bestSeasons: ['spring', 'summer', 'autumn'],
      coordinates: { latitude: 29.05, longitude: 83.95 },
      description: richText(
        paragraph(
          'North of the Dhaulagiri massif the monsoon never arrives. Mustang is a high desert of ochre cliffs and wind-carved canyons, culturally and geographically more Tibetan than Nepali — it was a forbidden kingdom until 1992.',
        ),
        heading('Restricted area'),
        paragraph(
          'Upper Mustang requires a restricted-area permit (minimum two trekkers, arranged with a registered agency) and the walled city of Lo Manthang rewards every rupee of it: 700-year-old monasteries, royal palaces, and sky caves that archaeologists are still dating.',
        ),
        bulletList([
          'Lo Manthang and the royal palace — closed to outsiders until 1992',
          'Sky caves above Chhoser, some with 2,000-year-old murals',
          'Trekking in the monsoon months, when the rest of Nepal is soaked',
          'Jeep access from Jomsom for a shorter, softer version',
        ]),
      ),
      gettingThere: richText(
        paragraph(
          'Fly Pokhara → Jomsom (20 minutes, morning flights only because of wind), then walk north up the Kali Gandaki. Overland jeep from Pokhara via Beni is possible but long.',
        ),
      ),
    },
  ] satisfies ({ region: Region; bestSeasons: Season[] } & Record<string, unknown>)[]

  const destinationIds: number[] = []

  for (const [index, destination] of destinationData.entries()) {
    const created = await payload.create({
      collection: 'destinations',

      data: {
        ...destination,
        slug: destination.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/&/g, ''),
        heroImage: imageAt(index),
        gallery: [
          { image: imageAt(index + 1) },
          { image: imageAt(index + 2) },
          { image: imageAt(index + 3) },
        ],
        meta: {
          title: `${destination.name} trekking — Hike Globally`,
          description: destination.tagline,
        },
        _status: 'published',
      } satisfies RequiredDataFromCollectionSlug<'destinations'>,
    })

    destinationIds.push(created.id)
  }

  console.log(`  ✓ Created ${destinationIds.length} destinations`)

  /* ---------- trips ---------- */
  const tripData = [
    {
      destinationIndex: 0,
      // The "Keywords" section: the phrases this page targets. Published as
      // <meta name="keywords">, article:tag and the JSON-LD keywords.
      title: 'Everest Base Camp Trek',
      keywords: [
        'everest base camp trek',
        'everest base camp trek cost',
        'ebc trek itinerary',
        'everest base camp trek difficulty',
      ],
      summary:
        'The classic 14-day walk to the foot of the world’s highest mountain, with Kala Patthar sunrise and three acclimatisation days built in.',
      durationDays: 14,
      durationNights: 13,
      groupSizeMax: 12,
      maxAltitude: 5545,
      difficulty: 'challenging' as const,
      tripType: 'trekking' as const,
      bestSeasons: ['spring', 'autumn'],
      priceFrom: 1850,
      priceCurrency: 'USD' as const,
      priceUnit: 'per-person' as const,
      priceNote: 'Based on a group of 6. Private departures from $2,480.',
      featured: true,
      highlights: [
        'Sunrise on Everest from Kala Patthar (5,545 m)',
        'Tengboche monastery with Ama Dablam behind the prayer wheel',
        'The Khumbu icefall from Base Camp, reached on foot',
        'Namche Bazaar market day and the Sherpa museum',
      ].map((value) => ({ text: value })),
      tripForDescription: richText(
        paragraph(
          'A first taste of high altitude for walkers who want the real Himalaya without technical climbing.',
        ),
        bulletList([
          'Regular hikers comfortable with 6–8 hours on foot, day after day',
          'First-timers at altitude who want a proven, well-paced acclimatisation plan',
          'Travellers happy with simple teahouse rooms and shared facilities',
          'Anyone who has dreamed of standing beneath Everest, Lhotse and Nuptse',
        ]),
      ),
      tripNotForDescription: richText(
        paragraph('Honest expectations make for better trips — this one may not suit you if:'),
        bulletList([
          'You have heart or lung conditions your doctor has not cleared for 5,000 m+',
          'You need hotel-standard comfort, private bathrooms or reliable hot showers',
          'Your dates are fixed tight — mountain weather can delay Lukla flights by a day or more',
          'You are looking for a technical summit — Island Peak is the trip for that',
        ]),
      ),
      included: [
        'Kathmandu ↔ Lukla flights, incl. 15 kg checked baggage',
        'All teahouse accommodation on a twin-share basis',
        'Three meals a day from the lodge menu',
        'Licensed English-speaking guide, assistant guide above 8 trekkers',
        'Porters (1 per 2 trekkers), insured and equipped',
        'Sagarmatha National Park permit, TIMS and local taxes',
      ].map((value) => ({ item: value })),
      notIncluded: [
        'International flights and Nepal visa (US$ 50 for 30 days)',
        'Travel and rescue insurance (mandatory)',
        'Personal trekking gear — a full packing list is sent on booking',
        'Hot showers, device charging and Wi-Fi in the lodges',
        'Gratuities for guide and porters',
      ].map((value) => ({ item: value })),
      packingList: packingList({
        clothing: [
          'Trekking boots, broken in — never new',
          'Down jacket rated to −15 °C (rentable in Kathmandu)',
          'Fleece or soft-shell mid layer',
          'Two base-layer tops, merino preferred',
          'Trekking trousers and one pair of shorts',
          'Five pairs of wool-blend socks plus liner socks',
          'Warm hat, sun cap, buff and sunglasses (category 4)',
          'Insulated and liner gloves, waterproof mittens above 4,500 m',
          'Gaiters and a waterproof outer shell',
        ],
        equipment: [
          '65–75 L duffel for the porter, 25–35 L daypack for you',
          'Sleeping bag rated to −15 °C with a silk liner',
          'Trekking poles, aluminium or carbon',
          'Headtorch with spare batteries',
          'Insulated flask and a 2 L water bladder',
          'Rain cover for the daypack and a dry bag for documents',
          'Microspikes for the Khumbu glacier section in shoulder season',
        ],
        personal: [
          'Passport (six months validity), visa and four photos',
          'Insurance policy that explicitly covers trekking to 6,000 m',
          'Diamox, ibuprofen, rehydration salts and personal medication',
          'Water purification tablets or a filter bottle',
          'SPF 50 sunscreen, lip balm and a small first-aid kit',
          'Toiletries, quick-dry towel and hand sanitiser',
          'Power bank, spare camera battery and a universal adapter',
          'Cash in rupees for hot showers, charging and tips',
          'A book, notebook and pen for the lodge evenings',
        ],
      }),
      faqs: [
        {
          question: 'How fit do I need to be?',
          answer:
            'You should be able to walk 6–8 hours a day on uneven ground for several consecutive days with a light daypack. We send a training plan 8 weeks before departure.',
        },
        {
          question: 'What about altitude?',
          answer:
            'The itinerary has two dedicated acclimatisation days (Namche and Dingboche) and gains no more than 400 m of sleeping altitude per day above 3,000 m. Guides carry pulse oximeters and a portable hyperbaric bag.',
        },
        {
          question: 'What if Lukla flights are cancelled?',
          answer:
            'Weather closes Lukla roughly one day in six in peak season. We build a buffer day into the schedule and can rebook onto a helicopter or reroute via Jiri at our cost, not yours.',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrive in Kathmandu (1,400 m)',
          altitude: 1400,
          description:
            'Airport transfer, gear check and briefing at the hotel. Welcome dinner in Thamel.',
          accommodation: 'Hotel in Kathmandu',
        },
        {
          day: 2,
          title: 'Fly to Lukla, trek to Phakding (2,610 m)',
          altitude: 2610,
          description:
            'The 35-minute flight to Lukla is the best value sightseeing in aviation. Gentle three-hour walk down the Dudh Koshi to Phakding.',
          accommodation: 'Teahouse',
        },
        {
          day: 3,
          title: 'Phakding to Namche Bazaar (3,440 m)',
          altitude: 3440,
          description:
            'Six suspension bridges, the Hillary Bridge, and the long climb up to Namche. First view of Everest from the top of the ridge.',
          accommodation: 'Teahouse',
        },
        {
          day: 4,
          title: 'Acclimatisation day in Namche',
          altitude: 3440,
          description:
            'Walk to Khumjung or the Everest View Hotel and back down to sleep. This day is what makes the rest of the trek work.',
          accommodation: 'Teahouse',
        },
        {
          day: 5,
          title: 'Namche to Tengboche (3,860 m)',
          altitude: 3860,
          description:
            'Rhododendron forest, the Dudh Koshi far below, and the monastery at Tengboche with Ama Dablam directly behind it.',
          accommodation: 'Teahouse',
        },
        {
          day: 6,
          title: 'Tengboche to Dingboche (4,410 m)',
          altitude: 4410,
          description:
            'Above the tree line now. Yak pastures, stone walls, and the first real taste of thin air.',
          accommodation: 'Teahouse',
        },
        {
          day: 7,
          title: 'Acclimatisation day in Dingboche',
          altitude: 4410,
          description:
            'Climb to Nangkartshang (5,083 m) for the Makalu view, then back down. Sleep low, climb high.',
          accommodation: 'Teahouse',
        },
        {
          day: 8,
          title: 'Dingboche to Lobuche (4,940 m)',
          altitude: 4940,
          description:
            'Past the memorials to climbers lost on Everest, up the terminal moraine of the Khumbu glacier.',
          accommodation: 'Teahouse',
        },
        {
          day: 9,
          title: 'Lobuche to Gorak Shep, Base Camp (5,364 m)',
          altitude: 5364,
          description:
            'The longest day: Gorak Shep, then on to Everest Base Camp on the ice of the Khumbu glacier.',
          accommodation: 'Teahouse',
        },
        {
          day: 10,
          title: 'Kala Patthar sunrise, down to Pheriche',
          altitude: 5545,
          description:
            'Up at 4:30 am for the best view of your life: Everest, Nuptse, Lhotse and Pumori from 5,545 m. Then descend to Pheriche.',
          accommodation: 'Teahouse',
        },
        {
          day: 11,
          title: 'Pheriche to Namche',
          altitude: 3440,
          description:
            'Long descent through Tengboche and the forests below. Legs tired, spirits high.',
          accommodation: 'Teahouse',
        },
        {
          day: 12,
          title: 'Namche to Lukla',
          altitude: 2860,
          description: 'Final walk out, farewell dinner with the crew.',
          accommodation: 'Teahouse',
        },
        {
          day: 13,
          title: 'Fly to Kathmandu',
          altitude: 1400,
          description:
            'Morning flight (with buffer day if needed), afternoon at leisure, celebration dinner.',
          accommodation: 'Hotel in Kathmandu',
        },
        {
          day: 14,
          title: 'Departure',
          altitude: 1400,
          description: 'Transfer to the airport. Or stay on — most people do.',
          accommodation: '—',
        },
      ],
    },
    {
      destinationIndex: 1,
      title: 'Annapurna Base Camp Trek',
      keywords: [
        'annapurna base camp trek',
        'annapurna sanctuary trek',
        'abc trek itinerary',
        'annapurna base camp trek cost',
      ],
      summary:
        'Eleven days from Pokhara’s lakeside into the Sanctuary — a glacial amphitheatre ringed by 7,000-metre walls.',
      durationDays: 11,
      durationNights: 10,
      groupSizeMax: 10,
      maxAltitude: 4130,
      difficulty: 'moderate' as const,
      tripType: 'trekking' as const,
      bestSeasons: ['spring', 'autumn'],
      priceFrom: 1290,
      priceCurrency: 'USD' as const,
      featured: true,
      highlights: [
        'Sunrise inside the Annapurna Sanctuary with Machhapuchhre at 3 a.m. clarity',
        'Gurung villages of Ghandruk and Chomrong',
        'Natural hot springs at Jhinu Danda',
        'Poon Hill sunrise over Dhaulagiri and the whole Annapurna range',
      ].map((text) => ({ text })),
      included: [
        'Private transfers Pokhara ↔ trailhead',
        'Teahouse accommodation, twin share',
        'Licensed guide and porter service',
        'ACAP permit and TIMS card',
        'Three meals a day on trek',
      ].map((item) => ({ item })),
      notIncluded: [
        'Kathmandu–Pokhara transport',
        'Travel insurance and Nepal visa',
        'Personal gear, drinks and snacks',
        'Gratuities',
      ].map((item) => ({ item })),
      faqs: [
        {
          question: 'Is this trek suitable for first-timers?',
          answer:
            'Yes. The maximum sleeping altitude is 4,130 m and the daily gains are moderate. It is our most popular first Himalayan trek.',
        },
        {
          question: 'Can we add Poon Hill?',
          answer:
            'Almost everyone does — it adds two days and the best sunrise viewpoint in the region. Ask for the "ABC + Poon Hill" variant.',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrive in Pokhara',
          altitude: 822,
          description: 'Transfer from Kathmandu by flight or road. Gear check and briefing.',
          accommodation: 'Hotel in Pokhara',
        },
        {
          day: 2,
          title: 'Drive to Nayapul, trek to Tikhedhunga',
          altitude: 1540,
          description: 'Short drive, then a gentle walk up the Bhurungdi Khola.',
          accommodation: 'Teahouse',
        },
        {
          day: 3,
          title: 'Tikhedhunga to Ghorepani (2,860 m)',
          altitude: 2860,
          description: 'The Ulleri staircase: 3,000 steps, one memorable afternoon.',
          accommodation: 'Teahouse',
        },
        {
          day: 4,
          title: 'Poon Hill sunrise, trek to Tadapani',
          altitude: 2630,
          description:
            'Pre-dawn climb to Poon Hill (3,210 m) for the Dhaulagiri sunrise, then through rhododendron forest to Tadapani.',
          accommodation: 'Teahouse',
        },
        {
          day: 5,
          title: 'Tadapani to Chomrong (2,170 m)',
          altitude: 2170,
          description:
            'Gurung village with the best views of Annapurna South and Hiunchuli from the teahouse veranda.',
          accommodation: 'Teahouse',
        },
        {
          day: 6,
          title: 'Chomrong to Dovan (2,600 m)',
          altitude: 2600,
          description: 'Down to the Chomrong Khola and back up through bamboo forest.',
          accommodation: 'Teahouse',
        },
        {
          day: 7,
          title: 'Dovan to Deurali (3,230 m)',
          altitude: 3230,
          description: 'Into the gorge, under Hinko Cave, with the Sanctuary walls closing in.',
          accommodation: 'Teahouse',
        },
        {
          day: 8,
          title: 'Deurali to Annapurna Base Camp (4,130 m)',
          altitude: 4130,
          description:
            'The amphitheatre opens. Machhapuchhre’s fishtail, Annapurna I, Gangapurna — all at once.',
          accommodation: 'Teahouse',
        },
        {
          day: 9,
          title: 'Sunrise at Base Camp, descend to Bamboo',
          altitude: 2310,
          description: 'One last freezing sunrise, then a long descent.',
          accommodation: 'Teahouse',
        },
        {
          day: 10,
          title: 'Bamboo to Jhinu Danda',
          altitude: 1780,
          description: 'Hot springs in the afternoon. Well earned.',
          accommodation: 'Teahouse',
        },
        {
          day: 11,
          title: 'Drive to Pokhara',
          altitude: 822,
          description: 'Walk out to Nayapul, transfer to Pokhara, celebration dinner.',
          accommodation: 'Hotel in Pokhara',
        },
      ],
    },
    {
      destinationIndex: 2,
      title: 'Langtang Valley & Kyanjin Ri',
      keywords: [
        'langtang valley trek',
        'kyanjin ri trek',
        'langtang trek itinerary',
        'langtang trek from kathmandu',
      ],
      summary:
        'Nine days in Tamang country — the closest true wilderness to Kathmandu, with two 5,000-metre viewpoints.',
      durationDays: 9,
      durationNights: 8,
      groupSizeMax: 10,
      maxAltitude: 4984,
      difficulty: 'easy-moderate' as const,
      tripType: 'trekking' as const,
      bestSeasons: ['spring', 'autumn', 'winter'],
      priceFrom: 980,
      priceCurrency: 'USD' as const,
      featured: true,
      highlights: [
        'Kyanjin Gompa under the Langtang Lirung icefall',
        'Tsergo Ri (4,984 m) — a 360° panorama for one hard morning',
        'Tamang villages rebuilt since 2015',
        'Red panda territory in Langtang National Park',
      ].map((text) => ({ text })),
      included: [
        'Private jeep Kathmandu ↔ Syabrubesi',
        'Teahouse accommodation, twin share',
        'Licensed guide and porter',
        'Langtang National Park permit and TIMS',
        'All meals on trek',
      ].map((item) => ({ item })),
      notIncluded: [
        'Kathmandu hotels before and after the trek',
        'Travel insurance and Nepal visa',
        'Personal gear and drinks',
        'Gratuities',
      ].map((item) => ({ item })),
      faqs: [
        {
          question: 'Is the valley safe after the 2015 earthquake?',
          answer:
            'Yes. The trail was rebuilt and rerouted above the 2015 avalanche deposit, and lodges are new throughout. Your presence is the most useful form of support the valley can get.',
        },
        {
          question: 'Can we trek this in winter?',
          answer:
            'It is one of the best winter treks in Nepal. Expect cold nights (−10 °C at Kyanjin) and empty trails.',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Drive Kathmandu to Syabrubesi (1,550 m)',
          altitude: 1550,
          description: 'Seven hours through the Trishuli valley. Last cold beer for a while.',
          accommodation: 'Teahouse',
        },
        {
          day: 2,
          title: 'Syabrubesi to Lama Hotel (2,380 m)',
          altitude: 2380,
          description: 'Riverside walking through bamboo and oak forest.',
          accommodation: 'Teahouse',
        },
        {
          day: 3,
          title: 'Lama Hotel to Langtang village (3,430 m)',
          altitude: 3430,
          description:
            'The valley opens. This is the village that was buried in 2015, rebuilt by the families who stayed.',
          accommodation: 'Teahouse',
        },
        {
          day: 4,
          title: 'Langtang to Kyanjin Gompa (3,870 m)',
          altitude: 3870,
          description:
            'Yak pastures, mani walls, and the monastery directly under Langtang Lirung.',
          accommodation: 'Teahouse',
        },
        {
          day: 5,
          title: 'Kyanjin Ri and Tsergo Ri',
          altitude: 4984,
          description:
            'Kyanjin Ri (4,773 m) at sunrise, Tsergo Ri (4,984 m) if the group is strong. Both are optional and both are worth it.',
          accommodation: 'Teahouse',
        },
        {
          day: 6,
          title: 'Kyanjin to Lama Hotel',
          altitude: 2380,
          description: 'Retrace the valley downhill.',
          accommodation: 'Teahouse',
        },
        {
          day: 7,
          title: 'Lama Hotel to Syabrubesi',
          altitude: 1550,
          description: 'Final forest walk out.',
          accommodation: 'Teahouse',
        },
        {
          day: 8,
          title: 'Drive to Kathmandu',
          altitude: 1400,
          description: 'Long road day, hot shower, celebration dinner.',
          accommodation: 'Hotel in Kathmandu',
        },
        {
          day: 9,
          title: 'Departure',
          altitude: 1400,
          description: 'Airport transfer.',
          accommodation: '—',
        },
      ],
    },
    {
      destinationIndex: 0,
      title: 'Everest Three High Passes',
      keywords: [
        'everest three passes trek',
        'three high passes trek',
        'everest three passes itinerary',
        'khumbu three passes trek',
      ],
      summary:
        'Eighteen days, three 5,300-metre passes and every major viewpoint in the Khumbu. For trekkers who want the whole thing.',
      durationDays: 18,
      durationNights: 17,
      groupSizeMax: 8,
      maxAltitude: 5550,
      difficulty: 'strenuous' as const,
      tripType: 'trekking' as const,
      bestSeasons: ['spring', 'autumn'],
      priceFrom: 2450,
      priceCurrency: 'USD' as const,
      highlights: [
        'Kongma La (5,535 m), Cho La (5,420 m) and Renjo La (5,360 m)',
        'Gokyo Lakes and Gokyo Ri (5,357 m)',
        'Everest Base Camp and Kala Patthar',
        'Small groups — maximum eight trekkers',
      ].map((text) => ({ text })),
      included: [
        'Kathmandu ↔ Lukla flights',
        'All teahouse accommodation',
        'Guide, assistant guide and porters',
        'All permits and national park fees',
        'Contingency day in Kathmandu',
      ].map((item) => ({ item })),
      notIncluded: [
        'International flights, visa and insurance',
        'Personal trekking gear',
        'Lodge extras (showers, charging, Wi-Fi)',
        'Gratuities',
      ].map((item) => ({ item })),
      faqs: [
        {
          question: 'Who is this trip for?',
          answer:
            'Trekkers with previous high-altitude experience and a solid training base. Two consecutive 5,000 m+ pass days are the crux.',
        },
        {
          question: 'What if a pass is snowed out?',
          answer:
            'Your guide carries the decision. There is always a lower alternative route, and we build two buffer days into the 18.',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrive in Kathmandu',
          altitude: 1400,
          description: 'Briefing and gear check.',
          accommodation: 'Hotel',
        },
        {
          day: 2,
          title: 'Fly to Lukla, trek to Phakding',
          altitude: 2610,
          description: 'The approach begins.',
          accommodation: 'Teahouse',
        },
        {
          day: 3,
          title: 'Phakding to Namche Bazaar',
          altitude: 3440,
          description: 'Hillary Bridge and the Namche hill.',
          accommodation: 'Teahouse',
        },
        {
          day: 4,
          title: 'Acclimatisation in Namche',
          altitude: 3440,
          description: 'Everest View Hotel and the Sherpa museum.',
          accommodation: 'Teahouse',
        },
        {
          day: 5,
          title: 'Namche to Tengboche',
          altitude: 3860,
          description: 'Monastery afternoon.',
          accommodation: 'Teahouse',
        },
        {
          day: 6,
          title: 'Tengboche to Dingboche',
          altitude: 4410,
          description: 'Above the treeline.',
          accommodation: 'Teahouse',
        },
        {
          day: 7,
          title: 'Acclimatisation in Dingboche',
          altitude: 4410,
          description: 'Nangkartshang peak.',
          accommodation: 'Teahouse',
        },
        {
          day: 8,
          title: 'Dingboche to Lobuche',
          altitude: 4940,
          description: 'Climbers’ memorials above Thukla.',
          accommodation: 'Teahouse',
        },
        {
          day: 9,
          title: 'Lobuche to Everest Base Camp',
          altitude: 5364,
          description: 'Gorak Shep, then the icefall.',
          accommodation: 'Teahouse',
        },
        {
          day: 10,
          title: 'Kala Patthar and Kongma La',
          altitude: 5535,
          description: 'Sunrise at 5,545 m, then the first pass to Chhukung.',
          accommodation: 'Teahouse',
        },
        {
          day: 11,
          title: 'Chhukung rest day',
          altitude: 4730,
          description: 'Optional Island Peak base camp walk.',
          accommodation: 'Teahouse',
        },
        {
          day: 12,
          title: 'Cho La crossing to Dzongla',
          altitude: 5420,
          description: 'The technical pass — crampons and early start.',
          accommodation: 'Teahouse',
        },
        {
          day: 13,
          title: 'Dzongla to Gokyo',
          altitude: 4790,
          description: 'Ngozumpa glacier and the turquoise lakes.',
          accommodation: 'Teahouse',
        },
        {
          day: 14,
          title: 'Gokyo Ri sunrise',
          altitude: 5357,
          description: 'Four 8,000-metre peaks before breakfast.',
          accommodation: 'Teahouse',
        },
        {
          day: 15,
          title: 'Renjo La to Thame',
          altitude: 5360,
          description: 'The third pass, then down into the Bhote Koshi valley.',
          accommodation: 'Teahouse',
        },
        {
          day: 16,
          title: 'Thame to Namche',
          altitude: 3440,
          description: 'Monastery visit and a last bakery stop.',
          accommodation: 'Teahouse',
        },
        {
          day: 17,
          title: 'Namche to Lukla',
          altitude: 2860,
          description: 'Final descent and farewell dinner.',
          accommodation: 'Teahouse',
        },
        {
          day: 18,
          title: 'Fly to Kathmandu',
          altitude: 1400,
          description: 'Buffer day available if weather delays the flight.',
          accommodation: 'Hotel',
        },
      ],
    },
    {
      destinationIndex: 3,
      title: 'Upper Mustang & Lo Manthang',
      keywords: [
        'upper mustang trek',
        'lo manthang trek',
        'upper mustang trek permit',
        'mustang trek itinerary',
      ],
      summary:
        'Thirteen days inside a restricted Tibetan kingdom — cave monasteries, ochre canyons and a walled city closed to outsiders until 1992.',
      durationDays: 13,
      durationNights: 12,
      groupSizeMax: 10,
      maxAltitude: 4210,
      difficulty: 'moderate-challenging' as const,
      tripType: 'cultural' as const,
      bestSeasons: ['spring', 'summer', 'autumn'],
      priceFrom: 2850,
      priceCurrency: 'USD' as const,
      highlights: [
        'Lo Manthang — a walled city of 700-year-old monasteries',
        'Sky caves at Chhoser, some with 2,000-year-old murals',
        'Kali Gandaki gorge, the deepest on earth',
        'Trekking in the monsoon months, in the rain shadow',
      ].map((text) => ({ text })),
      included: [
        'Restricted-area permit (US$ 500 for 10 days)',
        'Pokhara ↔ Jomsom flights',
        'Lodge accommodation throughout',
        'Guide, cook and support crew',
        'ACAP permit and all local fees',
      ].map((item) => ({ item })),
      notIncluded: [
        'Kathmandu–Pokhara transport',
        'Travel insurance and Nepal visa',
        'Personal gear and drinks',
        'Gratuities',
      ].map((item) => ({ item })),
      faqs: [
        {
          question: 'Why is it so expensive?',
          answer:
            'The restricted-area permit alone costs US$ 500 for ten days and must be arranged through a registered agency with a minimum of two trekkers.',
        },
        {
          question: 'Can we do it by jeep?',
          answer:
            'Yes — a 7-day vehicle-based version covers the same highlights with far less walking. Ask for the "Mustang by road" itinerary.',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrive in Pokhara',
          altitude: 822,
          description: 'Permit formalities and briefing.',
          accommodation: 'Hotel',
        },
        {
          day: 2,
          title: 'Fly to Jomsom, trek to Kagbeni',
          altitude: 2810,
          description:
            'Morning flight over the gorge, then an easy walk to the gateway of Mustang.',
          accommodation: 'Lodge',
        },
        {
          day: 3,
          title: 'Kagbeni to Chele',
          altitude: 3050,
          description: 'Permit check, then into the red cliffs.',
          accommodation: 'Lodge',
        },
        {
          day: 4,
          title: 'Chele to Ghiling',
          altitude: 3520,
          description: 'Two passes, one very long canyon.',
          accommodation: 'Lodge',
        },
        {
          day: 5,
          title: 'Ghiling to Charang',
          altitude: 3560,
          description: 'The royal palace and the red monastery of Charang.',
          accommodation: 'Lodge',
        },
        {
          day: 6,
          title: 'Charang to Lo Manthang',
          altitude: 3810,
          description: 'Cross the final pass into the walled city.',
          accommodation: 'Lodge',
        },
        {
          day: 7,
          title: 'Lo Manthang and the Chhoser caves',
          altitude: 3810,
          description: 'Sky caves, murals, and a monastery with 1,500 painted Buddhas.',
          accommodation: 'Lodge',
        },
        {
          day: 8,
          title: 'Lo Manthang rest day',
          altitude: 3810,
          description:
            'Festival visits if the calendar cooperates; otherwise horse riding in the valley.',
          accommodation: 'Lodge',
        },
        {
          day: 9,
          title: 'Lo Manthang to Drakmar',
          altitude: 3820,
          description: 'Retrace south through the painted red cliffs.',
          accommodation: 'Lodge',
        },
        {
          day: 10,
          title: 'Drakmar to Ghiling',
          altitude: 3520,
          description: 'Canyon walking.',
          accommodation: 'Lodge',
        },
        {
          day: 11,
          title: 'Ghiling to Kagbeni',
          altitude: 2810,
          description: 'Long final day down the Kali Gandaki.',
          accommodation: 'Lodge',
        },
        {
          day: 12,
          title: 'Kagbeni to Jomsom, fly to Pokhara',
          altitude: 2720,
          description: 'Morning walk, afternoon flight, celebration dinner.',
          accommodation: 'Hotel in Pokhara',
        },
        {
          day: 13,
          title: 'Departure',
          altitude: 822,
          description: 'Transfer to Kathmandu or the airport.',
          accommodation: '—',
        },
      ],
    },
    {
      destinationIndex: 1,
      title: 'Mardi Himal & Khopra Ridge',
      keywords: [
        'mardi himal trek',
        'khopra ridge trek',
        'mardi himal trek itinerary',
        'off the beaten path treks nepal',
      ],
      summary:
        'Eight quiet days on the ridges opposite Machhapuchhre — the best-value-view trek in the Annapurna range.',
      durationDays: 8,
      durationNights: 7,
      groupSizeMax: 8,
      maxAltitude: 4500,
      difficulty: 'easy' as const,
      tripType: 'trekking' as const,
      bestSeasons: ['spring', 'autumn', 'winter'],
      priceFrom: 890,
      priceCurrency: 'USD' as const,
      highlights: [
        'Mardi Himal base camp (4,500 m) with no crowds',
        'Community-run lodges on Khopra Ridge',
        'Machhapuchhre (6,993 m) close enough to touch',
        'Optional dip at Khayer Lake (4,500 m)',
      ].map((text) => ({ text })),
      included: [
        'Private transfers from Pokhara',
        'Community lodge accommodation',
        'Licensed guide',
        'ACAP permit and TIMS',
        'All meals on trek',
      ].map((item) => ({ item })),
      notIncluded: [
        'Travel insurance and Nepal visa',
        'Personal gear and drinks',
        'Gratuities',
      ].map((item) => ({ item })),
      faqs: [
        {
          question: 'Is this a good first trek?',
          answer:
            'The best one we sell. Short days, low altitude, community lodges and — unlike the ABC trail — almost nobody else on it.',
        },
      ],
      itinerary: [
        {
          day: 1,
          title: 'Arrive in Pokhara',
          altitude: 822,
          description: 'Briefing in Lakeside.',
          accommodation: 'Hotel',
        },
        {
          day: 2,
          title: 'Drive to Kande, trek to Deurali',
          altitude: 2100,
          description: 'Short drive, ridge walking from the start.',
          accommodation: 'Lodge',
        },
        {
          day: 3,
          title: 'Deurali to Forest Camp',
          altitude: 2600,
          description: 'Rhododendron and oak forest.',
          accommodation: 'Lodge',
        },
        {
          day: 4,
          title: 'Forest Camp to Low Camp',
          altitude: 3050,
          description: 'Above the treeline, first big views.',
          accommodation: 'Lodge',
        },
        {
          day: 5,
          title: 'Low Camp to High Camp',
          altitude: 3580,
          description: 'The fishtail fills the sky.',
          accommodation: 'Lodge',
        },
        {
          day: 6,
          title: 'Mardi Himal base camp and back',
          altitude: 4500,
          description: 'Sunrise push to 4,500 m, then descend to Low Camp.',
          accommodation: 'Lodge',
        },
        {
          day: 7,
          title: 'Low Camp to Siding',
          altitude: 1750,
          description: 'Down through Gurung villages.',
          accommodation: 'Lodge',
        },
        {
          day: 8,
          title: 'Drive to Pokhara',
          altitude: 822,
          description: 'Short walk out, transfer, celebration dinner.',
          accommodation: 'Hotel',
        },
      ],
    },
  ] satisfies ({ destinationIndex: number; bestSeasons: Season[] } & Record<string, unknown>)[]

  for (const [index, trip] of tripData.entries()) {
    await payload.create({
      collection: 'trips',

      data: {
        ...trip,
        slug: trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        destination: destinationIds[trip.destinationIndex]!,
        heroImage: imageAt(index + 2),
        description: richText(
          paragraph(trip.summary),
          heading('What this trip feels like'),
          paragraph(
            'Days start early and end with the light. You walk with a small group, a guide who has done this route dozens of times, and porters who are properly insured and equipped. Accommodation is in family-run lodges; food is cooked fresh, and the tea is endless.',
          ),
          heading('Is it right for you?'),
          bulletList(trip.highlights.map((highlight) => highlight.text)),
          heading('Our commitment'),
          paragraph(
            'Every trip is operated by our own team in Kathmandu and Pokhara — we do not resell to third-party operators. Porters carry a maximum of 25 kg, are insured, and are paid above the minimum recommended by the Trekking Agencies Association of Nepal.',
          ),
        ),
        gallery: [
          { image: imageAt(index + 3) },
          { image: imageAt(index + 4) },
          { image: imageAt(index + 5) },
        ],
        departureDates: [
          {
            startDate: `2026-11-${String(8 + index * 2).padStart(2, '0')}T12:00:00.000Z`,
            status: 'guaranteed',
            note: 'Guaranteed departure',
          },
          {
            startDate: `2026-11-${String(18 + index).padStart(2, '0')}T12:00:00.000Z`,
            status: 'limited',
            note: '3 spots left',
          },
          {
            startDate: `2027-03-${String(14 + index * 2).padStart(2, '0')}T12:00:00.000Z`,
            status: 'available',
          },
          {
            startDate: `2027-04-${String(10 + index * 2).padStart(2, '0')}T12:00:00.000Z`,
            status: 'guaranteed',
            note: 'Spring rhododendron bloom',
          },
        ],
        meta: {
          title: `${trip.title} — ${trip.durationDays} days from $${trip.priceFrom}`,
          description: trip.summary,
        },
        _status: 'published',
      } satisfies RequiredDataFromCollectionSlug<'trips'>,
    })
  }

  console.log(`  ✓ Created ${tripData.length} trips`)

  /* ---------- blog ---------- */
  const postData = [
    {
      title: 'How to train for a 5,500 m trek (without a gym membership)',
      keywords: [
        'trekking training plan',
        'how to train for everest base camp',
        'altitude training without a gym',
        'trek fitness plan',
      ],
      excerpt:
        'Eight weeks, two sessions a day, no equipment. The plan we send every Everest Base Camp client — published here because it works for everyone.',
      categories: ['health-safety', 'trekking-guides'],
      featured: true,
      content: richText(
        paragraph(
          'The most common question we get is also the most reasonable one: am I fit enough? The reassuring answer is that trekking fitness is specific, and it is much easier to build than general gym fitness.',
        ),
        heading('The rule'),
        paragraph(
          'You need to be able to walk uphill for six hours with a 5 kg pack. That is the whole test. Everything else — stairs, squats, weekend hills — is a proxy for it.',
        ),
        heading('The eight-week plan'),
        bulletList([
          'Weeks 1–2: three 60-minute hill or stair sessions, plus one long easy walk (90 min).',
          'Weeks 3–5: add a second weekly long walk, build to 3 hours with 400 m of ascent.',
          'Weeks 6–7: back-to-back long days on consecutive weekends — this is the specific adaptation that matters.',
          'Week 8: taper. Halve the volume, keep the intensity, sleep more than you think you need to.',
        ]),
        heading('What actually predicts success'),
        paragraph(
          'In our logs, the strongest predictor is not VO₂ max or age. It is whether someone has done two consecutive long walking days in training. Do that once and the third day on the trail stops feeling like a cliff edge.',
        ),
        heading('What to bring on the fitness side'),
        paragraph(
          'Broken-in boots, a pack you have actually worn loaded, and trekking poles you have used. Never arrive with any of the three brand new.',
        ),
      ),
    },
    {
      title: 'The honest packing list for the Khumbu in autumn',
      keywords: [
        'everest base camp packing list',
        'khumbu packing list',
        'what to pack for trekking in nepal',
        'autumn trekking gear',
      ],
      excerpt:
        'Eleven kilograms, four layers, no cotton. What our guides actually carry after fifteen seasons on the same trail.',
      categories: ['gear', 'trekking-guides'],
      featured: false,
      content: richText(
        paragraph(
          'Autumn in the Khumbu means 20 °C at lunch in Namche and −15 °C before dawn at Gorak Shep. The packing problem is not staying warm, it is staying warm without carrying a wardrobe.',
        ),
        heading('Layers, not bulk'),
        bulletList([
          'Base: two merino T-shirts (150 g), one long-sleeve for evenings.',
          'Mid: one light fleece, one down jacket (700 fill is plenty).',
          'Shell: a genuine waterproof hardshell — not a fashion rain jacket.',
          'Legs: softshell trousers, one pair of merino long johns for sleeping.',
        ]),
        heading('The things people forget'),
        bulletList([
          'A second pair of gloves. Always.',
          'A 10,000 mAh power bank — lodge charging costs money and gets slower with altitude.',
          'Earplugs. Teahouse walls are thin.',
          'Diamox, discussed with your doctor before departure.',
        ]),
        heading('What not to bring'),
        paragraph(
          'Cotton anything, a sleeping bag rated below −10 °C, crampons (unless you are doing the passes in shoulder season), and more than one book. You will not read it.',
        ),
      ),
      // Rendered by the same FAQ section as trip pages, under the matching category heading.
      packingListFaqs: [
        {
          question: 'How heavy should my bag be?',
          answer:
            'Aim for about 11 kg in the duffel a porter carries (the domestic flight to Lukla allows 15 kg including your daypack) and 5–6 kg in your daypack: water, layers, snacks and anything you need before the porter arrives at the lodge.',
        },
        {
          question: 'Can I rent or buy gear in Kathmandu?',
          answer:
            'Yes. Thamel has down jackets and sleeping bags to rent for a few dollars a day, and plenty of shops selling the rest. Bring your own boots, already broken in — that is the one thing that should never be new on day one.',
        },
      ],
    },
    {
      title: 'Altitude sickness: what the guide is watching for',
      keywords: [
        'altitude sickness symptoms',
        'acute mountain sickness prevention',
        'ams while trekking',
        'how to avoid altitude sickness',
      ],
      excerpt:
        'Every evening on trek, someone takes your pulse and blood oxygen. Here is what we are looking for — and why the answer is sometimes to go down.',
      categories: ['health-safety'],
      featured: false,
      content: richText(
        paragraph(
          'Acute mountain sickness is not a moral failure and it is not random. It is a predictable response to ascending faster than your body can adapt, and it is almost always manageable if it is caught early.',
        ),
        heading('The evening check'),
        paragraph(
          'From 3,000 m upwards your guide records resting heart rate and SpO₂ every evening, and asks the Lake Louise questions: headache? nausea? dizziness? poor sleep? loss of appetite? Two or more symptoms with a recent gain in altitude is a diagnosis.',
        ),
        heading('The rule that saves lives'),
        paragraph(
          'If symptoms persist or worsen at the same altitude, descend. Not "wait and see", not "sleep on it". Descending 500 m makes most people feel dramatically better within an hour, and nobody has ever regretted going down.',
        ),
        heading('Medication'),
        paragraph(
          'Acetazolamide (Diamox) helps with acclimatisation and sleep at altitude; it does not replace a sensible ascent profile. Dexamethasone is for treatment, not prevention, and is carried by our guides for emergencies only. Talk to a doctor before you travel.',
        ),
      ),
      faqs: [
        {
          question: 'Does being fit protect me from altitude sickness?',
          answer:
            'No. Fitness makes the walking easier, but it has no measurable effect on how you acclimatise. Fit trekkers are often the ones who climb too fast because they feel strong.',
        },
      ],
      altitudeSicknessFaqs: [
        {
          question: 'At what altitude does altitude sickness start?',
          answer:
            'Mild symptoms can appear from about 2,500 m, and most cases on the Everest and Annapurna trails start between 3,500 m and 4,500 m, usually within a day of arriving at a new sleeping altitude.',
        },
        {
          question: 'What happens if I have to descend?',
          answer:
            'A guide or assistant guide goes down with you while the group continues. Most people recover within a day or two at a lower lodge and many rejoin the trek. If it is serious, we arrange a helicopter evacuation — which is why travel insurance covering rescue up to 6,000 m is required.',
        },
      ],
    },
    {
      title: 'Langtang, eight years on: a valley that rebuilt itself',
      keywords: [
        'langtang valley recovery',
        'langtang trek after the earthquake',
        'langtang village tourism',
        'responsible trekking langtang',
      ],
      excerpt:
        'In 2015 the avalanche buried the village. What happened next is the most encouraging story in Nepali tourism.',
      categories: ['culture', 'trip-reports'],
      featured: false,
      content: richText(
        paragraph(
          'The 2015 earthquake and the avalanche that followed it destroyed Langtang village almost completely. Three hundred and fifty people were lost. What remained was a slope of debris and a decision: rebuild, or leave.',
        ),
        heading('What the valley looks like now'),
        paragraph(
          'New lodges, built to a different standard, stand where the old ones were. The trail was rerouted above the avalanche deposit. Families who lost everything run teahouses again, and the monastery at Kyanjin Gompa has more young monks than it did before.',
        ),
        heading('Why walking here matters'),
        paragraph(
          'Tourism numbers in Langtang took years to return. Every group that walks in puts money directly into households that chose to stay, which is the single most effective way to make staying viable for the next generation.',
        ),
      ),
    },
    {
      title: 'What a porter’s job actually involves',
      keywords: [
        'trekking porter nepal',
        'porter weight limits trekking',
        'ethical trekking nepal',
        'porter wages nepal',
      ],
      excerpt:
        'Twenty-five kilos, twelve days, one pair of sandals. The people who make trekking possible deserve more than a footnote.',
      categories: ['culture', 'sustainability'],
      featured: false,
      content: richText(
        paragraph(
          'A porter on the Everest Base Camp trail carries up to 25 kg, twelve days out of fourteen, often in sandals, for a wage that has been debated for thirty years. They are also, in our experience, the most skilled people on the mountain.',
        ),
        heading('What we do differently'),
        bulletList([
          'Maximum 25 kg per porter, weighed at the trailhead.',
          'Insurance covering medical evacuation and repatriation for everyone in the crew.',
          'Wages above the TAAN recommended minimum, paid on completion, not on arrival.',
          'Proper clothing and boots provided at the start of the season.',
        ]),
        heading('Why it matters for you'),
        paragraph(
          'A well-treated crew is a safer, calmer, more professional team. Porters who are properly equipped do not get evacuated, and the tone of the whole trip is set by how the people carrying your bag are treated.',
        ),
      ),
    },
  ] satisfies ({ categories: PostCategory[] } & Record<string, unknown>)[]

  for (const [index, post] of postData.entries()) {
    await payload.create({
      collection: 'blog',

      data: {
        ...post,
        slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        featuredImage: imageAt(index + 6),
        author: authorId,
        publishedAt: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        meta: {
          title: post.title,
          description: post.excerpt,
        },
        _status: 'published',
      } satisfies RequiredDataFromCollectionSlug<'blog'>,
    })
  }

  console.log(`  ✓ Created ${postData.length} journal posts`)

  /* ---------- pages ---------- */
  const homeBlocks = (): Page['blocks'] => {
    const copy = {
      eyebrow: 'Nepal · Himalaya',
      // The `<i>` is the hero's accent line: Instrument Serif italic under the
      // Cal Sans first line on the homepage (see `.hero-title--cal`).
      heading: 'Discover Global <i>Adventures with Hike Globally</i>',
      subheading:
        'Explore family tours, trekking adventures, and practical travel guides to inspire your next journey across Nepal and destinations worldwide.',
      primary: 'Browse all trips',
      secondary: 'Plan your trip',
      stats: 'Why people keep coming back',
      trips: 'Curated Travel Packages',
      tripsSub:
        'Explore our curated travel packages designed to suit every budget, travel style, and adventure. From luxury holidays and family vacations to romantic getaways and adventure tours, discover the best travel deals for unforgettable experiences at top destinations.',
      destinations: 'Four regions, one mountain country',
      destinationsSub:
        'Start with the classic valleys, or go looking for the quiet ones behind the rain shadow.',
      gallery: 'From the trail',
      gallerySub: 'Shot by guides and guests over the last two seasons.',
      faq: 'Questions we get every week',
      faqSub: 'If yours is not here, ask — a real person answers within 24 hours.',
      inquiry: 'Tell us what you are dreaming of',
      inquirySub:
        'A real person — usually the guide who would lead you — replies within 24 hours with a first draft itinerary.',
      note: 'No payment is taken at this stage. We only ask for a deposit once the itinerary is agreed.',
      viewTrips: 'View all trips',
      viewDestinations: 'All destinations',
      statsItems: [
        {
          value: '14',
          label: 'Years on the trail',
          description: 'Operated by our own team, never resold.',
        },
        {
          value: '1:6',
          label: 'Guide to guest ratio',
          description: 'Plus insured porters, max 25 kg each.',
        },
        { value: '98%', label: 'Summit success', description: 'On our scheduled peak climbs.' },
      ],
      faqs: [
        {
          question: 'Do I need previous trekking experience?',
          answer:
            'Not for most trips. Mardi Himal, Langtang and Annapurna Base Camp all work well as first Himalayan treks. The Three Passes and our peak climbs do require previous high-altitude experience.',
        },
        {
          question: 'How big are the groups?',
          answer:
            'Maximum 12 on the classic treks, 8 on the harder routes. Private departures are available for any date with two or more people.',
        },
        {
          question: 'What is included in the price?',
          answer:
            'All accommodation on trek, all meals from the lodge menu, permits, transport as described, a licensed guide and insured porters. International flights, insurance, visas and personal gear are not included.',
        },
        {
          question: 'Can you arrange a private or custom trip?',
          answer:
            'Most of what we run is custom. Send us dates, a rough idea of fitness and what you want to see, and we will send back a draft itinerary within 24 hours.',
        },
        {
          question: 'What happens if the weather closes the airport?',
          answer:
            'Buffer days are built into every itinerary that depends on Lukla or Jomsom flights. If a flight is cancelled, we reroute or rebook at our own cost.',
        },
      ],
    }

    return [
      {
        blockType: 'hero',
        eyebrow: copy.eyebrow,
        heading: copy.heading,
        subheading: copy.subheading,
        backgroundImage: imageAt(0),
        overlay: 'strong',
        primaryLink: { label: copy.primary, type: 'custom', url: '/trips' },
        secondaryLink: { label: copy.secondary, type: 'custom', url: '/contact' },
      },
      {
        blockType: 'stats',
        heading: copy.stats,
        variant: 'light',
        items: copy.statsItems,
      },
      {
        blockType: 'featuredTrips',
        heading: copy.trips,
        subheading: copy.tripsSub,
        source: 'featured',
        limit: 6,
        columns: '3',
        viewAllLink: { label: copy.viewTrips, type: 'custom', url: '/trips' },
      },
      {
        blockType: 'featuredDestinations',
        heading: copy.destinations,
        subheading: copy.destinationsSub,
        source: 'featured',
        limit: 6,
        layout: 'editorial',
        viewAllLink: { label: copy.viewDestinations, type: 'custom', url: '/destinations' },
      },
      {
        blockType: 'gallery',
        heading: copy.gallery,
        subheading: copy.gallerySub,
        columns: '4',
        aspectRatio: '1/1',
        images: [
          { image: imageAt(4) },
          { image: imageAt(5) },
          { image: imageAt(6) },
          { image: imageAt(7) },
          { image: imageAt(8) },
          { image: imageAt(9) },
          { image: imageAt(10) },
          { image: imageAt(11) },
        ],
      },
      {
        blockType: 'faq',
        heading: copy.faq,
        subheading: copy.faqSub,
        items: copy.faqs,
      },
      {
        // The homepage ends here: the inquiry ("Plan your trip") section is the last block.
        blockType: 'inquiry',
        heading: copy.inquiry,
        subheading: copy.inquirySub,
        note: copy.note,
        variant: 'dark',
      },
    ]
  }

  const aboutBlocks = (): Page['blocks'] => {
    const copy = {
      eyebrow: 'About',
      heading: 'We are the people on the trail, not a booking desk.',
      subheading:
        'Hike Globally is a Kathmandu- and Pokhara-based operator. Every trip we sell is run by our own guides, cooks and porters — we do not resell to third-party agencies.',
      body: 'How we work',
      cta: 'Next step',
      ctaHeading: 'Start with a conversation, not a booking form.',
      ctaText:
        'Tell us roughly what you have in mind. We will send back a draft itinerary and an honest opinion.',
      ctaLink: 'Plan your trip',
      stats: [
        { value: '30', label: 'People on the team' },
        { value: '600+', label: 'Trips operated' },
        { value: '2012', label: 'First season' },
      ],
    }

    return [
      {
        blockType: 'hero',
        eyebrow: copy.eyebrow,
        heading: copy.heading,
        subheading: copy.subheading,
      },
      {
        blockType: 'richText',
        heading: copy.body,
        width: 'narrow',
        content: richText(
          paragraph(
            'We started in 2012 with one guide, one cook and a rented jeep. Fourteen years later the team is thirty people, most of them from the villages our treks pass through.',
          ),
          heading('What that means in practice'),
          bulletList([
            'Your guide is on our payroll, not a freelancer hired the night before.',
            'Porters carry a maximum of 25 kg, weighed at the trailhead, and are fully insured.',
            'Trip prices include a contingency day for weather — it is not sold to you as an extra.',
            'We publish our cancellation terms in plain language, on one page.',
          ]),
          heading('If something goes wrong'),
          paragraph(
            'It sometimes does: a flight is cancelled, a pass is snowed out, somebody gets sick. What matters is who absorbs the cost and how fast the decision gets made. In our case, it is us, within the hour.',
          ),
        ),
      },
      { blockType: 'stats', variant: 'dark', items: copy.stats },
      {
        blockType: 'cta',
        eyebrow: copy.cta,
        heading: copy.ctaHeading,
        text: copy.ctaText,
        link: { label: copy.ctaLink, type: 'custom', url: '/contact' },
        variant: 'sage',
      },
    ]
  }

  const existingHome = await payload.find({
    collection: 'pages',

    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  if (existingHome.docs.length === 0) {
    await payload.create({
      collection: 'pages',

      data: {
        title: 'Home',
        slug: 'home',
        blocks: homeBlocks(),
        meta: {
          title: 'Hike Globally | Family Tours, Trekking & Travel Guides',
          description:
            'Discover family tours, treks and global destinations with Hike Globally. Explore travel guides, expert tips and inspiring ideas for your next adventure.',
        },
        _status: 'published',
      },
    })

    console.log('  ✓ Created the homepage')
  } else {
    console.log('  • Homepage already exists')
  }

  const existingAbout = await payload.find({
    collection: 'pages',

    where: { slug: { equals: 'about' } },
    limit: 1,
  })

  if (existingAbout.docs.length === 0) {
    await payload.create({
      collection: 'pages',

      data: {
        title: 'About us',
        slug: 'about',
        blocks: aboutBlocks(),
        meta: {
          title: 'About Hike Globally',
          description: 'Who we are, who carries your bag, and why we do not resell our trips.',
        },
        _status: 'published',
      },
    })

    console.log('  ✓ Created the about page')
  } else {
    console.log('  • About page already exists')
  }

  /* ---------- globals ---------- */
  await payload.updateGlobal({
    slug: 'header',

    data: {
      announcement: 'Spring 2026 departures are open — early-bird pricing until 31 December.',
      navItems: [
        {
          link: { label: 'Trips', type: 'custom', url: '/trips' },
          children: [
            { link: { label: 'All trips', type: 'custom', url: '/trips' } },
            {
              link: {
                label: 'Everest region',
                type: 'custom',
                url: '/trips?region=khumbu-everest',
              },
            },
            { link: { label: 'Annapurna region', type: 'custom', url: '/trips?region=annapurna' } },
          ],
        },
        {
          link: { label: 'Destinations', type: 'custom', url: '/destinations' },
          children: [
            { link: { label: 'All destinations', type: 'custom', url: '/destinations' } },
            { link: { label: 'Langtang', type: 'custom', url: '/destinations/langtang' } },
            { link: { label: 'Mustang', type: 'custom', url: '/destinations/mustang' } },
          ],
        },
        { link: { label: 'Places', type: 'custom', url: '/places' } },
        { link: { label: 'Journal', type: 'custom', url: '/blog' } },
        { link: { label: 'About', type: 'custom', url: '/about' } },
      ],
      actions: [{ link: { label: 'Plan your trip', type: 'custom', url: '/contact' } }],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',

    data: {
      introduction:
        'Hike Globally offers curated travel packages and unforgettable adventures, helping you explore breathtaking destinations and create memories that last a lifetime.',
      columns: [
        {
          heading: 'Trips',
          links: [
            { link: { label: 'All trips', type: 'custom', url: '/trips' } },
            { link: { label: 'Places', type: 'custom', url: '/places' } },
            {
              link: {
                label: 'Everest region',
                type: 'custom',
                url: '/destinations/khumbu-everest',
              },
            },
            { link: { label: 'Annapurna region', type: 'custom', url: '/destinations/annapurna' } },
            { link: { label: 'Plan your trip', type: 'custom', url: '/contact' } },
          ],
        },
        {
          heading: 'Company',
          links: [
            { link: { label: 'About us', type: 'custom', url: '/about' } },
            { link: { label: 'Journal', type: 'custom', url: '/blog' } },
            { link: { label: 'Contact', type: 'custom', url: '/contact' } },
            { link: { label: 'Sitemap', type: 'custom', url: '/sitemap' } },
          ],
        },
        {
          heading: 'Regions',
          links: [
            { link: { label: 'Langtang', type: 'custom', url: '/destinations/langtang' } },
            { link: { label: 'Mustang', type: 'custom', url: '/destinations/mustang' } },
            { link: { label: 'All destinations', type: 'custom', url: '/destinations' } },
          ],
        },
      ],
      legalLinks: [
        { link: { label: 'Privacy', type: 'custom', url: '/privacy' } },
        { link: { label: 'Terms', type: 'custom', url: '/terms' } },
      ],
      copyright: '© {year} Hike Globally. All rights reserved.',
    },
  })

  await payload.updateGlobal({
    slug: 'settings',

    data: {
      siteName: 'Hike Globally',
      tagline: 'Treks & expeditions in the Himalaya',
      email: 'hello@hikeglobally.com',
      phone: '+977 1 452 8899',
      whatsapp: '9779851000000',
      address: 'Thamel, Kathmandu 44600, Nepal',
      legalName: 'Hike Globally Trekking Pvt. Ltd.',
      responseTimeNote: 'We reply to every enquiry within 24 hours.',
      formsubmitEmail: 'hello@hikeglobally.com',
      socials: [
        { platform: 'facebook', url: 'https://facebook.com/hikeglobally' },
        { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
        { platform: 'linkedin', url: 'https://linkedin.com/company/hikeglobally' },
      ],
      defaultOgImage: imageAt(0),
    },
  })

  console.log('  ✓ Configured header, footer and site settings')
  console.log('')
  console.log('✓ Seed complete.')
  console.log('  Admin: /admin   ·   admin@hikeglobally.com / hike-globally-2026')
  process.exit(0)
}

run().catch((error) => {
  const details = (error as { data?: { errors?: unknown } })?.data?.errors
  if (details) console.error(JSON.stringify(details, null, 2))
  else console.error(error)
  process.exit(1)
})
