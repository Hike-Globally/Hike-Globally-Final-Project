/**
 * Packing list — grouping, progress and defaults.
 *
 * A trip's packing list is one flat CMS array (`trip.packingList`, each row
 * `{ item }` with an optional `category`). Grouping it here rather than in the React component
 * means the same rules drive the page, the brochure and the tests, and an item saved before the
 * categories existed still lands in a sensible accordion.
 *
 * Three groups, in this order, exactly as the page renders them:
 *
 *   1. Clothing and Footwear
 *   2. Trekking Equipment
 *   3. Personal Items
 *
 * Any other value — a legacy row saved before categories shipped, a category an editor typed by
 * hand — falls into the closest group by keyword, and finally into Trekking Equipment, which is
 * the widest of the three. Nothing is ever dropped from the list.
 */

/** Values stored in the CMS. Stable: the database enum and the page both use these strings. */
export const packingCategories = [
  { value: 'clothing-footwear', label: 'Clothing and Footwear' },
  { value: 'trekking-equipment', label: 'Trekking Equipment' },
  { value: 'personal-items', label: 'Personal Items' },
] as const

export type PackingCategoryValue = (typeof packingCategories)[number]['value']

export const defaultPackingCategory: PackingCategoryValue = 'trekking-equipment'

/** One row of the CMS `packingList` array, narrowed to the fields this module reads. */
export type PackingListRow = {
  id?: string | null
  item?: string | null
  category?: PackingCategoryValue | string | null
}

export type PackingGroup = {
  /** CMS value — used as the accordion item value and the `id` anchor. */
  category: PackingCategoryValue
  /** Display heading, e.g. "Clothing and Footwear". */
  heading: string
  /** Number of `items`, so the collapsed row can state it. */
  count: number
  items: { id?: string | null; item: string }[]
}

const isCategory = (value: unknown): value is PackingCategoryValue =>
  packingCategories.some(({ value: known }) => known === value)

/**
 * Keyword fallback for rows with no (or an unknown) category.
 *
 * Deliberately small and literal: it only has to place a legacy row somewhere reasonable, and a
 * false negative (landing in Trekking Equipment) is harmless. Matched on whole words with an
 * optional plural, so "boots" is footwear but "capacity" is not a cap. `src/migrations/
 * 20261108_120000_trip_packing_categories.ts` back-fills existing rows with the same vocabulary.
 */
type KeywordGroup = { category: PackingCategoryValue; words: readonly string[] }

const keywordGroups: readonly KeywordGroup[] = [
  {
    category: 'clothing-footwear',
    words: [
      'jacket', 'down', 'fleece', 'shirt', 't-shirt', 'tee', 'trouser', 'pant', 'short', 'sock',
      'boot', 'shoe', 'sandal', 'camp shoe', 'glove', 'mitten', 'hat', 'beanie', 'cap', 'scarf',
      'buff', 'layer', 'thermal', 'underwear', 'gaiter', 'sunglass', 'goggle', 'clothing',
      'footwear', 'liner', 'rain shell', 'shell', 'jumper', 'hoodie', 'legging',
    ],
  },
  {
    category: 'personal-items',
    words: [
      'passport', 'visa', 'permit', 'insurance', 'money', 'cash', 'card', 'wallet', 'towel',
      'toiletry', 'toiletries', 'toothbrush', 'toothpaste', 'soap', 'sunscreen', 'sunblock',
      'balm', 'cream', 'medicine', 'medication', 'pill', 'tablet', 'diamox', 'first aid',
      'water purification', 'purification', 'bottle', 'bladder', 'book', 'journal', 'pen',
      'notebook', 'phone', 'charger', 'power bank', 'battery', 'camera', 'headlamp', 'torch',
      'snack', 'bar', 'chocolate', 'electrolyte', 'iodine', 'sanitiser', 'sanitizer', 'mask',
      'earplug', 'sleep mask', 'tissue', 'wipe', 'pad', 'tampon', 'razor', 'brush', 'comb',
      'nail', 'documents',
    ],
  },
  {
    category: 'trekking-equipment',
    words: [
      'backpack', 'pack', 'rucksack', 'duffel', 'duffle', 'daypack', 'sleeping bag', 'mat',
      'mattress', 'tent', 'pole', 'stick', 'trekking', 'harness', 'crampon', 'ice axe', 'rope',
      'carabiner', 'gps', 'map', 'compass', 'spike', 'microspike', 'dry bag', 'rain cover',
      'waterproof', 'thermos', 'flask', 'stove', 'cook', 'gas', 'filter', 'tripod',
    ],
  },
]

/** `boot` → matches "boot" and "boots"; a phrase matches with the plural allowed on the tail. */
const wordPattern = (words: readonly string[]): RegExp => {
  const alternatives = words
    // Escape regex metacharacters, then let runs of spaces match any whitespace.
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ +/g, '\\s+'))
    // Longest first, so "camp shoe" is tried before "shoe".
    .sort((a, b) => b.length - a.length)
  return new RegExp('\\b(?:' + alternatives.join('|') + ')(?:s|es)?\\b', 'i')
}

const compiledGroups = keywordGroups.map(({ category, words }) => ({
  category,
  pattern: wordPattern(words),
}))

/** The best guess for a row with no usable category. */
export const inferPackingCategory = (item: string): PackingCategoryValue => {
  for (const { category, pattern } of compiledGroups) {
    if (pattern.test(item)) return category
  }
  return defaultPackingCategory
}

/**
 * Groups a trip's flat packing list into the three accordions.
 *
 * Groups with no items are omitted, so a trip that only fills in clothing renders one accordion —
 * never three headings with two empty panels. Item order inside a group is the CMS order.
 */
export function groupPackingList(rows: PackingListRow[] | null | undefined): PackingGroup[] {
  const buckets = new Map<PackingCategoryValue, PackingGroup>()

  for (const row of rows ?? []) {
    const item = row?.item?.trim()
    if (!item) continue

    const category = isCategory(row.category) ? row.category : inferPackingCategory(item)
    const existing = buckets.get(category)

    if (existing) {
      existing.items.push({ id: row.id, item })
      existing.count += 1
    } else {
      buckets.set(category, {
        category,
        heading: packingCategories.find(({ value }) => value === category)!.label,
        count: 1,
        items: [{ id: row.id, item }],
      })
    }
  }

  return packingCategories
    .map(({ value }) => buckets.get(value))
    .filter((group): group is PackingGroup => Boolean(group))
}

/**
 * Address of one item inside the local "packed" checklist: the group it renders in plus its
 * position in that group. Stable across reloads for a given trip, and unique even when an editor
 * repeats a line (two "Spare batteries" rows stay two separate checkboxes).
 */
export const packingItemKey = (category: PackingCategoryValue, index: number): string =>
  `${category}:${index}`

/** Totals for the dashboard: how many items, and how many of them are ticked. */
export function packingProgress(
  groups: PackingGroup[],
  packed: ReadonlySet<string>,
): { total: number; done: number; percent: number } {
  let total = 0
  let done = 0

  for (const group of groups) {
    group.items.forEach((_, index) => {
      total += 1
      if (packed.has(packingItemKey(group.category, index))) done += 1
    })
  }

  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}
