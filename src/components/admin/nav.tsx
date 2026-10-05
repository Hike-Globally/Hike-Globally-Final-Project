import { getTranslation } from '@payloadcms/translations'
import { formatAdminURL } from 'payload/shared'
import type { PayloadRequest, ServerProps } from 'payload'
import React from 'react'

import AdminNavRail, {
  type AdminNavAccount,
  type AdminNavItem,
  type AdminNavSection,
} from './nav-rail'
import type { RailIconName } from './rail-icons'

/**
 * The admin navigation rail — a bespoke replacement for Payload's `DefaultNav`.
 *
 * Registered as `admin.components.Nav` in `payload.config.ts`. Payload still decides *what* the
 * signed-in user may see (`visibleEntities` + `permissions`); this component decides how that is
 * organised: a curated order that leads with the work (expeditions first, then the places and the
 * journal), followed by the media library, the team and the site-wide settings. Collections added
 * later still appear — they fall in with their own kind and pick up a sensible default icon — so the
 * rail degrades gracefully instead of hiding anything.
 *
 * The shell Payload's layout depends on is rendered by `AdminNavRail` (the `aside.nav` element with
 * its state classes and the `nav__scroll` ref), so this file only turns config into the rail's data.
 */

type AdminNavProps = { req?: PayloadRequest } & ServerProps

type SectionId = 'content' | 'library' | 'site' | 'team'

type Placement = {
  icon: RailIconName
  order: number
  section: SectionId
}

type OrderedNavItem = AdminNavItem & { order: number }

/** Curated placement for the entities this workspace ships with. */
const PLACEMENTS: Record<string, Placement> = {
  'collections:trips': { icon: 'trips', order: 10, section: 'content' },
  'collections:destinations': { icon: 'destinations', order: 20, section: 'content' },
  'collections:blog': { icon: 'blog', order: 30, section: 'content' },
  'collections:pages': { icon: 'pages', order: 40, section: 'content' },
  'collections:media': { icon: 'media', order: 10, section: 'library' },
  'collections:users': { icon: 'users', order: 10, section: 'team' },
  'globals:header': { icon: 'panel-top', order: 10, section: 'site' },
  'globals:footer': { icon: 'panel-bottom', order: 20, section: 'site' },
  'globals:settings': { icon: 'settings', order: 30, section: 'site' },
}

const SECTION_ORDER: SectionId[] = ['content', 'library', 'team', 'site']

const SECTION_LABELS: Record<SectionId, string> = {
  content: 'Content',
  library: 'Library',
  site: 'Site',
  team: 'Team',
}

const COLLECTION_FALLBACK: Placement = { icon: 'collection', order: 100, section: 'content' }
const GLOBAL_FALLBACK: Placement = { icon: 'settings', order: 100, section: 'site' }

/** Mirrors Payload's own label resolution, including function labels. */
const resolveLabel = (label: unknown, i18n: ServerProps['i18n']): string => {
  if (typeof label === 'function') {
    return (label as (args: { i18n: ServerProps['i18n']; t: ServerProps['i18n']['t'] }) => string)({
      i18n,
      t: i18n.t,
    })
  }
  if (typeof label === 'string') return label
  if (label && typeof label === 'object') {
    return getTranslation(label as Record<string, string>, i18n)
  }
  return ''
}

export default function AdminNav({
  i18n,
  locale,
  payload,
  permissions,
  user,
  visibleEntities,
}: AdminNavProps) {
  if (!payload?.config) return null

  const { admin, routes } = payload.config
  const adminRoute = routes.admin || '/admin'

  const canRead = (type: 'collections' | 'globals', slug: string): boolean => {
    const permission = (
      permissions as Record<string, Record<string, { read?: boolean }> | undefined> | undefined
    )?.[type]?.[slug]
    // No permission entry at all means Payload has not scoped this entity; leave it visible.
    return permission?.read !== false
  }

  const buckets: Record<SectionId, OrderedNavItem[]> = {
    content: [],
    library: [],
    site: [],
    team: [],
  }

  const collectionSlugs = visibleEntities?.collections ?? payload.config.collections.map((c) => c.slug)
  const globalSlugs = visibleEntities?.globals ?? payload.config.globals.map((g) => g.slug)

  for (const slug of collectionSlugs) {
    const collection = payload.config.collections.find((entry) => entry.slug === slug)
    if (!collection || collection.admin?.group === false || !canRead('collections', slug)) continue

    const placement = PLACEMENTS[`collections:${slug}`] ?? COLLECTION_FALLBACK
    buckets[placement.section].push({
      href: formatAdminURL({ adminRoute, path: `/collections/${slug}` }),
      icon: placement.icon,
      id: `collections:${slug}`,
      label: resolveLabel(collection.labels?.plural, i18n) || collection.slug,
      order: placement.order,
    })
  }

  for (const slug of globalSlugs) {
    const global = payload.config.globals.find((entry) => entry.slug === slug)
    if (!global || global.admin?.group === false || !canRead('globals', slug)) continue

    const placement = PLACEMENTS[`globals:${slug}`] ?? GLOBAL_FALLBACK
    buckets[placement.section].push({
      href: formatAdminURL({ adminRoute, path: `/globals/${slug}` }),
      icon: placement.icon,
      id: `globals:${slug}`,
      label: resolveLabel(global.label, i18n) || global.slug,
      order: placement.order,
    })
  }

  const sections: AdminNavSection[] = [
    {
      id: 'workspace',
      items: [
        {
          exact: true,
          href: adminRoute,
          icon: 'dashboard',
          id: 'dashboard',
          label: i18n.t('general:dashboard'),
        },
      ],
    },
    ...SECTION_ORDER.map((id) => ({
      id,
      items: buckets[id]
        .sort((a, b) => a.order - b.order)
        .map(({ order: _order, ...item }) => item),
      label: SECTION_LABELS[id],
    })).filter((section) => section.items.length > 0),
  ]

  const rawUser = (user ?? null) as unknown as {
    email?: unknown
    name?: unknown
    roles?: unknown
  } | null

  const account: AdminNavAccount | null = rawUser
    ? {
        email: typeof rawUser.email === 'string' ? rawUser.email : undefined,
        name: typeof rawUser.name === 'string' ? rawUser.name : undefined,
        roles: Array.isArray(rawUser.roles)
          ? rawUser.roles.filter((role): role is string => typeof role === 'string')
          : undefined,
      }
    : null

  const siteLocale = locale?.code && locale.code.length > 0 ? locale.code : 'en'

  return (
    <AdminNavRail
      account={account}
      accountHref={formatAdminURL({ adminRoute, path: admin.routes.account })}
      dashboardHref={adminRoute}
      liveSiteHref={`/${siteLocale}`}
      sections={sections}
    />
  )
}
