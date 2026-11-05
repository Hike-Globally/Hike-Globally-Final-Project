import { PayloadImageFill } from '@/components/ui/payload-image'
import { Breadcrumbs } from './breadcrumbs'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

/**
 * Shared page header for listing and detail pages.
 *
 * With a `background` image it becomes a dark, immersive banner; without one it renders as a
 * light typographic header. One component, two moods — which is how the site keeps a
 * consistent rhythm without every page looking identical.
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
        'relative isolate overflow-hidden',
        hasBackground ? 'bg-ink text-mist' : 'bg-mist text-ink',
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
            : 'pt-28 pb-12 md:pt-32 md:pb-16',
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
            'heading-xl max-w-4xl',
            hasBackground ? 'text-white' : 'text-ink',
            align === 'center' ? 'mx-auto' : '',
          )}
        >
          {title}
        </h1>

        {lead ? (
          <p
            className={cn(
              'lead mt-6 max-w-2xl',
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
