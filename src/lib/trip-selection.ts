/**
 * ============================================================================
 * Which trips a "Featured trips" section shows
 * ============================================================================
 *
 * Pure rules, with no Payload import, so they can be unit-tested (`npm test`) without a database.
 * The data layer (`src/lib/data.ts`) does the reading, this file decides what to do with it, and
 * the block component lays the result out.
 *
 * THE BUG THESE RULES FIX: the homepage section used to be built from featured trips *only*, and a
 * block with an empty list renders `null`. An operator who published trips but never ticked the
 * "Featured" checkbox therefore lost the entire section — no heading, no "View all trips" link, no
 * error anywhere — which reads as a broken CMS rather than as a content decision. Destinations never
 * behaved that way (`getDestinationSlider` returns every published one, featured first), so the
 * symptom looked like "only trips went missing".
 *
 * The fallback is deliberately bounded to *published trips of the same collection*: the section can
 * change which trips it shows, but it can never invent a trip, and it still hides itself on a site
 * that has nothing to show.
 */

/**
 * Is a `trips` relationship entry usable on a card?
 *
 * Payload hands a relationship back as a populated document, but it can also arrive as a bare id
 * (a depth-0 read, or a related document that has since been deleted), and a trip without a hero
 * image has nothing to draw — such a pick must not be counted as a rendered result, or the block
 * would render an image-less card and never reach the fallback below.
 *
 * `unknown` on purpose: relationship values are `Doc | number | null` depending on depth, and the
 * callers below filter heterogeneous arrays before they ever narrow to a `Trip`.
 */
export const isRenderableTripPick = (trip: unknown): boolean => {
  if (typeof trip !== 'object' || trip === null) return false

  const heroImage = (trip as { heroImage?: unknown }).heroImage
  // `heroImage: 12` is an unpopulated upload relationship — an id, but no URL to render from.
  return Boolean(heroImage) && typeof heroImage !== 'number'
}

/**
 * Tier 1 is the automatic list, tier 2 the safety net. Non-empty tiers win in order, so an empty
 * first tier silently promotes the second — and both empty stays empty on purpose: no trips are
 * published, so the section hides itself.
 */
export const pickAutomaticTrips = <T>(automatic: T[], safetyNet: T[]): T[] =>
  automatic.length > 0 ? automatic : safetyNet

/** An editor's manual picks beat anything the site can work out on its own. */
export const resolveTripSection = <T>(manualPicks: T[], automaticTrips: T[]): T[] =>
  manualPicks.length > 0 ? manualPicks : automaticTrips
