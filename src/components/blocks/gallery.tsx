import { PayloadImageFill } from '@/components/ui/payload-image'
import { Reveal } from '@/components/motion/reveal'
import { SectionHeading } from '@/components/sections/section-heading'
import type { Locale } from '@/i18n/config'
import type { GalleryBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

const columnsClass: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-2 lg:grid-cols-4',
}

const aspectClass: Record<string, string> = {
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
}

export function Gallery({ block }: { block: GalleryBlock; locale: Locale }) {
  const images = (block.images ?? []).filter((item) => Boolean(item?.image))

  if (images.length === 0) return null

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        {block.heading || block.subheading ? (
          <SectionHeading title={block.heading ?? ''} description={block.subheading} />
        ) : null}

        <div className={cn('grid gap-4 md:gap-6', columnsClass[block.columns ?? '3'] ?? columnsClass['3'])}>
          {images.map((item, index) => (
            <Reveal key={item.id ?? index} delay={index * 60}>
              <figure className="group">
                <div
                  className={cn(
                    'relative overflow-hidden rounded-2xl bg-mist-60',
                    aspectClass[block.aspectRatio ?? '4/3'] ?? aspectClass['4/3'],
                  )}
                >
                  <PayloadImageFill
                    media={item.image}
                    size="tablet"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 92vw"
                    imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  />
                </div>
                {item.caption ? (
                  <figcaption className="mt-3 text-[0.8125rem] text-slate">{item.caption}</figcaption>
                ) : null}
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
