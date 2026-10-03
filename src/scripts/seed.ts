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
 * Everything is created in all three languages. Short, high-impact fields are translated
 * (titles, summaries, highlights, FAQs); long-form rich text is written in English and served
 * to de/fr through Payload's localization fallback — which is exactly how a real team would
 * roll a site out language by language.
 *
 * Revalidation is disabled for the run: there is no Next.js request scope in a CLI process.
 */
process.env.DISABLE_REVALIDATION = 'true'

import sharp from 'sharp'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'

import config from '../payload.config'
import type { Locale } from '../i18n/config'
import type { Page } from '../payload-types'

type L<T> = Record<Locale, T>
const l = <T,>(en: T, de: T, fr: T): L<T> => ({ en, de, fr })

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

const text = (value: string, format = 0): LexicalNode => ({ type: 'text', version: 1, text: value, format })

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

/* -------------------------------------------------------------------------- */
/* Image generation                                                            */
/* -------------------------------------------------------------------------- */

const PALETTES: [string, string, string][] = [
  ['#0b2b38', '#124559', '#aec3b0'],
  ['#01161e', '#1d4f63', '#8fb0a3'],
  ['#123a4a', '#598392', '#cdd9cb'],
  ['#0a2530', '#2b6b7f', '#aec3b0'],
  ['#01161e', '#3c7286', '#d8e3d7'],
  ['#0e303e', '#124559', '#b9d0bd'],
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

  const ridge = (baseY: number, amplitude: number, roughness: number, fill: string, opacity: number) => {
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
    const author = users.docs.find((user) => user.email !== 'admin@hikeglobally.com') ?? users.docs[0]!
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
          alt: l(
            `${label} — Himalayan landscape photographed on a Hike Globally expedition`,
            `${label} — Himalaja-Landschaft, fotografiert auf einer Hike-Globally-Expedition`,
            `${label} — paysage himalayen photographié lors d'une expédition Hike Globally`,
          ).en,
          caption: label,
        },
        file: {
          name: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.jpg`,
          data: buffer,
          mimetype: 'image/jpeg',
          size: buffer.byteLength,
        },
      })

      mediaIds.push(media.id)

      // Localized alt text for the other two languages.
      for (const [locale, value] of Object.entries(
        l(
          '',
          `${label} — Himalaja-Landschaft, fotografiert auf einer Hike-Globally-Expedition`,
          `${label} — paysage himalayen photographié lors d'une expédition Hike Globally`,
        ),
      )) {
        if (locale === 'en' || !value) continue
        await payload.update({
          collection: 'media',
          id: media.id,
          locale: locale as Locale,
          data: { alt: value, caption: label },
        })
      }
    }

    console.log(`  ✓ Created ${mediaIds.length} images`)
  }

  const imageAt = (index: number) => mediaIds[index % mediaIds.length]!

  /* ---------- helper: write the non-English translations ---------- */
  const translate = async (
    collection: 'trips' | 'destinations' | 'blog' | 'pages',
    id: number,
    data: Partial<Record<Locale, Record<string, unknown>>>,
  ) => {
    for (const locale of ['de', 'fr'] as Locale[]) {
      const values = data[locale]
      if (!values) continue
      await payload.update({ collection, id, locale, data: values })
    }
  }

  /* ---------- destinations ---------- */
  const destinationData = [
    {
      en: {
        name: 'Khumbu & Everest',
        tagline: 'The valley that invented Himalayan trekking — icefalls, Sherpa monasteries and the world’s highest skyline.',
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
      de: {
        name: 'Khumbu & Everest',
        tagline: 'Das Tal, in dem das Himalaya-Trekking erfunden wurde — Eisbrüche, Sherpa-Klöster und die höchste Skyline der Welt.',
        country: 'Nepal',
        bestSeasons: ['spring', 'autumn', 'winter'],
      },
      fr: {
        name: 'Khumbu & Everest',
        tagline: 'La vallée qui a inventé le trekking himalayen — séracs, monastères sherpas et la plus haute ligne d’horizon du monde.',
        country: 'Nepal',
        bestSeasons: ['spring', 'autumn', 'winter'],
      },
    },
    {
      en: {
        name: 'Annapurna',
        tagline: 'Rice terraces to ice amphitheatre in one week — the most varied trekking in the Himalaya.',
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
      de: { name: 'Annapurna', tagline: 'Reisterrassen bis ins Eisamphitheater in einer Woche — das abwechslungsreichste Trekking des Himalaya.', country: 'Nepal' },
      fr: { name: 'Annapurna', tagline: 'Des rizières à l’amphithéâtre de glace en une semaine — le trekking le plus varié de l’Himalaya.', country: 'Nepal' },
    },
    {
      en: {
        name: 'Langtang',
        tagline: 'Kathmandu’s closest wilderness — Tamang villages, yak pastures and a valley that recovered from tragedy.',
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
      de: { name: 'Langtang', tagline: 'Kathmandus nächste Wildnis — Tamang-Dörfer, Yak-Weiden und ein Tal, das sich von einer Tragödie erholt hat.', country: 'Nepal' },
      fr: { name: 'Langtang', tagline: 'La nature sauvage la plus proche de Katmandou — villages tamangs, pâturages de yaks et une vallée qui s’est reconstruite.', country: 'Nepal' },
    },
    {
      en: {
        name: 'Mustang',
        tagline: 'A Tibetan kingdom behind the rain shadow — ochre cliffs, cave monasteries and 700-year-old walled cities.',
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
      de: { name: 'Mustang', tagline: 'Ein tibetisches Königreich hinter dem Regenschatten — Ockerklippen, Höhlenklöster und 700 Jahre alte Mauern.', country: 'Nepal' },
      fr: { name: 'Mustang', tagline: 'Un royaume tibétain à l’abri de la mousson — falaises ocres, monastères troglodytes et cités fortifiées vieilles de 700 ans.', country: 'Nepal' },
    },
  ] satisfies { en: { region: Region; bestSeasons: Season[] } & Record<string, unknown>; de: Record<string, unknown>; fr: Record<string, unknown> }[]

  const destinationIds: number[] = []

  for (const [index, destination] of destinationData.entries()) {
    const created = await payload.create({
      collection: 'destinations',
      locale: 'en',
      data: ({
        ...destination.en,
        slug: destination.en.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/&/g, ''),
        heroImage: imageAt(index),
        gallery: [
          { image: imageAt(index + 1) },
          { image: imageAt(index + 2) },
          { image: imageAt(index + 3) },
        ],
        meta: {
          title: `${destination.en.name} trekking — Hike Globally`,
          description: destination.en.tagline,
        },
        _status: 'published',
      } satisfies RequiredDataFromCollectionSlug<'destinations'>),
    })

    destinationIds.push(created.id)

    await translate('destinations', created.id, {
      de: {
        ...destination.de,
        slug: destination.de.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/&/g, ''),
      },
      fr: {
        ...destination.fr,
        slug: destination.fr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/&/g, ''),
      },
    })
  }

  console.log(`  ✓ Created ${destinationIds.length} destinations`)

  /* ---------- trips ---------- */
  const tripData = [
    {
      destinationIndex: 0,
      en: {
        title: 'Everest Base Camp Trek',
        summary: 'The classic 14-day walk to the foot of the world’s highest mountain, with Kala Patthar sunrise and three acclimatisation days built in.',
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
        faqs: [
          { question: 'How fit do I need to be?', answer: 'You should be able to walk 6–8 hours a day on uneven ground for several consecutive days with a light daypack. We send a training plan 8 weeks before departure.' },
          { question: 'What about altitude?', answer: 'The itinerary has two dedicated acclimatisation days (Namche and Dingboche) and gains no more than 400 m of sleeping altitude per day above 3,000 m. Guides carry pulse oximeters and a portable hyperbaric bag.' },
          { question: 'What if Lukla flights are cancelled?', answer: 'Weather closes Lukla roughly one day in six in peak season. We build a buffer day into the schedule and can rebook onto a helicopter or reroute via Jiri at our cost, not yours.' },
        ],
        itinerary: [
          { day: 1, title: 'Arrive in Kathmandu (1,400 m)', altitude: 1400, description: 'Airport transfer, gear check and briefing at the hotel. Welcome dinner in Thamel.', accommodation: 'Hotel in Kathmandu' },
          { day: 2, title: 'Fly to Lukla, trek to Phakding (2,610 m)', altitude: 2610, description: 'The 35-minute flight to Lukla is the best value sightseeing in aviation. Gentle three-hour walk down the Dudh Koshi to Phakding.', accommodation: 'Teahouse' },
          { day: 3, title: 'Phakding to Namche Bazaar (3,440 m)', altitude: 3440, description: 'Six suspension bridges, the Hillary Bridge, and the long climb up to Namche. First view of Everest from the top of the ridge.', accommodation: 'Teahouse' },
          { day: 4, title: 'Acclimatisation day in Namche', altitude: 3440, description: 'Walk to Khumjung or the Everest View Hotel and back down to sleep. This day is what makes the rest of the trek work.', accommodation: 'Teahouse' },
          { day: 5, title: 'Namche to Tengboche (3,860 m)', altitude: 3860, description: 'Rhododendron forest, the Dudh Koshi far below, and the monastery at Tengboche with Ama Dablam directly behind it.', accommodation: 'Teahouse' },
          { day: 6, title: 'Tengboche to Dingboche (4,410 m)', altitude: 4410, description: 'Above the tree line now. Yak pastures, stone walls, and the first real taste of thin air.', accommodation: 'Teahouse' },
          { day: 7, title: 'Acclimatisation day in Dingboche', altitude: 4410, description: 'Climb to Nangkartshang (5,083 m) for the Makalu view, then back down. Sleep low, climb high.', accommodation: 'Teahouse' },
          { day: 8, title: 'Dingboche to Lobuche (4,940 m)', altitude: 4940, description: 'Past the memorials to climbers lost on Everest, up the terminal moraine of the Khumbu glacier.', accommodation: 'Teahouse' },
          { day: 9, title: 'Lobuche to Gorak Shep, Base Camp (5,364 m)', altitude: 5364, description: 'The longest day: Gorak Shep, then on to Everest Base Camp on the ice of the Khumbu glacier.', accommodation: 'Teahouse' },
          { day: 10, title: 'Kala Patthar sunrise, down to Pheriche', altitude: 5545, description: 'Up at 4:30 am for the best view of your life: Everest, Nuptse, Lhotse and Pumori from 5,545 m. Then descend to Pheriche.', accommodation: 'Teahouse' },
          { day: 11, title: 'Pheriche to Namche', altitude: 3440, description: 'Long descent through Tengboche and the forests below. Legs tired, spirits high.', accommodation: 'Teahouse' },
          { day: 12, title: 'Namche to Lukla', altitude: 2860, description: 'Final walk out, farewell dinner with the crew.', accommodation: 'Teahouse' },
          { day: 13, title: 'Fly to Kathmandu', altitude: 1400, description: 'Morning flight (with buffer day if needed), afternoon at leisure, celebration dinner.', accommodation: 'Hotel in Kathmandu' },
          { day: 14, title: 'Departure', altitude: 1400, description: 'Transfer to the airport. Or stay on — most people do.', accommodation: '—' },
        ],
      },
      de: {
        title: 'Everest-Basislager-Trekking',
        summary: 'Der klassische 14-tägige Weg zum Fuß des höchsten Berges der Welt — mit Sonnenaufgang am Kala Patthar und drei eingebauten Akklimatisationstagen.',
        priceNote: 'Basierend auf einer Gruppe von 6 Personen. Privatreisen ab 2.480 $.',
        highlights: [
          'Sonnenaufgang über dem Everest vom Kala Patthar (5.545 m)',
          'Kloster Tengboche mit Ama Dablam hinter dem Gebetsrad',
          'Der Khumbu-Eisbruch vom Basislager aus zu Fuß erreichbar',
          'Markttag in Namche Bazaar und das Sherpa-Museum',
        ].map((text) => ({ text })),
        included: [
          'Flüge Kathmandu ↔ Lukla inkl. 15 kg Aufgabegepäck',
          'Alle Teahouse-Unterkünfte im Doppelzimmer',
          'Drei Mahlzeiten täglich aus der Lodge-Karte',
          'Lizenzierter englischsprachiger Guide, Assistent ab 8 Teilnehmern',
          'Träger (1 pro 2 Teilnehmer), versichert und ausgerüstet',
          'Sagarmatha-Nationalpark-Permit, TIMS und lokale Steuern',
        ].map((item) => ({ item })),
        notIncluded: [
          'Internationale Flüge und Nepal-Visum (50 US$ für 30 Tage)',
          'Reise- und Rettungsversicherung (verpflichtend)',
          'Persönliche Trekkingausrüstung — Packliste nach der Buchung',
          'Warme Duschen, Strom und WLAN in den Lodges',
          'Trinkgeld für Guide und Träger',
        ].map((item) => ({ item })),
        faqs: [
          { question: 'Wie fit muss ich sein?', answer: 'Sie sollten 6–8 Stunden täglich auf unebenem Gelände mit leichtem Tagesrucksack gehen können. Acht Wochen vor Abflug senden wir einen Trainingsplan.' },
          { question: 'Wie sieht es mit der Höhe aus?', answer: 'Zwei Akklimatisationstage (Namche und Dingboche) und maximal 400 m Schlafhöhengewinn pro Tag über 3.000 m. Guides führen Pulsoximeter und einen Höhen-Drucksack mit.' },
          { question: 'Was passiert bei Flugausfällen in Lukla?', answer: 'Etwa jeder sechste Tag fällt in der Hochsaison wetterbedingt aus. Wir planen einen Puffertag ein und buchen auf Helikopter oder die Route über Jiri um — auf unsere Kosten.' },
        ],
      },
      fr: {
        title: 'Trek du camp de base de l’Everest',
        summary: 'Le classique de 14 jours jusqu’au pied de la plus haute montagne du monde, avec le lever de soleil sur le Kala Patthar et trois jours d’acclimatation intégrés.',
        priceNote: 'Sur la base d’un groupe de 6. Départs privés à partir de 2 480 $.',
        highlights: [
          'Lever de soleil sur l’Everest depuis le Kala Patthar (5 545 m)',
          'Monastère de Tengboche avec l’Ama Dablam derrière la roue de prière',
          'La cascade de glace du Khumbu depuis le camp de base, accessible à pied',
          'Jour de marché à Namche Bazaar et le musée sherpa',
        ].map((text) => ({ text })),
        included: [
          'Vols Katmandou ↔ Lukla, dont 15 kg de bagages en soute',
          'Tous les hébergements en lodge, en chambre double',
          'Trois repas par jour à la carte du lodge',
          'Guide anglophone diplômé, guide assistant à partir de 8 marcheurs',
          'Porteurs (1 pour 2 marcheurs), assurés et équipés',
          'Permis du parc national de Sagarmatha, TIMS et taxes locales',
        ].map((item) => ({ item })),
        notIncluded: [
          'Vols internationaux et visa népalais (50 $ US pour 30 jours)',
          'Assurance voyage et secours (obligatoire)',
          'Équipement personnel — liste complète envoyée à la réservation',
          'Douches chaudes, recharge et Wi-Fi dans les lodges',
          'Pourboires pour le guide et les porteurs',
        ].map((item) => ({ item })),
        faqs: [
          { question: 'Quelle condition physique est nécessaire ?', answer: 'Vous devez pouvoir marcher 6 à 8 heures par jour sur un terrain irrégulier plusieurs jours de suite avec un petit sac. Un plan d’entraînement est envoyé 8 semaines avant le départ.' },
          { question: 'Et l’altitude ?', answer: 'Deux jours d’acclimatation (Namche et Dingboche) et jamais plus de 400 m de dénivelé de sommeil par jour au-dessus de 3 000 m. Les guides emportent des oxymètres et un caisson hyperbare.' },
          { question: 'Que se passe-t-il si les vols pour Lukla sont annulés ?', answer: 'La météo cloue Lukla au sol environ un jour sur six en haute saison. Nous prévoyons une journée tampon et pouvons réorganiser en hélicoptère ou via Jiri, à nos frais.' },
        ],
      },
    },
    {
      destinationIndex: 1,
      en: {
        title: 'Annapurna Base Camp Trek',
        summary: 'Eleven days from Pokhara’s lakeside into the Sanctuary — a glacial amphitheatre ringed by 7,000-metre walls.',
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
          { question: 'Is this trek suitable for first-timers?', answer: 'Yes. The maximum sleeping altitude is 4,130 m and the daily gains are moderate. It is our most popular first Himalayan trek.' },
          { question: 'Can we add Poon Hill?', answer: 'Almost everyone does — it adds two days and the best sunrise viewpoint in the region. Ask for the "ABC + Poon Hill" variant.' },
        ],
        itinerary: [
          { day: 1, title: 'Arrive in Pokhara', altitude: 822, description: 'Transfer from Kathmandu by flight or road. Gear check and briefing.', accommodation: 'Hotel in Pokhara' },
          { day: 2, title: 'Drive to Nayapul, trek to Tikhedhunga', altitude: 1540, description: 'Short drive, then a gentle walk up the Bhurungdi Khola.', accommodation: 'Teahouse' },
          { day: 3, title: 'Tikhedhunga to Ghorepani (2,860 m)', altitude: 2860, description: 'The Ulleri staircase: 3,000 steps, one memorable afternoon.', accommodation: 'Teahouse' },
          { day: 4, title: 'Poon Hill sunrise, trek to Tadapani', altitude: 2630, description: 'Pre-dawn climb to Poon Hill (3,210 m) for the Dhaulagiri sunrise, then through rhododendron forest to Tadapani.', accommodation: 'Teahouse' },
          { day: 5, title: 'Tadapani to Chomrong (2,170 m)', altitude: 2170, description: 'Gurung village with the best views of Annapurna South and Hiunchuli from the teahouse veranda.', accommodation: 'Teahouse' },
          { day: 6, title: 'Chomrong to Dovan (2,600 m)', altitude: 2600, description: 'Down to the Chomrong Khola and back up through bamboo forest.', accommodation: 'Teahouse' },
          { day: 7, title: 'Dovan to Deurali (3,230 m)', altitude: 3230, description: 'Into the gorge, under Hinko Cave, with the Sanctuary walls closing in.', accommodation: 'Teahouse' },
          { day: 8, title: 'Deurali to Annapurna Base Camp (4,130 m)', altitude: 4130, description: 'The amphitheatre opens. Machhapuchhre’s fishtail, Annapurna I, Gangapurna — all at once.', accommodation: 'Teahouse' },
          { day: 9, title: 'Sunrise at Base Camp, descend to Bamboo', altitude: 2310, description: 'One last freezing sunrise, then a long descent.', accommodation: 'Teahouse' },
          { day: 10, title: 'Bamboo to Jhinu Danda', altitude: 1780, description: 'Hot springs in the afternoon. Well earned.', accommodation: 'Teahouse' },
          { day: 11, title: 'Drive to Pokhara', altitude: 822, description: 'Walk out to Nayapul, transfer to Pokhara, celebration dinner.', accommodation: 'Hotel in Pokhara' },
        ],
      },
      de: {
        title: 'Annapurna-Basislager-Trekking',
        summary: 'Elf Tage vom Seeufer Pokharas ins Sanctuary — ein Gletscheramphitheater, umrahmt von 7.000 Meter hohen Wänden.',
        highlights: [
          'Sonnenaufgang im Annapurna-Heiligtum mit dem Machhapuchhre',
          'Gurung-Dörfer Ghandruk und Chomrong',
          'Natürliche heiße Quellen in Jhinu Danda',
          'Sonnenaufgang am Poon Hill über Dhaulagiri und der gesamten Annapurna-Kette',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Ist dieser Trek für Anfänger geeignet?', answer: 'Ja. Die maximale Schlafhöhe beträgt 4.130 m und die Tagesetappen sind moderat. Unser beliebtester erster Himalaya-Trek.' },
          { question: 'Können wir Poon Hill ergänzen?', answer: 'Fast alle tun es — zwei Tage mehr und der beste Sonnenaufgang der Region. Fragen Sie nach der Variante „ABC + Poon Hill“.' },
        ],
      },
      fr: {
        title: 'Trek du camp de base de l’Annapurna',
        summary: 'Onze jours depuis les rives de Pokhara jusqu’au Sanctuaire — un amphithéâtre glaciaire cerné de murs de 7 000 mètres.',
        highlights: [
          'Lever de soleil dans le Sanctuaire de l’Annapurna avec le Machhapuchhre',
          'Villages gurungs de Ghandruk et Chomrong',
          'Sources chaudes naturelles à Jhinu Danda',
          'Lever de soleil depuis Poon Hill sur le Dhaulagiri et toute la chaîne',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Ce trek convient-il aux débutants ?', answer: 'Oui. L’altitude de sommeil maximale est de 4 130 m et les dénivelés quotidiens restent modérés. C’est notre premier trek himalayen le plus demandé.' },
          { question: 'Peut-on ajouter Poon Hill ?', answer: 'Presque tout le monde le fait — deux jours de plus pour le plus beau lever de soleil de la région. Demandez la variante « ABC + Poon Hill ».' },
        ],
      },
    },
    {
      destinationIndex: 2,
      en: {
        title: 'Langtang Valley & Kyanjin Ri',
        summary: 'Nine days in Tamang country — the closest true wilderness to Kathmandu, with two 5,000-metre viewpoints.',
        durationDays: 9,
        durationNights: 8,
        groupSizeMax: 10,
        maxAltitude: 4984,
        difficulty: 'moderate' as const,
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
          { question: 'Is the valley safe after the 2015 earthquake?', answer: 'Yes. The trail was rebuilt and rerouted above the 2015 avalanche deposit, and lodges are new throughout. Your presence is the most useful form of support the valley can get.' },
          { question: 'Can we trek this in winter?', answer: 'It is one of the best winter treks in Nepal. Expect cold nights (−10 °C at Kyanjin) and empty trails.' },
        ],
        itinerary: [
          { day: 1, title: 'Drive Kathmandu to Syabrubesi (1,550 m)', altitude: 1550, description: 'Seven hours through the Trishuli valley. Last cold beer for a while.', accommodation: 'Teahouse' },
          { day: 2, title: 'Syabrubesi to Lama Hotel (2,380 m)', altitude: 2380, description: 'Riverside walking through bamboo and oak forest.', accommodation: 'Teahouse' },
          { day: 3, title: 'Lama Hotel to Langtang village (3,430 m)', altitude: 3430, description: 'The valley opens. This is the village that was buried in 2015, rebuilt by the families who stayed.', accommodation: 'Teahouse' },
          { day: 4, title: 'Langtang to Kyanjin Gompa (3,870 m)', altitude: 3870, description: 'Yak pastures, mani walls, and the monastery directly under Langtang Lirung.', accommodation: 'Teahouse' },
          { day: 5, title: 'Kyanjin Ri and Tsergo Ri', altitude: 4984, description: 'Kyanjin Ri (4,773 m) at sunrise, Tsergo Ri (4,984 m) if the group is strong. Both are optional and both are worth it.', accommodation: 'Teahouse' },
          { day: 6, title: 'Kyanjin to Lama Hotel', altitude: 2380, description: 'Retrace the valley downhill.', accommodation: 'Teahouse' },
          { day: 7, title: 'Lama Hotel to Syabrubesi', altitude: 1550, description: 'Final forest walk out.', accommodation: 'Teahouse' },
          { day: 8, title: 'Drive to Kathmandu', altitude: 1400, description: 'Long road day, hot shower, celebration dinner.', accommodation: 'Hotel in Kathmandu' },
          { day: 9, title: 'Departure', altitude: 1400, description: 'Airport transfer.', accommodation: '—' },
        ],
      },
      de: {
        title: 'Langtang-Tal & Kyanjin Ri',
        summary: 'Neun Tage im Land der Tamang — die nächste echte Wildnis bei Kathmandu, mit zwei Aussichtspunkten über 5.000 m.',
        highlights: [
          'Kyanjin Gompa unter dem Eisbruch des Langtang Lirung',
          'Tsergo Ri (4.984 m) — ein 360°-Panorama für einen harten Vormittag',
          'Nach 2015 wiederaufgebaute Tamang-Dörfer',
          'Rotpanda-Gebiet im Langtang-Nationalpark',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Ist das Tal nach dem Erdbeben 2015 sicher?', answer: 'Ja. Der Weg wurde oberhalb der Lawinenablagerung von 2015 neu gebaut, alle Lodges sind neu. Ihre Anwesenheit ist die wirksamste Unterstützung für das Tal.' },
          { question: 'Kann man im Winter trekken?', answer: 'Es ist einer der besten Wintertreks Nepals. Rechnen Sie mit kalten Nächten (−10 °C in Kyanjin) und leeren Wegen.' },
        ],
      },
      fr: {
        title: 'Vallée de Langtang & Kyanjin Ri',
        summary: 'Neuf jours en pays tamang — la vraie nature sauvage la plus proche de Katmandou, avec deux belvédères à 5 000 m.',
        highlights: [
          'Kyanjin Gompa sous la cascade de glace du Langtang Lirung',
          'Tsergo Ri (4 984 m) — un panorama à 360° pour une matinée difficile',
          'Villages tamangs reconstruits depuis 2015',
          'Territoire du panda roux dans le parc national de Langtang',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'La vallée est-elle sûre après le séisme de 2015 ?', answer: 'Oui. Le sentier a été reconstruit et redirigé au-dessus du dépôt d’avalanche de 2015, et les lodges sont neufs. Votre présence est le soutien le plus utile pour la vallée.' },
          { question: 'Peut-on trekker en hiver ?', answer: 'C’est l’un des meilleurs treks d’hiver au Népal. Prévoyez des nuits froides (−10 °C à Kyanjin) et des sentiers déserts.' },
        ],
      },
    },
    {
      destinationIndex: 0,
      en: {
        title: 'Everest Three High Passes',
        summary: 'Eighteen days, three 5,300-metre passes and every major viewpoint in the Khumbu. For trekkers who want the whole thing.',
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
          { question: 'Who is this trip for?', answer: 'Trekkers with previous high-altitude experience and a solid training base. Two consecutive 5,000 m+ pass days are the crux.' },
          { question: 'What if a pass is snowed out?', answer: 'Your guide carries the decision. There is always a lower alternative route, and we build two buffer days into the 18.' },
        ],
        itinerary: [
          { day: 1, title: 'Arrive in Kathmandu', altitude: 1400, description: 'Briefing and gear check.', accommodation: 'Hotel' },
          { day: 2, title: 'Fly to Lukla, trek to Phakding', altitude: 2610, description: 'The approach begins.', accommodation: 'Teahouse' },
          { day: 3, title: 'Phakding to Namche Bazaar', altitude: 3440, description: 'Hillary Bridge and the Namche hill.', accommodation: 'Teahouse' },
          { day: 4, title: 'Acclimatisation in Namche', altitude: 3440, description: 'Everest View Hotel and the Sherpa museum.', accommodation: 'Teahouse' },
          { day: 5, title: 'Namche to Tengboche', altitude: 3860, description: 'Monastery afternoon.', accommodation: 'Teahouse' },
          { day: 6, title: 'Tengboche to Dingboche', altitude: 4410, description: 'Above the treeline.', accommodation: 'Teahouse' },
          { day: 7, title: 'Acclimatisation in Dingboche', altitude: 4410, description: 'Nangkartshang peak.', accommodation: 'Teahouse' },
          { day: 8, title: 'Dingboche to Lobuche', altitude: 4940, description: 'Climbers’ memorials above Thukla.', accommodation: 'Teahouse' },
          { day: 9, title: 'Lobuche to Everest Base Camp', altitude: 5364, description: 'Gorak Shep, then the icefall.', accommodation: 'Teahouse' },
          { day: 10, title: 'Kala Patthar and Kongma La', altitude: 5535, description: 'Sunrise at 5,545 m, then the first pass to Chhukung.', accommodation: 'Teahouse' },
          { day: 11, title: 'Chhukung rest day', altitude: 4730, description: 'Optional Island Peak base camp walk.', accommodation: 'Teahouse' },
          { day: 12, title: 'Cho La crossing to Dzongla', altitude: 5420, description: 'The technical pass — crampons and early start.', accommodation: 'Teahouse' },
          { day: 13, title: 'Dzongla to Gokyo', altitude: 4790, description: 'Ngozumpa glacier and the turquoise lakes.', accommodation: 'Teahouse' },
          { day: 14, title: 'Gokyo Ri sunrise', altitude: 5357, description: 'Four 8,000-metre peaks before breakfast.', accommodation: 'Teahouse' },
          { day: 15, title: 'Renjo La to Thame', altitude: 5360, description: 'The third pass, then down into the Bhote Koshi valley.', accommodation: 'Teahouse' },
          { day: 16, title: 'Thame to Namche', altitude: 3440, description: 'Monastery visit and a last bakery stop.', accommodation: 'Teahouse' },
          { day: 17, title: 'Namche to Lukla', altitude: 2860, description: 'Final descent and farewell dinner.', accommodation: 'Teahouse' },
          { day: 18, title: 'Fly to Kathmandu', altitude: 1400, description: 'Buffer day available if weather delays the flight.', accommodation: 'Hotel' },
        ],
      },
      de: {
        title: 'Everest – Drei hohe Pässe',
        summary: 'Achtzehn Tage, drei Pässe über 5.300 m und jeder große Aussichtspunkt des Khumbu. Für Trekkers, die alles wollen.',
        highlights: [
          'Kongma La (5.535 m), Cho La (5.420 m) und Renjo La (5.360 m)',
          'Gokyo-Seen und Gokyo Ri (5.357 m)',
          'Everest-Basislager und Kala Patthar',
          'Kleine Gruppen — maximal acht Teilnehmer',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Für wen ist diese Reise?', answer: 'Für Trekkers mit Hochenerfahrung und guter Trainingsbasis. Zwei aufeinanderfolgende Passtage über 5.000 m sind der Schlüsselabschnitt.' },
          { question: 'Was, wenn ein Pass verschneit ist?', answer: 'Ihr Guide entscheidet. Es gibt immer eine niedrigere Alternativroute, und wir planen zwei Puffertage ein.' },
        ],
      },
      fr: {
        title: 'Everest – Trois grands cols',
        summary: 'Dix-huit jours, trois cols à plus de 5 300 m et tous les grands belvédères du Khumbu. Pour celles et ceux qui veulent tout faire.',
        highlights: [
          'Kongma La (5 535 m), Cho La (5 420 m) et Renjo La (5 360 m)',
          'Lacs de Gokyo et Gokyo Ri (5 357 m)',
          'Camp de base de l’Everest et Kala Patthar',
          'Petits groupes — huit marcheurs au maximum',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'À qui s’adresse ce voyage ?', answer: 'Aux marcheurs ayant déjà une expérience de l’altitude et une bonne préparation physique. Deux jours de col consécutifs au-dessus de 5 000 m constituent le passage clé.' },
          { question: 'Que faire si un col est enneigé ?', answer: 'Votre guide décide. Il existe toujours un itinéraire de repli plus bas, et nous prévoyons deux jours tampon.' },
        ],
      },
    },
    {
      destinationIndex: 3,
      en: {
        title: 'Upper Mustang & Lo Manthang',
        summary: 'Thirteen days inside a restricted Tibetan kingdom — cave monasteries, ochre canyons and a walled city closed to outsiders until 1992.',
        durationDays: 13,
        durationNights: 12,
        groupSizeMax: 10,
        maxAltitude: 4210,
        difficulty: 'moderate' as const,
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
          { question: 'Why is it so expensive?', answer: 'The restricted-area permit alone costs US$ 500 for ten days and must be arranged through a registered agency with a minimum of two trekkers.' },
          { question: 'Can we do it by jeep?', answer: 'Yes — a 7-day vehicle-based version covers the same highlights with far less walking. Ask for the "Mustang by road" itinerary.' },
        ],
        itinerary: [
          { day: 1, title: 'Arrive in Pokhara', altitude: 822, description: 'Permit formalities and briefing.', accommodation: 'Hotel' },
          { day: 2, title: 'Fly to Jomsom, trek to Kagbeni', altitude: 2810, description: 'Morning flight over the gorge, then an easy walk to the gateway of Mustang.', accommodation: 'Lodge' },
          { day: 3, title: 'Kagbeni to Chele', altitude: 3050, description: 'Permit check, then into the red cliffs.', accommodation: 'Lodge' },
          { day: 4, title: 'Chele to Ghiling', altitude: 3520, description: 'Two passes, one very long canyon.', accommodation: 'Lodge' },
          { day: 5, title: 'Ghiling to Charang', altitude: 3560, description: 'The royal palace and the red monastery of Charang.', accommodation: 'Lodge' },
          { day: 6, title: 'Charang to Lo Manthang', altitude: 3810, description: 'Cross the final pass into the walled city.', accommodation: 'Lodge' },
          { day: 7, title: 'Lo Manthang and the Chhoser caves', altitude: 3810, description: 'Sky caves, murals, and a monastery with 1,500 painted Buddhas.', accommodation: 'Lodge' },
          { day: 8, title: 'Lo Manthang rest day', altitude: 3810, description: 'Festival visits if the calendar cooperates; otherwise horse riding in the valley.', accommodation: 'Lodge' },
          { day: 9, title: 'Lo Manthang to Drakmar', altitude: 3820, description: 'Retrace south through the painted red cliffs.', accommodation: 'Lodge' },
          { day: 10, title: 'Drakmar to Ghiling', altitude: 3520, description: 'Canyon walking.', accommodation: 'Lodge' },
          { day: 11, title: 'Ghiling to Kagbeni', altitude: 2810, description: 'Long final day down the Kali Gandaki.', accommodation: 'Lodge' },
          { day: 12, title: 'Kagbeni to Jomsom, fly to Pokhara', altitude: 2720, description: 'Morning walk, afternoon flight, celebration dinner.', accommodation: 'Hotel in Pokhara' },
          { day: 13, title: 'Departure', altitude: 822, description: 'Transfer to Kathmandu or the airport.', accommodation: '—' },
        ],
      },
      de: {
        title: 'Oberes Mustang & Lo Manthang',
        summary: 'Dreizehn Tage in einem tibetischen Sperrgebiet — Höhlenklöster, Ockerschluchten und eine bis 1992 verschlossene Stadt.',
        highlights: [
          'Lo Manthang — eine ummauerte Stadt mit 700 Jahre alten Klöstern',
          'Himmels Höhlen von Chhoser, teils mit 2.000 Jahre alten Wandmalereien',
          'Kali-Gandaki-Schlucht, die tiefste der Erde',
          'Trekking in den Monsunmonaten im Regenschatten',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Warum ist es so teuer?', answer: 'Allein das Sperrgebiets-Permit kostet 500 US$ für zehn Tage und muss über eine registrierte Agentur mit mindestens zwei Teilnehmern beantragt werden.' },
          { question: 'Geht das auch mit dem Jeep?', answer: 'Ja — eine 7-tägige Variante mit Fahrzeug zeigt dieselben Höhepunkte mit deutlich weniger Gehzeit. Fragen Sie nach „Mustang auf der Straße“.' },
        ],
      },
      fr: {
        title: 'Haut Mustang & Lo Manthang',
        summary: 'Treize jours dans un royaume tibétain réglementé — monastères troglodytes, canyons ocres et une cité fortifiée fermée jusqu’en 1992.',
        highlights: [
          'Lo Manthang — cité fortifiée aux monastères vieux de 700 ans',
          'Grottes célestes de Chhoser, certaines ornées de peintures vieilles de 2 000 ans',
          'Gorge de Kali Gandaki, la plus profonde du monde',
          'Trekking pendant la mousson, à l’abri des pluies',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Pourquoi est-ce si cher ?', answer: 'Le permis de zone réglementée coûte à lui seul 500 $ US pour dix jours et doit être obtenu via une agence agréée, avec un minimum de deux marcheurs.' },
          { question: 'Peut-on le faire en 4×4 ?', answer: 'Oui — une version de 7 jours en véhicule couvre les mêmes sites avec beaucoup moins de marche. Demandez l’itinéraire « Mustang sur route ».' },
        ],
      },
    },
    {
      destinationIndex: 1,
      en: {
        title: 'Mardi Himal & Khopra Ridge',
        summary: 'Eight quiet days on the ridges opposite Machhapuchhre — the best-value-view trek in the Annapurna range.',
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
          { question: 'Is this a good first trek?', answer: 'The best one we sell. Short days, low altitude, community lodges and — unlike the ABC trail — almost nobody else on it.' },
        ],
        itinerary: [
          { day: 1, title: 'Arrive in Pokhara', altitude: 822, description: 'Briefing in Lakeside.', accommodation: 'Hotel' },
          { day: 2, title: 'Drive to Kande, trek to Deurali', altitude: 2100, description: 'Short drive, ridge walking from the start.', accommodation: 'Lodge' },
          { day: 3, title: 'Deurali to Forest Camp', altitude: 2600, description: 'Rhododendron and oak forest.', accommodation: 'Lodge' },
          { day: 4, title: 'Forest Camp to Low Camp', altitude: 3050, description: 'Above the treeline, first big views.', accommodation: 'Lodge' },
          { day: 5, title: 'Low Camp to High Camp', altitude: 3580, description: 'The fishtail fills the sky.', accommodation: 'Lodge' },
          { day: 6, title: 'Mardi Himal base camp and back', altitude: 4500, description: 'Sunrise push to 4,500 m, then descend to Low Camp.', accommodation: 'Lodge' },
          { day: 7, title: 'Low Camp to Siding', altitude: 1750, description: 'Down through Gurung villages.', accommodation: 'Lodge' },
          { day: 8, title: 'Drive to Pokhara', altitude: 822, description: 'Short walk out, transfer, celebration dinner.', accommodation: 'Hotel' },
        ],
      },
      de: {
        title: 'Mardi Himal & Khopra-Grat',
        summary: 'Acht ruhige Tage auf den Graten gegenüber des Machhapuchhre — der Trek mit dem besten Preis-Aussicht-Verhältnis.',
        highlights: [
          'Mardi-Himal-Basislager (4.500 m) ohne Menschenmassen',
          'Von der Gemeinde betriebene Lodges am Khopra-Grat',
          'Machhapuchhre (6.993 m) zum Greifen nah',
          'Optionales Bad im Khayer-See (4.500 m)',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Ist das ein guter erster Trek?', answer: 'Der beste, den wir anbieten. Kurze Etappen, moderate Höhe, Gemeinschafts-Lodges und — anders als auf dem ABC-Weg — kaum jemand unterwegs.' },
        ],
      },
      fr: {
        title: 'Mardi Himal & Crête de Khopra',
        summary: 'Huit jours paisibles sur les crêtes face au Machhapuchhre — le meilleur rapport vue/prix du massif des Annapurna.',
        highlights: [
          'Camp de base du Mardi Himal (4 500 m) sans la foule',
          'Lodges gérés par la communauté sur la crête de Khopra',
          'Le Machhapuchhre (6 993 m) à portée de main',
          'Baignade possible au lac Khayer (4 500 m)',
        ].map((text) => ({ text })),
        faqs: [
          { question: 'Est-ce un bon premier trek ?', answer: 'Le meilleur que nous proposions. Étapes courtes, altitude modérée, lodges communautaires et — contrairement à l’ABC — presque personne sur le sentier.' },
        ],
      },
    },
  ] satisfies { destinationIndex: number; en: { bestSeasons: Season[] } & Record<string, unknown>; de: Record<string, unknown>; fr: Record<string, unknown> }[]

  for (const [index, trip] of tripData.entries()) {
    const created = await payload.create({
      collection: 'trips',
      locale: 'en',
      data: ({
        ...trip.en,
        slug: trip.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        destination: destinationIds[trip.destinationIndex]!,
        heroImage: imageAt(index + 2),
        description: richText(
          paragraph(trip.en.summary),
          heading('What this trip feels like'),
          paragraph(
            'Days start early and end with the light. You walk with a small group, a guide who has done this route dozens of times, and porters who are properly insured and equipped. Accommodation is in family-run lodges; food is cooked fresh, and the tea is endless.',
          ),
          heading('Is it right for you?'),
          bulletList(
            trip.en.highlights.map((highlight) => highlight.text),
          ),
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
        meta: {
          title: `${trip.en.title} — ${trip.en.durationDays} days from $${trip.en.priceFrom}`,
          description: trip.en.summary,
        },
        _status: 'published',
      } satisfies RequiredDataFromCollectionSlug<'trips'>),
    })

    await translate('trips', created.id, {
      de: { ...trip.de, slug: trip.de.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      fr: { ...trip.fr, slug: trip.fr.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    })
  }

  console.log(`  ✓ Created ${tripData.length} trips`)

  /* ---------- blog ---------- */
  const postData = [
    {
      en: {
        title: 'How to train for a 5,500 m trek (without a gym membership)',
        excerpt: 'Eight weeks, two sessions a day, no equipment. The plan we send every Everest Base Camp client — published here because it works for everyone.',
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
      de: {
        title: 'Training für einen 5.500-m-Trek (ohne Fitnessstudio)',
        excerpt: 'Acht Wochen, zwei Einheiten am Tag, kein Gerät. Der Plan, den wir jedem Everest-Basislager-Kunden schicken.',
      },
      fr: {
        title: 'Comment se préparer pour un trek à 5 500 m (sans salle de sport)',
        excerpt: 'Huit semaines, deux séances par jour, aucun matériel. Le plan que nous envoyons à chaque client du camp de base de l’Everest.',
      },
    },
    {
      en: {
        title: 'The honest packing list for the Khumbu in autumn',
        excerpt: 'Eleven kilograms, four layers, no cotton. What our guides actually carry after fifteen seasons on the same trail.',
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
      },
      de: {
        title: 'Die ehrliche Packliste für den Khumbu im Herbst',
        excerpt: 'Elf Kilogramm, vier Schichten, keine Baumwolle. Was unsere Guides nach fünfzehn Saisons wirklich mitnehmen.',
      },
      fr: {
        title: 'La liste de matériel honnête pour le Khumbu en automne',
        excerpt: 'Onze kilos, quatre couches, pas de coton. Ce que nos guides emportent vraiment après quinze saisons sur le même sentier.',
      },
    },
    {
      en: {
        title: 'Altitude sickness: what the guide is watching for',
        excerpt: 'Every evening on trek, someone takes your pulse and blood oxygen. Here is what we are looking for — and why the answer is sometimes to go down.',
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
      },
      de: {
        title: 'Höhenkrankheit: Worauf der Guide achtet',
        excerpt: 'Jeden Abend misst jemand Puls und Sauerstoffsättigung. Hier steht, was wir suchen — und warum die Antwort manchmal „absteigen“ lautet.',
      },
      fr: {
        title: 'Mal aigu des montagnes : ce que le guide surveille',
        excerpt: 'Chaque soir, quelqu’un prend votre pouls et votre saturation en oxygène. Voici ce que nous cherchons — et pourquoi la réponse est parfois de descendre.',
      },
    },
    {
      en: {
        title: 'Langtang, eight years on: a valley that rebuilt itself',
        excerpt: 'In 2015 the avalanche buried the village. What happened next is the most encouraging story in Nepali tourism.',
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
      de: {
        title: 'Langtang, acht Jahre danach: Ein Tal, das sich selbst wiederaufgebaut hat',
        excerpt: '2015 verschüttete die Lawine das Dorf. Was danach geschah, ist die ermutigendste Geschichte des nepalesischen Tourismus.',
      },
      fr: {
        title: 'Langtang, huit ans après : une vallée qui s’est reconstruite',
        excerpt: 'En 2015, l’avalanche a enseveli le village. Ce qui a suivi est l’histoire la plus encourageante du tourisme népalais.',
      },
    },
    {
      en: {
        title: 'What a porter’s job actually involves',
        excerpt: 'Twenty-five kilos, twelve days, one pair of sandals. The people who make trekking possible deserve more than a footnote.',
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
      de: {
        title: 'Was der Job eines Trägers wirklich bedeutet',
        excerpt: 'Fünfundzwanzig Kilo, zwölf Tage, ein Paar Sandalen. Die Menschen, die das Trekking möglich machen, verdienen mehr als eine Fußnote.',
      },
      fr: {
        title: 'En quoi consiste vraiment le métier de porteur',
        excerpt: 'Vingt-cinq kilos, douze jours, une paire de sandales. Celles et ceux qui rendent le trekking possible méritent mieux qu’une note de bas de page.',
      },
    },
  ] satisfies { en: { categories: PostCategory[] } & Record<string, unknown>; de: Record<string, unknown>; fr: Record<string, unknown> }[]

  for (const [index, post] of postData.entries()) {
    const created = await payload.create({
      collection: 'blog',
      locale: 'en',
      data: ({
        ...post.en,
        slug: post.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        featuredImage: imageAt(index + 6),
        author: authorId,
        publishedAt: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        meta: {
          title: post.en.title,
          description: post.en.excerpt,
        },
        _status: 'published',
      } satisfies RequiredDataFromCollectionSlug<'blog'>),
    })

    await translate('blog', created.id, {
      de: { ...post.de, slug: post.de.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      fr: { ...post.fr, slug: post.fr.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    })
  }

  console.log(`  ✓ Created ${postData.length} journal posts`)

  /* ---------- pages ---------- */
  const homeBlocks = (locale: Locale): Page['blocks'] => {
    const copy = {
      en: {
        eyebrow: 'Nepal · Himalaya',
        heading: 'Walk where the map runs out of names.',
        subheading:
          'Small-group treks and expeditions across the Himalaya, led by guides who grew up on these trails. Fourteen years, one country, no reselling.',
        primary: 'Browse all trips',
        secondary: 'Plan your trip',
        stats: 'Why people keep coming back',
        trips: 'Trips worth building a year around',
        tripsSub:
          'Every itinerary below has been walked by the person who wrote it. Pick one as it stands, or tell us what to change.',
        destinations: 'Four regions, one mountain country',
        destinationsSub:
          'Start with the classic valleys, or go looking for the quiet ones behind the rain shadow.',
        testimonials: 'What they said afterwards',
        testimonialsSub: 'Unedited, straight out of the post-trip survey.',
        gallery: 'From the trail',
        gallerySub: 'Shot by guides and guests over the last two seasons.',
        journal: 'From the journal',
        journalSub:
          'Packing lists, training plans and hard-won advice from people who spend 200 days a year at altitude.',
        faq: 'Questions we get every week',
        faqSub: 'If yours is not here, ask — a real person answers within 24 hours.',
        inquiry: 'Tell us what you are dreaming of',
        inquirySub:
          'A real person — usually the guide who would lead you — replies within 24 hours with a first draft itinerary.',
        note: 'No payment is taken at this stage. We only ask for a deposit once the itinerary is agreed.',
        viewTrips: 'View all trips',
        viewDestinations: 'All destinations',
        viewJournal: 'Read the journal',
        statsItems: [
          { value: '14', label: 'Years on the trail', description: 'Operated by our own team, never resold.' },
          { value: '4.9', label: 'Average rating', description: 'Across 600+ verified reviews.' },
          { value: '1:6', label: 'Guide to guest ratio', description: 'Plus insured porters, max 25 kg each.' },
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
      },
      de: {
        eyebrow: 'Nepal · Himalaja',
        heading: 'Geh dort, wo die Karte keine Namen mehr hat.',
        subheading:
          'Kleingruppen-Trekkings und Expeditionen im Himalaja, geführt von Guides, die auf diesen Wegen aufgewachsen sind. Vierzehn Jahre, ein Land, keine Weitervermittlung.',
        primary: 'Alle Reisen ansehen',
        secondary: 'Reise planen',
        stats: 'Warum unsere Gäste wiederkommen',
        trips: 'Reisen, für die man ein Jahr plant',
        tripsSub:
          'Jede Route hier ist von der Person erwandert worden, die sie geschrieben hat. Nimm sie, wie sie ist — oder sag uns, was wir ändern sollen.',
        destinations: 'Vier Regionen, ein Bergland',
        destinationsSub:
          'Beginne mit den klassischen Tälern oder suche die stillen hinter dem Regenschatten.',
        testimonials: 'Was sie danach sagten',
        testimonialsSub: 'Unredigiert, direkt aus der Umfrage nach der Reise.',
        gallery: 'Von unterwegs',
        gallerySub: 'Fotografiert von Guides und Gästen in den letzten zwei Saisons.',
        journal: 'Aus dem Journal',
        journalSub:
          'Packlisten, Trainingspläne und Erfahrungen von Menschen, die 200 Tage im Jahr in der Höhe verbringen.',
        faq: 'Fragen, die wir jede Woche hören',
        faqSub: 'Wenn deine nicht dabei ist: frag uns — ein echter Mensch antwortet innerhalb von 24 Stunden.',
        inquiry: 'Erzähl uns, wovon du träumst',
        inquirySub:
          'Ein echter Mensch — meist der Guide, der dich führen würde — antwortet innerhalb von 24 Stunden mit einem ersten Entwurf.',
        note: 'In dieser Phase wird nichts bezahlt. Eine Anzahlung verlangen wir erst, wenn die Route feststeht.',
        viewTrips: 'Alle Reisen',
        viewDestinations: 'Alle Regionen',
        viewJournal: 'Zum Journal',
        statsItems: [
          { value: '14', label: 'Jahre unterwegs', description: 'Eigenes Team, nie weiterverkauft.' },
          { value: '4,9', label: 'Durchschnittsbewertung', description: 'Aus über 600 verifizierten Bewertungen.' },
          { value: '1:6', label: 'Guide-Gast-Verhältnis', description: 'Dazu versicherte Träger, max. 25 kg.' },
          { value: '98%', label: 'Gipfelerfolg', description: 'Bei unseren Termin-Gipfeltouren.' },
        ],
        faqs: [
          {
            question: 'Brauche ich Trekking-Erfahrung?',
            answer:
              'Für die meisten Reisen nicht. Mardi Himal, Langtang und das Annapurna-Basislager eignen sich sehr gut als erster Himalaya-Trek. Die drei Pässe und unsere Gipfeltouren setzen Höhenerfahrung voraus.',
          },
          {
            question: 'Wie groß sind die Gruppen?',
            answer:
              'Maximal 12 Personen bei den klassischen Treks, 8 bei den anspruchsvolleren Routen. Privattermine sind ab zwei Personen jederzeit möglich.',
          },
          {
            question: 'Was ist im Preis enthalten?',
            answer:
              'Alle Unterkünfte auf dem Trek, alle Mahlzeiten aus der Lodge-Karte, Permits, Transport wie beschrieben, ein lizenzierter Guide und versicherte Träger. Nicht enthalten: internationale Flüge, Versicherung, Visum und persönliche Ausrüstung.',
          },
          {
            question: 'Könnt ihr eine private oder maßgeschneiderte Reise organisieren?',
            answer:
              'Das meiste, was wir machen, ist maßgeschneidert. Schick uns Termine, eine grobe Einschätzung deiner Fitness und was du sehen möchtest — wir schicken innerhalb von 24 Stunden einen Entwurf.',
          },
          {
            question: 'Was passiert, wenn das Wetter den Flughafen schließt?',
            answer:
              'In jede Route, die von Flügen nach Lukla oder Jomsom abhängt, sind Puffertage eingebaut. Fällt ein Flug aus, buchen wir um oder weichen aus — auf unsere Kosten.',
          },
        ],
      },
      fr: {
        eyebrow: 'Népal · Himalaya',
        heading: 'Marchez là où la carte n’a plus de noms.',
        subheading:
          'Treks et expéditions en petits groupes dans l’Himalaya, guidés par des guides qui ont grandi sur ces sentiers. Quatorze ans, un seul pays, aucune revente.',
        primary: 'Voir tous les voyages',
        secondary: 'Planifier mon voyage',
        stats: 'Pourquoi nos voyageurs reviennent',
        trips: 'Des voyages qui méritent une année de préparation',
        tripsSub:
          'Chaque itinéraire ci-dessous a été parcouru par la personne qui l’a écrit. Prenez-le tel quel, ou dites-nous ce qu’il faut changer.',
        destinations: 'Quatre régions, un pays de montagnes',
        destinationsSub:
          'Commencez par les vallées classiques, ou partez chercher les plus tranquilles, à l’abri de la mousson.',
        testimonials: 'Ce qu’ils ont dit ensuite',
        testimonialsSub: 'Sans retouche, directement tiré de notre enquête post-voyage.',
        gallery: 'Sur le sentier',
        gallerySub: 'Photographié par nos guides et nos voyageurs ces deux dernières saisons.',
        journal: 'Du journal',
        journalSub:
          'Listes de matériel, plans d’entraînement et conseils durement acquis par des gens qui passent 200 jours par an en altitude.',
        faq: 'Les questions de chaque semaine',
        faqSub: 'Si la vôtre n’y figure pas, demandez — une personne réelle répond sous 24 heures.',
        inquiry: 'Racontez-nous ce dont vous rêvez',
        inquirySub:
          'Une personne réelle — généralement le guide qui vous accompagnera — répond sous 24 heures avec une première ébauche d’itinéraire.',
        note: 'Aucun paiement à ce stade. Nous ne demandons un acompte qu’une fois l’itinéraire validé.',
        viewTrips: 'Tous les voyages',
        viewDestinations: 'Toutes les régions',
        viewJournal: 'Lire le journal',
        statsItems: [
          { value: '14', label: 'Années sur les sentiers', description: 'Opéré par notre équipe, jamais revendu.' },
          { value: '4,9', label: 'Note moyenne', description: 'Sur plus de 600 avis vérifiés.' },
          { value: '1:6', label: 'Ratio guide/voyageur', description: 'Porteurs assurés, 25 kg maximum.' },
          { value: '98%', label: 'Sommets atteints', description: 'Sur nos ascensions programmées.' },
        ],
        faqs: [
          {
            question: 'Faut-il une expérience préalable du trekking ?',
            answer:
              'Pas pour la plupart de nos voyages. Mardi Himal, Langtang et le camp de base de l’Annapurna conviennent très bien comme premier trek himalayen. Les Trois Cols et nos ascensions exigent une expérience de l’altitude.',
          },
          {
            question: 'Quelle est la taille des groupes ?',
            answer:
              'Douze personnes au maximum sur les treks classiques, huit sur les itinéraires plus engagés. Les départs privés sont possibles à toute date à partir de deux personnes.',
          },
          {
            question: 'Qu’est-ce qui est inclus dans le prix ?',
            answer:
              'Tous les hébergements sur le trek, tous les repas à la carte du lodge, les permis, les transports décrits, un guide diplômé et des porteurs assurés. Ne sont pas inclus : vols internationaux, assurance, visa et matériel personnel.',
          },
          {
            question: 'Pouvez-vous organiser un voyage privé ou sur mesure ?',
            answer:
              'La plupart de ce que nous opérons est sur mesure. Envoyez-nous vos dates, une idée de votre condition physique et ce que vous voulez voir : nous renvoyons une ébauche d’itinéraire sous 24 heures.',
          },
          {
            question: 'Que se passe-t-il si la météo ferme l’aéroport ?',
            answer:
              'Des jours tampons sont intégrés à chaque itinéraire dépendant des vols vers Lukla ou Jomsom. Si un vol est annulé, nous réorganisons le trajet à nos frais.',
          },
        ],
      },
    }[locale]

    return [
      {
        blockType: 'hero',
        eyebrow: copy.eyebrow,
        heading: copy.heading,
        subheading: copy.subheading,
        backgroundImage: imageAt(0),
        height: 'tall',
        overlay: 'strong',
        primaryLink: { label: copy.primary, type: 'custom', url: '/trips' },
        secondaryLink: { label: copy.secondary, type: 'custom', url: '/inquiry' },
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
        limit: 3,
        columns: '3',
        viewAllLink: { label: copy.viewTrips, type: 'custom', url: '/trips' },
      },
      {
        blockType: 'featuredDestinations',
        heading: copy.destinations,
        subheading: copy.destinationsSub,
        source: 'featured',
        limit: 4,
        layout: 'editorial',
        viewAllLink: { label: copy.viewDestinations, type: 'custom', url: '/destinations' },
      },
      {
        blockType: 'testimonials',
        heading: copy.testimonials,
        subheading: copy.testimonialsSub,
        variant: 'dark',
        items: [
          {
            quote:
              'Our guide noticed I was struggling at 4,600 m before I said anything and re-organised the whole day around it. That is the difference between an agency and a team.',
            name: 'Marta Nowak',
            role: 'Everest Base Camp, October 2025',
            rating: '5',
          },
          {
            quote:
              'Third trip with Hike Globally. Same guide, same cook, same ridiculous amount of garlic soup. There is a reason I keep coming back.',
            name: 'Thomas Reiter',
            role: 'Annapurna Circuit, April 2025',
            rating: '5',
          },
          {
            quote:
              'We asked for "quieter than the ABC, no camping, eight days". They built exactly that. I have never had an operator listen that carefully.',
            name: 'Camille Fontaine',
            role: 'Mardi Himal, November 2024',
            rating: '5',
          },
        ],
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
        blockType: 'latestPosts',
        heading: copy.journal,
        subheading: copy.journalSub,
        limit: 3,
        viewAllLink: { label: copy.viewJournal, type: 'custom', url: '/blog' },
      },
      {
        blockType: 'faq',
        heading: copy.faq,
        subheading: copy.faqSub,
        items: copy.faqs,
      },
      {
        blockType: 'inquiry',
        heading: copy.inquiry,
        subheading: copy.inquirySub,
        note: copy.note,
        variant: 'dark',
      },
    ]
  }

  const aboutBlocks = (locale: Locale): Page['blocks'] => {
    const copy = {
      en: {
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
      },
      de: {
        eyebrow: 'Über uns',
        heading: 'Wir sind die Menschen auf dem Weg, kein Buchungsschalter.',
        subheading:
          'Hike Globally ist ein Veranstalter mit Sitz in Kathmandu und Pokhara. Jede Reise, die wir verkaufen, wird von unseren eigenen Guides, Köchen und Trägern geführt — wir verkaufen nichts weiter.',
        body: 'Wie wir arbeiten',
        cta: 'Nächster Schritt',
        ctaHeading: 'Beginne mit einem Gespräch, nicht mit einem Formular.',
        ctaText: 'Erzähl uns ungefähr, was du vorhast. Wir schicken einen Entwurf und eine ehrliche Einschätzung.',
        ctaLink: 'Reise planen',
        stats: [
          { value: '30', label: 'Menschen im Team' },
          { value: '600+', label: 'Durchgeführte Reisen' },
          { value: '2012', label: 'Erste Saison' },
        ],
      },
      fr: {
        eyebrow: 'À propos',
        heading: 'Nous sommes les gens du sentier, pas un comptoir de réservation.',
        subheading:
          'Hike Globally est un opérateur basé à Katmandou et Pokhara. Chaque voyage que nous vendons est mené par nos propres guides, cuisiniers et porteurs — nous ne revendons rien à des agences tierces.',
        body: 'Notre façon de travailler',
        cta: 'Étape suivante',
        ctaHeading: 'Commencez par une conversation, pas par un formulaire.',
        ctaText:
          'Dites-nous en gros ce que vous avez en tête. Nous renvoyons une ébauche d’itinéraire et un avis honnête.',
        ctaLink: 'Planifier mon voyage',
        stats: [
          { value: '30', label: 'Personnes dans l’équipe' },
          { value: '600+', label: 'Voyages opérés' },
          { value: '2012', label: 'Première saison' },
        ],
      },
    }[locale]

    return [
      {
        blockType: 'hero',
        eyebrow: copy.eyebrow,
        heading: copy.heading,
        subheading: copy.subheading,
        height: 'compact',
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
        link: { label: copy.ctaLink, type: 'custom', url: '/inquiry' },
        variant: 'sage',
      },
    ]
  }

  const existingHome = await payload.find({
    collection: 'pages',
    locale: 'en',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  if (existingHome.docs.length === 0) {
    const home = await payload.create({
      collection: 'pages',
      locale: 'en',
      data: {
        title: 'Home',
        slug: 'home',
        blocks: homeBlocks('en'),
        meta: {
          title: 'Hike Globally — treks and expeditions in the Himalaya',
          description:
            'Small-group treks and expeditions across Nepal, led by guides who grew up on these trails. Everest, Annapurna, Langtang and Mustang.',
        },
        _status: 'published',
      },
    })

    await payload.update({
      collection: 'pages',
      id: home.id,
      locale: 'de',
      data: {
        title: 'Startseite',
        // `home` is the reserved slug the /[locale] route looks for — it is deliberately not
        // translated, so the homepage lives at /, /de and /fr rather than /de/startseite.
        slug: 'home',
        blocks: homeBlocks('de'),
        meta: {
          title: 'Hike Globally — Trekking und Expeditionen im Himalaja',
          description:
            'Kleingruppen-Trekkings und Expeditionen in Nepal, geführt von Guides, die auf diesen Wegen aufgewachsen sind.',
        },
      },
    })

    await payload.update({
      collection: 'pages',
      id: home.id,
      locale: 'fr',
      data: {
        title: 'Accueil',
        slug: 'home',
        blocks: homeBlocks('fr'),
        meta: {
          title: 'Hike Globally — treks et expéditions dans l’Himalaya',
          description:
            'Treks et expéditions en petits groupes au Népal, guidés par des guides qui ont grandi sur ces sentiers.',
        },
      },
    })

    console.log('  ✓ Created the homepage (en/de/fr)')
  } else {
    console.log('  • Homepage already exists')
  }

  const existingAbout = await payload.find({
    collection: 'pages',
    locale: 'en',
    where: { slug: { equals: 'about' } },
    limit: 1,
  })

  if (existingAbout.docs.length === 0) {
    const about = await payload.create({
      collection: 'pages',
      locale: 'en',
      data: {
        title: 'About us',
        slug: 'about',
        blocks: aboutBlocks('en'),
        meta: {
          title: 'About Hike Globally',
          description: 'Who we are, who carries your bag, and why we do not resell our trips.',
        },
        _status: 'published',
      },
    })

    await payload.update({
      collection: 'pages',
      id: about.id,
      locale: 'de',
      data: { title: 'Über uns', blocks: aboutBlocks('de'), meta: { title: 'Über Hike Globally' } },
    })

    await payload.update({
      collection: 'pages',
      id: about.id,
      locale: 'fr',
      data: { title: 'À propos', blocks: aboutBlocks('fr'), meta: { title: 'À propos de Hike Globally' } },
    })

    console.log('  ✓ Created the about page (en/de/fr)')
  } else {
    console.log('  • About page already exists')
  }

  /* ---------- globals ---------- */
  await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    data: {
      announcement: 'Spring 2026 departures are open — early-bird pricing until 31 December.',
      navItems: [
        { link: { label: 'Trips', type: 'custom', url: '/trips' } },
        { link: { label: 'Destinations', type: 'custom', url: '/destinations' } },
        { link: { label: 'Journal', type: 'custom', url: '/blog' } },
        { link: { label: 'About', type: 'custom', url: '/about' } },
      ],
      actions: [{ link: { label: 'Plan your trip', type: 'custom', url: '/inquiry' } }],
    },
  })

  await payload.updateGlobal({
    slug: 'header',
    locale: 'de',
    data: {
      announcement: 'Frühjahr 2026 ist buchbar — Frühbucherpreise bis 31. Dezember.',
      navItems: [
        { link: { label: 'Reisen', type: 'custom', url: '/trips' } },
        { link: { label: 'Regionen', type: 'custom', url: '/destinations' } },
        { link: { label: 'Journal', type: 'custom', url: '/blog' } },
        { link: { label: 'Über uns', type: 'custom', url: '/about' } },
      ],
      actions: [{ link: { label: 'Reise planen', type: 'custom', url: '/inquiry' } }],
    },
  })

  await payload.updateGlobal({
    slug: 'header',
    locale: 'fr',
    data: {
      announcement: 'Départs printemps 2026 ouverts — tarif préférentiel jusqu’au 31 décembre.',
      navItems: [
        { link: { label: 'Voyages', type: 'custom', url: '/trips' } },
        { link: { label: 'Régions', type: 'custom', url: '/destinations' } },
        { link: { label: 'Journal', type: 'custom', url: '/blog' } },
        { link: { label: 'À propos', type: 'custom', url: '/about' } },
      ],
      actions: [{ link: { label: 'Planifier mon voyage', type: 'custom', url: '/inquiry' } }],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    locale: 'en',
    data: {
      introduction:
        'A Kathmandu- and Pokhara-based trekking operator. Fourteen years, thirty people, one country we know properly.',
      columns: [
        {
          heading: 'Trips',
          links: [
            { link: { label: 'All trips', type: 'custom', url: '/trips' } },
            { link: { label: 'Everest region', type: 'custom', url: '/destinations/khumbu-everest' } },
            { link: { label: 'Annapurna region', type: 'custom', url: '/destinations/annapurna' } },
            { link: { label: 'Plan your trip', type: 'custom', url: '/inquiry' } },
          ],
        },
        {
          heading: 'Company',
          links: [
            { link: { label: 'About us', type: 'custom', url: '/about' } },
            { link: { label: 'Journal', type: 'custom', url: '/blog' } },
            { link: { label: 'Contact', type: 'custom', url: '/inquiry' } },
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
    slug: 'footer',
    locale: 'de',
    data: {
      introduction:
        'Trekking-Veranstalter mit Sitz in Kathmandu und Pokhara. Vierzehn Jahre, dreißig Menschen, ein Land, das wir wirklich kennen.',
      columns: [
        {
          heading: 'Reisen',
          links: [
            { link: { label: 'Alle Reisen', type: 'custom', url: '/trips' } },
            { link: { label: 'Everest-Region', type: 'custom', url: '/destinations/khumbu-everest' } },
            { link: { label: 'Annapurna-Region', type: 'custom', url: '/destinations/annapurna' } },
            { link: { label: 'Reise planen', type: 'custom', url: '/inquiry' } },
          ],
        },
        {
          heading: 'Unternehmen',
          links: [
            { link: { label: 'Über uns', type: 'custom', url: '/about' } },
            { link: { label: 'Journal', type: 'custom', url: '/blog' } },
            { link: { label: 'Kontakt', type: 'custom', url: '/inquiry' } },
          ],
        },
      ],
      legalLinks: [
        { link: { label: 'Datenschutz', type: 'custom', url: '/privacy' } },
        { link: { label: 'AGB', type: 'custom', url: '/terms' } },
      ],
      copyright: '© {year} Hike Globally. Alle Rechte vorbehalten.',
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    locale: 'fr',
    data: {
      introduction:
        'Opérateur de trekking basé à Katmandou et Pokhara. Quatorze ans, trente personnes, un pays que nous connaissons vraiment.',
      columns: [
        {
          heading: 'Voyages',
          links: [
            { link: { label: 'Tous les voyages', type: 'custom', url: '/trips' } },
            { link: { label: 'Région de l’Everest', type: 'custom', url: '/destinations/khumbu-everest' } },
            { link: { label: 'Région des Annapurna', type: 'custom', url: '/destinations/annapurna' } },
            { link: { label: 'Planifier mon voyage', type: 'custom', url: '/inquiry' } },
          ],
        },
        {
          heading: 'Entreprise',
          links: [
            { link: { label: 'À propos', type: 'custom', url: '/about' } },
            { link: { label: 'Journal', type: 'custom', url: '/blog' } },
            { link: { label: 'Contact', type: 'custom', url: '/inquiry' } },
          ],
        },
      ],
      legalLinks: [
        { link: { label: 'Confidentialité', type: 'custom', url: '/privacy' } },
        { link: { label: 'Conditions', type: 'custom', url: '/terms' } },
      ],
      copyright: '© {year} Hike Globally. Tous droits réservés.',
    },
  })

  await payload.updateGlobal({
    slug: 'settings',
    locale: 'en',
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
        { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
        { platform: 'youtube', url: 'https://youtube.com/@hikeglobally' },
      ],
      defaultOgImage: imageAt(0),
    },
  })

  // Tagline, address and the response-time promise are localized too — everything an editor can
  // see in the CMS is translatable, so the German and French sites never slip into English.
  await payload.updateGlobal({
    slug: 'settings',
    locale: 'de',
    data: {
      tagline: 'Trekking & Expeditionen im Himalaja',
      address: 'Thamel, Kathmandu 44600, Nepal',
      responseTimeNote: 'Wir antworten auf jede Anfrage innerhalb von 24 Stunden.',
    },
  })

  await payload.updateGlobal({
    slug: 'settings',
    locale: 'fr',
    data: {
      tagline: 'Treks & expéditions dans l’Himalaya',
      address: 'Thamel, Katmandou 44600, Népal',
      responseTimeNote: 'Nous répondons à chaque demande sous 24 heures.',
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
