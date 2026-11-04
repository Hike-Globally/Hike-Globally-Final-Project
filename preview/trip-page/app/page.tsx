import type { Metadata } from 'next'

import { TripDetail } from '@/components/views/trip-detail'
import type { Destination, Media, Trip } from '@/payload-types'

/**
 * DESIGN PREVIEW — not part of the deployed site.
 *
 * This route mounts the real `TripDetail` view with a realistic Everest Base
 * Camp trip, so the redesign can be reviewed in a browser without a Postgres
 * database. The production route is `src/app/(frontend)/trips/[slug]/page.tsx`;
 * both render the same component from the same props.
 */

export const metadata: Metadata = {
  title: 'Everest Base Camp Trek · design preview',
  robots: { index: false, follow: false },
}

const image = (id: number, alt: string): Media =>
  ({
    id,
    alt,
    url: `/hero.jpg`,
    width: 1376,
    height: 768,
    mimeType: 'image/jpeg',
  }) as Media

const destination = {
  id: 1,
  name: 'Khumbu & Everest',
  slug: 'khumbu',
} as Destination

/** Minimal Lexical document builder — same shape Payload stores. */
const rich = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      version: 1,
      children: [{ type: 'text', text, version: 1 }],
      direction: null,
      format: '',
      indent: 0,
    })),
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

const days = [
  ['Arrive in Kathmandu', 'Land at Tribhuvan International, meet your guide at the hotel, and spend the evening briefing over momos in Thamel. We check your boots, your layers and your insurance before you fly.'],
  ['Fly to Lukla, trek to Phakding', 'The 35-minute Twin Otter flight lands on one of the world’s shortest runways. From Lukla it is an easy four hours down the Dudh Koshi valley to Phakding, through pine forest and across suspension bridges.'],
  ['Phakding to Namche Bazaar', 'A longer day: two high bridges over the Dudh Koshi, the entrance to Sagarmatha National Park at Monjo, and a steep 600 m climb to Namche. You gain almost 800 m of altitude today, so we walk slowly.'],
  ['Acclimatisation in Namche', 'A rest day is not a day off. We climb to the Everest View Hotel for the first look at Everest, Lhotse and Ama Dablam, then drop back to Namche for the market and a bakery lunch.'],
  ['Namche to Tengboche', 'The trail contours high above the valley with Everest ahead, then descends to Phunki Tenga before climbing to Tengboche and its famous monastery.'],
  ['Tengboche to Dingboche', 'Through rhododendron forest and past the teahouses of Deboche and Pangboche, then across the Imja Khola into the treeless upper valley.'],
  ['Second acclimatisation in Dingboche', 'Another acclimatisation day: a short climb to Nangkartshang ridge for views across to Makalu, then back down for lunch and an afternoon of rest.'],
  ['Dingboche to Lobuche', 'Past the Thukla memorials, where the cairns remember climbers lost on Everest, and on to Lobuche at 4,940 m. The air is thin now — short steps, steady breathing.'],
  ['Lobuche to Gorakshep, then Base Camp', 'A long day to Gorakshep, then the two-hour walk onto the Khumbu Glacier and into Everest Base Camp itself, among the expedition tents.'],
  ['Kala Patthar sunrise, back to Pheriche', 'Before dawn we climb the 300 m to Kala Patthar (5,545 m) for the closest view of the Everest summit most trekkers ever get. Then we descend, and keep descending.'],
  ['Pheriche to Namche Bazaar', 'Retracing the valley now in reverse, with the ease of acclimatised lungs. Tea, dal bhat, and an early night.'],
  ['Namche to Lukla', 'The last full walking day, back through Monjo and Phakding to Lukla.'],
  ['Fly to Kathmandu', 'Morning flight back to Kathmandu. Afternoon free; dinner with the team in the evening.'],
  ['Depart Kathmandu', 'Transfer to the airport for your flight home.'],
] as const

