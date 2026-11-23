import { PayloadImageFill } from '@/components/ui/payload-image'
import { Breadcrumbs } from './breadcrumbs'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

/**
 * Shared hero header for listing and detail pages.
 *
 * Every page opens with the same full-screen hero band (`.hero-region`, see `globals.css`):
 * one viewport tall, with the site's hero type — the display headline at the homepage hero's
 * size and the standfirst under it at the homepage hero's lead size.
 *
 * With a `background` image it becomes a dark, immersive banner; without one it renders as a
 * light typographic hero. One component, two moods — which is how the site keeps a consistent
 * rhythm without every page looking identical.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  breadcrumbs,
  background,
  align = 'left',
  children,
}: {
  eyebrow?: string | null
  title: string
  lead?: string | null
  breadcrumbs?: { label: string; href?: string }[]
  background?: number | Media | null
  align?: 'left' | 'center'
  children?: React.ReactNode
}) {
  const hasBackground = Boolean(background)

  return (
    <section
      // Marks the opening band as this page's hero region: while it is still on
      // screen the global header stays pinned (see header-frame.tsx).
      data-header-hero
      className={cn(
        'hero-region relative isolate',
        // The hero band is one viewport tall, so its copy is bottom-aligned like
        // every other hero on the site rather than floating near the top.
        hasBackground ? 'flex items-end bg-ink text-mist' : 'flex items-end bg-mist text-ink',
        'overflow-hidden',
      )}
    >
      {background ? (
        <>
          <PayloadImageFill
            media={background}
            sizes="100vw"
            priority
            className="-z-10"
            imageClassName="object-cover"
          />
          {/* One navy wash, deepened towards the foot where the h1 and lead
              sit. Measured at 4.5:1 or better for paper text even over a
              fully blown-out photograph. */}
          <div className="absolute inset-0 -z-10 bg-ink/72" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
        </>
      ) : null}

      <div
        className={cn(
          'container-content',
          hasBackground
            ? 'pt-28 pb-16 sm:pb-20 md:pt-36 md:pb-28'
            : 'pt-28 pb-16 md:pt-32 md:pb-24',
          align === 'center' ? 'text-center' : '',
        )}
      >
        {breadcrumbs?.length ? (
          <div className={cn('mb-6', align === 'center' ? 'flex justify-center' : '')}>
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}

        {eyebrow ? (
          <p className={cn('eyebrow mb-4', hasBackground ? 'text-mist' : 'text-slate-80')}>
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={cn(
            'heading-display hero-title max-w-4xl 3xl:max-w-5xl',
            hasBackground ? 'text-white' : 'text-ink',
            align === 'center' ? 'mx-auto' : '',
          )}
        >
          {title}
        </h1>

        {lead ? (
          <p
            className={cn(
              'lead hero-description mt-6 max-w-2xl',
              hasBackground ? 'text-mist' : 'text-ink-60',
              align === 'center' ? 'mx-auto' : '',
            )}
          >
            {lead}
          </p>
        ) : null}

        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  )
}
