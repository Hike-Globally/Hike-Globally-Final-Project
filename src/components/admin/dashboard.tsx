import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Clock,
  Compass,
  Images,
  MapPin,
  Mountain,
  Newspaper,
  Plus,
} from 'lucide-react'

type DashboardCollection = 'trips' | 'destinations' | 'blog' | 'pages' | 'news'
type CountCollection = 'trips' | 'destinations' | 'blog' | 'media' | 'news'

type ActivityItem = {
  title: string
  kind: string
  href: string
  updatedAt: string
  status: 'published' | 'draft'
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

export default async function AdminDashboard({ initPageResult, user }: AdminViewServerProps) {
  const payload = initPageResult.req.payload
  const principal = initPageResult.req.user

  if (!principal) {
    return (
      <main className="hg-dashboard">
        <p className="hg-empty">Please sign in to view the Hike Globally workspace.</p>
      </main>
    )
  }

  const count = async (collection: CountCollection): Promise<number | null> => {
    try {
      const result = await payload.count({
        collection,
        overrideAccess: false,
        user: principal,
      })
      return result.totalDocs
    } catch {
      return null
    }
  }

  const recentOptions = {
    depth: 0 as const,
    limit: 3,
    locale: 'en' as const,
    overrideAccess: false as const,
    sort: '-updatedAt' as const,
    user: principal,
  }

  const recentFor = async (collection: DashboardCollection) => {
    try {
      return await payload.find({ collection, ...recentOptions })
    } catch {
      return null
    }
  }

  const [
    tripCount,
    destinationCount,
    storyCount,
    mediaCount,
    newsCount,
    trips,
    destinations,
    stories,
    pages,
    news,
  ] = await Promise.all([
    count('trips'),
    count('destinations'),
    count('blog'),
    count('media'),
    count('news'),
    recentFor('trips'),
    recentFor('destinations'),
    recentFor('blog'),
    recentFor('pages'),
    recentFor('news'),
  ])

  const activity: ActivityItem[] = [
    ...(trips?.docs ?? []).map((doc) => ({
      title: 'title' in doc && typeof doc.title === 'string' ? doc.title : 'Untitled expedition',
      kind: 'Expedition',
      href: `/admin/collections/trips/${doc.id}`,
      updatedAt: doc.updatedAt,
      status: doc._status === 'published' ? ('published' as const) : ('draft' as const),
    })),
    ...(destinations?.docs ?? []).map((doc) => ({
      title: 'name' in doc && typeof doc.name === 'string' ? doc.name : 'Untitled destination',
      kind: 'Destination',
      href: `/admin/collections/destinations/${doc.id}`,
      updatedAt: doc.updatedAt,
      status: doc._status === 'published' ? ('published' as const) : ('draft' as const),
    })),
    ...(stories?.docs ?? []).map((doc) => ({
      title: 'title' in doc && typeof doc.title === 'string' ? doc.title : 'Untitled field note',
      kind: 'Field note',
      href: `/admin/collections/blog/${doc.id}`,
      updatedAt: doc.updatedAt,
      status: doc._status === 'published' ? ('published' as const) : ('draft' as const),
    })),
    ...(news?.docs ?? []).map((doc) => ({
      title: 'title' in doc && typeof doc.title === 'string' ? doc.title : 'Untitled article',
      kind: 'News',
      href: `/admin/collections/news/${doc.id}`,
      updatedAt: doc.updatedAt,
      status: doc._status === 'published' ? ('published' as const) : ('draft' as const),
    })),
    ...(pages?.docs ?? []).map((doc) => ({
      title: 'title' in doc && typeof doc.title === 'string' ? doc.title : 'Untitled page',
      kind: 'Page',
      href: `/admin/collections/pages/${doc.id}`,
      updatedAt: doc.updatedAt,
      status: doc._status === 'published' ? ('published' as const) : ('draft' as const),
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const displayName = typeof user?.name === 'string' ? user.name.trim().split(/\s+/)[0] : ''
  const firstName = displayName || 'there'
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)

  // Every statistic card shares one structure: label, value, supporting line.
  const metrics = [
    {
      label: 'Expeditions',
      value: tripCount,
      detail: 'Curated journeys',
      href: '/admin/collections/trips',
      icon: Mountain,
    },
    {
      label: 'Destinations',
      value: destinationCount,
      detail: 'Places worth going',
      href: '/admin/collections/destinations',
      icon: MapPin,
    },
    {
      label: 'Field notes',
      value: storyCount,
      detail: 'Stories from the trail',
      href: '/admin/collections/blog',
      icon: BookOpen,
    },
    {
      label: 'News',
      value: newsCount,
      detail: 'Dispatches & updates',
      href: '/admin/collections/news',
      icon: Newspaper,
    },
    {
      label: 'Media assets',
      value: mediaCount,
      detail: 'Images and video',
      href: '/admin/collections/media',
      icon: Images,
    },
  ]

  const actions = [
    {
      label: 'Plan an expedition',
      detail: 'Create a new itinerary',
      href: '/admin/collections/trips/create',
      icon: Mountain,
    },
    {
      label: 'Write a field note',
      detail: 'Share a story or guide',
      href: '/admin/collections/blog/create',
      icon: BookOpen,
    },
    {
      label: 'Publish a news article',
      detail: 'Share a dispatch or update',
      href: '/admin/collections/news/create',
      icon: Newspaper,
    },
    {
      label: 'Add a destination',
      detail: 'Open a new place to explore',
      href: '/admin/collections/destinations/create',
      icon: Compass,
    },
  ]

  return (
    <main className="hg-dashboard">
      <header className="hg-page-header">
        <div className="hg-page-header__copy">
          <p className="hg-page-header__eyebrow">
            {today} · Hike Globally operations desk
          </p>
          <h1>
            {greeting}, {firstName}.
          </h1>
          <p className="hg-page-header__subtitle">
            Make room for the extraordinary — your workspace for shaping remarkable journeys across
            the Himalaya.
          </p>
        </div>

        <div className="hg-page-header__actions">
          <Link className="btn btn--style-secondary" href="/" target="_blank" rel="noreferrer">
            <ArrowUpRight aria-hidden="true" />
            Preview the live site
          </Link>
          <Link className="btn btn--style-primary" href="/admin/collections/trips/create">
            <Plus aria-hidden="true" />
            Create an expedition
          </Link>
        </div>
      </header>

      <section className="hg-stat-grid" aria-label="Content overview">
        {metrics.map(({ label, value, detail, href, icon: Icon }) => (
          <Link className="hg-stat" href={href} key={label}>
            <span className="hg-stat__label">{label}</span>
            <span className="hg-stat__value">{value === null ? '—' : value.toLocaleString('en')}</span>
            <span className="hg-stat__meta">
              <Icon aria-hidden="true" size={14} strokeWidth={1.75} />
              {detail}
            </span>
          </Link>
        ))}
      </section>

      <div className="hg-two-column">
        <section className="hg-panel" aria-labelledby="hg-dashboard-recent-title">
          <div className="hg-panel__header">
            <div>
              <h2 className="hg-panel__title" id="hg-dashboard-recent-title">
                Recently updated
              </h2>
              <p className="hg-panel__subtitle">The last five documents edited in this workspace.</p>
            </div>
            <Link className="btn btn--style-secondary btn--size-small" href="/admin/collections/pages">
              Browse all content
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>

          {activity.length ? (
            <ul className="hg-list">
              {activity.map((item) => (
                <li key={`${item.kind}-${item.href}`}>
                  <Link className="hg-list__item" href={item.href}>
                    <span className="hg-list__main">
                      <span className="hg-list__title">{item.title}</span>
                      <span className="hg-list__meta">
                        {item.kind} <span aria-hidden="true">·</span> {formatDate(item.updatedAt)}
                      </span>
                    </span>
                    <span className={`hg-badge hg-badge--${item.status}`}>{item.status}</span>
                    <ArrowRight aria-hidden="true" className="hg-list__cue" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="hg-empty">
              <Clock aria-hidden="true" />
              <p>Your latest edits will appear here.</p>
              <Link className="btn btn--style-secondary btn--size-small" href="/admin/collections/pages/create">
                Create your first page
              </Link>
            </div>
          )}
        </section>

        <div className="hg-stack">
          <section className="hg-panel" aria-labelledby="hg-dashboard-actions-title">
            <div className="hg-panel__header">
              <div>
                <h2 className="hg-panel__title" id="hg-dashboard-actions-title">
                  Create something meaningful
                </h2>
                <p className="hg-panel__subtitle">Move the work forward.</p>
              </div>
            </div>

            <div className="hg-quick-actions">
              {actions.map(({ label, detail, href, icon: Icon }) => (
                <Link className="hg-quick-action" href={href} key={label}>
                  <span className="hg-quick-action__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="hg-quick-action__copy">
                    <strong>{label}</strong>
                    <span>{detail}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="hg-quick-action__cue" />
                </Link>
              ))}
            </div>
          </section>

          <section className="hg-panel" aria-labelledby="hg-dashboard-site-title">
            <div className="hg-panel__header">
              <div>
                <h2 className="hg-panel__title" id="hg-dashboard-site-title">
                  See your work on the mountain.
                </h2>
                <p className="hg-panel__subtitle">
                  Preview the public experience and make sure every detail feels right.
                </p>
              </div>
            </div>

            <div className="hg-quick-actions">
              <Link className="hg-quick-action" href="/" prefetch={false} target="_blank" rel="noreferrer">
                <span className="hg-quick-action__icon">
                  <Compass aria-hidden="true" />
                </span>
                <span className="hg-quick-action__copy">
                  <strong>Open website</strong>
                  <span>The trail begins with a story.</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="hg-quick-action__cue" />
              </Link>
            </div>

            <div className="hg-panel__footer">
              <span>Images and video, together in your media library.</span>
              <Link className="btn btn--style-secondary btn--size-small" href="/admin/collections/media">
                <Images aria-hidden="true" />
                Media library
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