const trip = {
  id: 1,
  title: 'Everest Base Camp Trek',
  slug: 'everest-base-camp-trek',
  summary:
    'Fourteen days from Kathmandu to the foot of the highest mountain on earth. Two acclimatisation stops, teahouse nights, a sunrise on Kala Patthar — and a local guide who has walked it a hundred times.',
  heroImage: image(1, 'A trekker on the trail beneath snow-covered Himalayan peaks at sunrise'),
  keyTakeaways: [
    { id: 'kt1', text: 'Stand at **Everest Base Camp (5,364 m)** beside the expedition tents on the Khumbu Glacier' },
    { id: 'kt2', text: 'Watch sunrise on the summit from **Kala Patthar, 5,545 m** — the closest view most trekkers get' },
    { id: 'kt3', text: 'Two acclimatisation days built in at Namche Bazaar and Dingboche, not squeezed out' },
    { id: 'kt4', text: 'Sleep in family-run teahouses and eat dal bhat with the people who live there' },
    { id: 'kt5', text: 'Domestic flights, permits, taxes and teahouse accommodation all included' },
  ],
  description: rich([
    'The Everest Base Camp trek is the most famous walk in the world, and it still earns the reputation. Over fourteen days you climb from the terraces of the Dudh Koshi valley to the Khumbu Glacier, passing through Namche Bazaar, Tengboche and Dingboche, and finish standing beneath the wall of ice and rock that holds the summit route.',
    'We run this itinerary with two proper acclimatisation days and a slow first three days, because altitude, not fitness, is what ends most Everest treks. Our guides are Sherpa and Tamang from the Khumbu villages you will walk through — they know which teahouse has the best dal bhat, and they know when to say slow down.',
    'Base Camp itself is at 5,364 m in a glacial basin surrounded by Nuptse, Pumori and the Khumbu Icefall. Photographs do not prepare you for the scale of it. That is the point.',
  ]),
  whyChooseThisTrek: rich([
    'We are a small Kathmandu-based team, not a booking platform. Every departure is led by a licensed guide with a minimum of eight Everest seasons, and we keep the group small enough that everyone walks at the pace they need.',
    'We also include the domestic flights and all permits in the published price, so the figure you see is close to the figure you spend.',
  ]),
  whoIsThisTrekFor: rich([
    'This trek is for fit walkers who can manage five to seven hours a day on rough ground, several days in a row, with a daypack. You do not need climbing experience or specialist kit — just broken-in boots, a steady pace and the patience to acclimatise properly.',
    'It suits first-time Himalayan trekkers who want the classic route with a licensed local guide, solo travellers joining a small group, and photographers happy to trade comfort for the light at 5,000 m.',
  ]),
  whoIsThisTrekNotFor: rich([
    'This is not the trek for travellers who want luxury lodges, hot showers every night or a helicopter out at the first sign of tiredness — teahouses are simple, and the nearest road is four days back.',
    'It is also a poor fit for anyone with heart or lung conditions that make altitude risky, for families with children under about ten, or for anyone unwilling to turn around if the guides judge the weather or altitude sickness against them.',
  ]),
  routeMapContent: null,
  destination,
  tripType: 'trekking' as const,
  durationDays: 14,
  durationNights: 13,
  groupSizeMax: 12,
  maxAltitude: 5545,
  difficulty: 'challenging-strenuous' as const,
  bestSeasons: ['spring', 'autumn'] as const,
  priceFrom: 1890,
  priceCurrency: 'USD' as const,
  priceUnit: 'per-person' as const,
  priceNote: 'Based on a group of 4. Single supplement on request.',
  highlights: [
    { id: 'h1', text: 'Namche Bazaar, the Sherpa capital and its Saturday market' },
    { id: 'h2', text: 'Tengboche Monastery, the largest in the Khumbu, below Ama Dablam' },
    { id: 'h3', text: 'The Everest View Hotel, for the first sight of the summit' },
    { id: 'h4', text: 'Khumbu Glacier and the Thukla memorial cairns' },
    { id: 'h5', text: 'Base Camp itself — expedition tents, the Icefall, and Pumori above' },
    { id: 'h6', text: 'Sunrise on Kala Patthar (5,545 m)' },
  ],
  itinerary: days.map(([title, description], index) => ({
    id: `day-${index + 1}`,
    day: index + 1,
    title,
    description,
    accommodation: index === 0 || index === 12 || index === 13 ? 'Hotel in Kathmandu' : 'Teahouse',
    altitude: [1400, 2860, 3440, 3440, 3860, 4410, 4410, 4940, 5170, 4370, 3440, 2860, 1400, 1400][index],
    food: 'included' as const,
  })),
  included: [
    { id: 'i1', item: 'Airport transfers in Kathmandu' },
    { id: 'i2', item: 'Kathmandu–Lukla–Kathmandu domestic flights and airport tax' },
    { id: 'i3', item: 'Three nights hotel in Kathmandu, bed and breakfast' },
    { id: 'i4', item: 'All teahouse accommodation during the trek' },
    { id: 'i5', item: 'Licensed English-speaking trekking guide and porter support' },
    { id: 'i6', item: 'Sagarmatha National Park permit and Khumbu Pasang Lhamu municipality fee' },
    { id: 'i7', item: 'Three meals a day on the trail, with tea' },
    { id: 'i8', item: 'Oximeter checks and a first-aid kit carried by your guide' },
  ],
  notIncluded: [
    { id: 'n1', item: 'International flights to and from Kathmandu' },
    { id: 'n2', item: 'Nepal visa fee (about $50 for 30 days)' },
    { id: 'n3', item: 'Travel and rescue insurance — required' },
    { id: 'n4', item: 'Lunches and dinners in Kathmandu' },
    { id: 'n5', item: 'Hot showers, charging and Wi-Fi on the trail' },
    { id: 'n6', item: 'Tips for guides and porters' },
  ],
  packingList: [
    { id: 'p1', item: 'Insulated down jacket (−15 °C rated)' },
    { id: 'p2', item: 'Waterproof shell jacket and trousers' },
    { id: 'p3', item: 'Fleece or synthetic mid-layer' },
    { id: 'p4', item: 'Two thermal base-layer sets' },
    { id: 'p5', item: 'Broken-in waterproof hiking boots' },
    { id: 'p6', item: 'Four-season sleeping bag (−15 °C)' },
    { id: 'p7', item: 'Trekking poles' },
    { id: 'p8', item: 'Head torch and spare batteries' },
    { id: 'p9', item: 'Sunglasses, SPF 50 and lip balm' },
    { id: 'p10', item: 'Hat, gloves and neck gaiter' },
    { id: 'p11', item: 'Water purification tablets or filter' },
    { id: 'p12', item: 'Personal first-aid kit and blister plasters' },
  ],
  gallery: [
    { id: 'g1', image: image(11, 'Tan-coloured teahouses in the Khumbu valley') },
    { id: 'g2', image: image(12, 'Suspension bridge over the Dudh Koshi river') },
    { id: 'g3', image: image(13, 'Ama Dablam from the trail to Tengboche') },
    { id: 'g4', image: image(14, 'Prayer flags above Namche Bazaar') },
    { id: 'g5', image: image(15, 'Sunrise light on Everest from Kala Patthar') },
    { id: 'g6', image: image(16, 'Porter resting beside the trail') },
    { id: 'g7', image: image(17, 'Khumbu glacier and Nuptse') },
  ],
  departureDates: [
    { id: 'dep1', startDate: '2027-03-12', endDate: '2027-03-25', status: 'limited' as const },
    { id: 'dep2', startDate: '2027-03-26', endDate: '2027-04-08', status: 'guaranteed' as const },
    { id: 'dep3', startDate: '2027-04-09', endDate: '2027-04-22', status: 'available' as const },
    { id: 'dep4', startDate: '2027-04-23', endDate: '2027-05-06', status: 'sold-out' as const },
    { id: 'dep5', startDate: '2027-10-08', endDate: '2027-10-21', status: 'available' as const, price: 1980 },
    { id: 'dep6', startDate: '2027-10-22', endDate: '2027-11-04', status: 'guaranteed' as const },
  ],
  contentSections: [
    {
      id: 'cs1',
      heading: 'How fit do I need to be?',
      content: rich([
        'You need to be able to walk five to seven hours a day, for several days in a row, carrying a small day pack. If you can comfortably do a hilly half-day hike at home, you can train for this trek in eight to twelve weeks.',
        'Altitude is the harder variable. Our itinerary is built around it: two acclimatisation days, short first days, and a guide who will always walk slower than you want to.',
      ]),
    },
    {
      id: 'cs2',
      heading: 'Permits and paperwork',
      content: rich([
        'We arrange the Sagarmatha National Park permit and the Khumbu Pasang Lhamu Rural Municipality fee. Both are included in the price. You need a passport valid for six months, rescue insurance that covers trekking above 5,000 m, and two passport photos.',
      ]),
    },
    {
      id: 'cs3',
      heading: 'Teahouses, food and hot water',
      content: rich([
        'Teahouses are family homes with a dining room and simple twin rooms. Blankets are provided, but we recommend your own sleeping bag. Hot showers and charging cost a few hundred rupees and are usually available below Dingboche.',
        'Dal bhat — rice, lentils and vegetables — is the trail staple, and refills are free. We can cater for vegetarian and gluten-free diets with notice.',
      ]),
    },
  ],
  faqs: [
    { id: 'f1', question: 'Do I need previous trekking experience?', answer: 'No technical experience is needed. This is a long, sustained walk at altitude, not a climb. Most of our trekkers are doing their first multi-day Himalayan trek.' },
    { id: 'f2', question: 'How cold does it get?', answer: 'Nights at Gorakshep sit around −10 °C to −15 °C in spring and autumn. A −15 °C sleeping bag and a good down jacket are the two items people regret leaving home.' },
    { id: 'f3', question: 'Can I hire gear in Kathmandu?', answer: 'Yes. Sleeping bags, down jackets and trekking poles can be rented in Thamel for a few dollars a day. We will take you to a shop we trust on day one.' },
    { id: 'f4', question: 'What happens if I get altitude sickness?', answer: 'Your guide carries an oximeter and checks everyone morning and evening. If symptoms do not settle with rest and hydration, we descend — the decision is the guide’s, and it is not negotiable.' },
    { id: 'f5', question: 'Is there Wi-Fi on the trek?', answer: 'In Namche and Tengboche, yes, for a small fee. Above Dingboche the connection is unreliable. Most trekkers find they do not miss it.' },
  ],
  pageSections: null,
  updatedAt: '2026-11-04T00:00:00.000Z',
  createdAt: '2026-11-04T00:00:00.000Z',
} as unknown as Trip

export default function TripPreviewPage() {
  return (
    <TripDetail
      trip={trip}
      related={[]}
      tripOptions={[{ id: 1, title: 'Everest Base Camp Trek', slug: 'everest-base-camp-trek' }]}
      formEmail="hello@example.com"
      whatsapp="9779851000000"
      phone="+977 985 100 0000"
    />
  )
}
