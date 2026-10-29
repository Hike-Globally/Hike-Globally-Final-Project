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
  Plus,
} from 'lucide-react'

type DashboardCollection = 'trips' | 'destinations' | 'blog' | 'pages'
type CountCollection = 'trips' | 'destinations' | 'blog' | 'media'

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
        <p className="hg-dashboard__empty">Please sign in to view the Hike Globally workspace.</p>
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

  const [tripCount, destinationCount, storyCount, mediaCount, trips, destinations, stories, pages] =
    await Promise.all([
      count('trips'),
      count('destinations'),
      count('blog'),
      count('media'),
      recentFor('trips'),
      recentFor('destinations'),
      recentFor('blog'),
      recentFor('pages'),
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

  const metrics = [
    {
      label: 'Expeditions',
      value: tripCount,
      detail: 'Curated journeys',
      href: '/admin/collections/trips',
      icon: Mountain,
      tone: 'evergreen',
    },
    {
      label: 'Destinations',
      value: destinationCount,
      detail: 'Places worth going',
      href: '/admin/collections/destinations',
      icon: MapPin,
      tone: 'clay',
    },
    {
      label: 'Field notes',
      value: storyCount,
      detail: 'Stories from the trail',
      href: '/admin/collections/blog',
      icon: BookOpen,
      tone: 'blue',
    },
    {
      label: 'Media assets',
      value: mediaCount,
      detail: 'Images and video',
      href: '/admin/collections/media',
      icon: Images,
      tone: 'gold',
    },
  ]

  const actions = [
    {
      label: 'Plan an expedition',
      detail: 'Create a new itinerary',
      href: '/admin/collections/trips/create',
      icon: Mountain,
      tone: 'evergreen',
    },
    {
      label: 'Write a field note',
      detail: 'Share a story or guide',
      href: '/admin/collections/blog/create',
      icon: BookOpen,
      tone: 'clay',
    },
    {
      label: 'Add a destination',
      detail: 'Open a new place to explore',
      href: '/admin/collections/destinations/create',
      icon: Compass,
      tone: 'blue',
    },
  ]

  return (
    <main className="hg-dashboard">
      <section className="hg-dashboard__hero" aria-labelledby="hg-dashboard-title">
        <div className="hg-dashboard__hero-topline">
          <span className="hg-dashboard__eyebrow">
            <span className="hg-dashboard__live-dot" /> Hike Globally · Operations desk
          </span>
          <span className="hg-dashboard__date">{today}</span>
        </div>

        <div className="hg-dashboard__hero-content">
          <div className="hg-dashboard__hero-copy">
            <p className="hg-dashboard__hero-kicker">A good day to go further</p>
            <h1 id="hg-dashboard-title">
              {greeting}, {firstName}.
              <br />
              <span>Make room for the extraordinary.</span>
            </h1>
            <p className="hg-dashboard__hero-description">
              Your workspace for shaping remarkable journeys across the Himalaya.
            </p>
          </div>
          <Link className="hg-dashboard__primary-action" href="/admin/collections/trips/create">
            <Plus aria-hidden="true" size={17} strokeWidth={2.2} />
            Create an expedition
          </Link>
        </div>

        <div className="hg-dashboard__hero-footer">
          <span>
            <Mountain aria-hidden="true" size={15} strokeWidth={1.8} />
            The trail begins with a story.
          </span>
          <Link href="/" target="_blank" rel="noreferrer">
            Preview the live site
            <ArrowUpRight aria-hidden="true" size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </section>

      <section className="hg-dashboard__metrics" aria-label="Content overview">
        {metrics.map(({ label, value, detail, href, icon: Icon, tone }) => (
          <Link className="hg-dashboard__metric" href={href} key={label}>
            <span className={`hg-dashboard__metric-icon hg-dashboard__metric-icon--${tone}`}>
              <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <span className="hg-dashboard__metric-arrow">
              <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
            </span>
            <span className="hg-dashboard__metric-value">
              {value === null ? '—' : value.toLocaleString('en')}
            </span>
            <span className="hg-dashboard__metric-label">{label}</span>
            <span className="hg-dashboard__metric-detail">{detail}</span>
          </Link>
        ))}
      </section>

      <section className="hg-dashboard__section" aria-labelledby="hg-dashboard-actions-title">
        <div className="hg-dashboard__section-heading">
          <div>
            <p className="hg-dashboard__section-kicker">Move the work forward</p>
            <h2 id="hg-dashboard-actions-title">Create something meaningful</h2>
          </div>
          <Link className="hg-dashboard__text-link" href="/admin/collections/pages">
            Browse all content
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </Link>
        </div>

        <div className="hg-dashboard__actions">
          {actions.map(({ label, detail, href, icon: Icon, tone }) => (
            <Link className="hg-dashboard__action-card" href={href} key={label}>
              <span className={`hg-dashboard__action-icon hg-dashboard__action-icon--${tone}`}>
                <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
              </span>
              <span className="hg-dashboard__action-copy">
                <strong>{label}</strong>
                <span>{detail}</span>
              </span>
              <span className="hg-dashboard__action-arrow">
                <ArrowUpRight aria-hidden="true" size={17} strokeWidth={1.8} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="hg-dashboard__lower-grid">
        <section className="hg-dashboard__panel" aria-labelledby="hg-dashboard-recent-title">
          <div className="hg-dashboard__panel-heading">
            <div>
              <p className="hg-dashboard__section-kicker">A living library</p>
              <h2 id="hg-dashboard-recent-title">Recently updated</h2>
            </div>
            <Link
              className="hg-dashboard__icon-link"
              href="/admin/collections/trips"
              aria-label="Browse expeditions"
            >
              <ArrowRight aria-hidden="true" size={17} strokeWidth={1.8} />
            </Link>
          </div>

          {activity.length ? (
            <ul className="hg-dashboard__activity-list">
              {activity.map((item) => (
                <li key={`${item.kind}-${item.href}`}>
                  <Link className="hg-dashboard__activity-link" href={item.href}>
                    <span className="hg-dashboard__activity-marker" aria-hidden="true" />
                    <span className="hg-dashboard__activity-copy">
                      <strong>{item.title}</strong>
                      <span>
                        {item.kind} <span aria-hidden="true">·</span> {formatDate(item.updatedAt)}
                      </span>
                    </span>
                    <span className={`hg-dashboard__status hg-dashboard__status--${item.status}`}>
                      {item.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="hg-dashboard__activity-empty">
              <Clock aria-hidden="true" size={21} strokeWidth={1.7} />
              <p>Your latest edits will appear here.</p>
              <Link href="/admin/collections/pages/create">Create your first page</Link>
            </div>
          )}
        </section>

        <aside className="hg-dashboard__site-card" aria-labelledby="hg-dashboard-site-title">
          <span className="hg-dashboard__site-mark">
            <Compass aria-hidden="true" size={21} strokeWidth={1.7} />
          </span>
          <p className="hg-dashboard__section-kicker">Out in the world</p>
          <h2 id="hg-dashboard-site-title">See your work on the mountain.</h2>
          <p className="hg-dashboard__site-description">
            Preview the public experience and make sure every detail feels right.
          </p>
          <Link
            className="hg-dashboard__site-link"
            href="/"
            prefetch={false}
            target="_blank"
            rel="noreferrer"
          >
            Open website
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </Link>
          <div className="hg-dashboard__site-footer">
            <Images aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>Images and video, together in your media library.</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
