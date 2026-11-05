import { BlogDispatchBoard } from './blog-dispatch-board'
import { HOMEPAGE_POST_LIMIT } from './latest-blogs-limits'
import { SectionHeading } from './section-heading'
import { sitePath } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import { getPosts } from '@/lib/data'

import './latest-blogs-section.css'

/**
 * ============================================================================
 * LATEST BLOGS AND STORIES — the homepage journal section.
 * ============================================================================
 * Sits between the destinations slider and "Plan your trip", and is the only
 * homepage section that is not a grid of identical cards: one lead plate plus a
 * numbered index of the stories behind it (see `blog-dispatch-board.tsx`).
 *
 * The heading is the shared `SectionHeading` with `home-section-title`, so it is
 * an `<h2>` rendered in exactly the same display face, size and weight as the
 * destinations headline above it — one type scale, no per-section tuning, and no
 * section shouting in capitals. Every card title underneath it is an `<h3>`, one
 * level down from the section.
 *
 * Content is real CMS content (`getPosts`, newest published first), so a fresh
 * database still renders the section from `defaultPosts` instead of showing a
 * hole in the page.
 *
 * The board is fixed at four stories — one lead plate plus three index rows
 * (see `latest-blogs-limits.ts`). The count is not read from the CMS block's
 * `limit`: a homepage saved with a larger value used to stretch the index into
 * a long, portrait list, and the journal is meant to read as a compact split.
 */

/** `id` of the section heading — the section is labelled by it. */
const HEADING_ID = 'latest-blogs-and-stories'

const HEADING = 'Latest Blogs and Stories'

/* -------------------------------------------------------------------------- */
/* Topographic wash                                                           */
/* -------------------------------------------------------------------------- */
/* A few contour lines behind the section, faded out with a radial mask so they
   read as paper texture in the corner rather than as an illustration. They are
   drawn from summed sine harmonics instead of a traced artwork: the paths are
   generated once at module scope (identical on the server and the client, so
   there is nothing to hydrate), they cost ~4 KB of markup instead of an image
   request, and they scale to a 100" TV without going soft.

   Coordinates are integers and the `L` is written once — SVG repeats the
   previous command for every following coordinate pair. */

const TOPO_WIDTH = 1200
const TOPO_HEIGHT = 640

/** A ridge line: three sine harmonics sampled every 48px — dense enough that a
   1px stroke reads as a curve, sparse enough that ten paths stay under 3 KB of
   markup. */
function ridgePath(baseY: number, amplitude: number, phase: number): string {
  const points: string[] = []

  for (let x = 0; x <= TOPO_WIDTH; x += 48) {
    const t = x / TOPO_WIDTH
    const y =
      baseY +
      Math.sin(t * Math.PI * 2 + phase) * amplitude +
      Math.sin(t * Math.PI * 4.6 + phase * 1.7) * (amplitude * 0.34) +
      Math.sin(t * Math.PI * 1.2 + phase * 0.6) * (amplitude * 0.52)
    points.push(`${x} ${Math.round(y)}`)
  }

  return `M${points.join('L')}`
}

/** A closed contour around a summit — wider than tall, like a real ridge. */
function summitPath(cx: number, cy: number, radius: number, wobble: number, phase: number): string {
  const points: string[] = []
  const steps = 36

  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * Math.PI * 2
    const r =
      radius +
      Math.sin(angle * 3 + phase) * wobble +
      Math.sin(angle * 5 + phase * 1.4) * (wobble * 0.4)
    points.push(
      `${Math.round(cx + Math.cos(angle) * r * 1.45)} ${Math.round(cy + Math.sin(angle) * r)}`,
    )
  }

  return `M${points.join('L')}Z`
}

const TOPO_PATHS: string[] = [
  ridgePath(48, 14, 0.2),
  ridgePath(136, 20, 1.1),
  ridgePath(224, 12, 2.3),
  ridgePath(312, 24, 3.4),
  ridgePath(400, 16, 4.2),
  ridgePath(488, 22, 5.5),
  ridgePath(576, 13, 6.1),
  summitPath(884, 214, 52, 9, 0.4),
  summitPath(884, 214, 96, 14, 1.2),
  summitPath(884, 214, 146, 18, 2.1),
]

function TopographicWash() {
  return (
    <div className="lb-topo" aria-hidden="true">
      <svg
        className="lb-topo-svg"
        viewBox={`0 0 ${TOPO_WIDTH} ${TOPO_HEIGHT}`}
        fill="none"
        focusable="false"
      >
        {TOPO_PATHS.map((path) => (
          <path
            key={path}
            d={path}
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export async function LatestBlogsSection() {
  const dict = dictionary

  // The board's fixed measure: one lead plate plus at most three index rows.
  // Always fetch the full four — a board with a plate and nothing beside it
  // would read as a missing column, and the board skips the index on its own if
  // only one story is published.
  const posts = await getPosts(HOMEPAGE_POST_LIMIT)

  if (posts.length === 0) return null

  return (
    <section
      data-blog-dispatch=""
      /* `bg-mist` gives the journal its own sheet of paper between the white
         destinations slider above and the closing panel below — the one tinted
         band on the page, so the contour wash reads as printing on paper rather
         than as a shape floating over the page background. */
      className="relative bg-mist py-16 md:py-24"
      aria-labelledby={HEADING_ID}
    >
      <TopographicWash />

      <div className="container-content relative">
        <SectionHeading
          titleId={HEADING_ID}
          title={HEADING}
          description={dict.blog.listingSubtitle}
          action={{ href: sitePath('/blog'), label: dict.common.viewAll }}
          titleClassName="home-section-title"
          descriptionClassName="home-section-intro"
        />

        <BlogDispatchBoard posts={posts} />
      </div>
    </section>
  )
}
