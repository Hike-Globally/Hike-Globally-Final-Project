import type { CollectionBeforeChangeHook } from 'payload'

import { formatSlug } from '../fields/slug'
import type { User } from '../payload-types'

/**
 * Guarantees every account owns a unique, URL-safe profile slug.
 *
 * `formatSlugHook` (the field's own `beforeValidate`) fills `slug` from the name, but it cannot
 * see the rest of the table — and two editors can share a name. The column is `unique`, so the
 * second save would fail a constraint the admin cannot reason about. This hook runs before the
 * write, looks the candidate up, and appends `-2`, `-3`, … until it is free. Names stay readable
 * (`pemba-sherpa`, `pemba-sherpa-2`) and the live URL of the first account never moves.
 *
 * A slug an editor typed by hand is kept as-is (already normalized by the field hook) unless it
 * really does collide — the point of the field is that a deliberate URL survives.
 *
 * The lookup uses `overrideAccess` deliberately: it is a server-side uniqueness check, not a
 * request for someone else's account, and it must behave identically whoever is saving.
 */
export const ensureUniqueUserSlug: CollectionBeforeChangeHook<User> = async ({
  data,
  originalDoc,
  req,
}) => {
  const name = String(data?.name ?? originalDoc?.name ?? '').trim()
  const typed = String(data?.slug ?? '').trim()
  const base = formatSlug(typed || name)
  if (!base) return data

  const currentId = originalDoc?.id

  const isTaken = async (candidate: string): Promise<boolean> => {
    const result = await req.payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        slug: { equals: candidate },
        // Editing your own profile must not count as a collision with yourself.
        ...(currentId ? { id: { not_equals: currentId } } : {}),
      },
      select: { slug: true },
    })
    return result.totalDocs > 0
  }

  let slug = base
  for (let attempt = 2; attempt <= 50; attempt += 1) {
    if (!(await isTaken(slug))) break
    slug = `${base}-${attempt}`
  }

  return { ...data, slug }
}
