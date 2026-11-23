import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import { bentoAreaVars } from '@/lib/place-bento-layout'
import { placeCategories, placeCategoryPath, type PlaceCategory } from '@/lib/place-categories'
import Image from '@/components/ui/next-image'

import { PlaceGlyph } from './place-glyph'

import './place-bento.css'

/**
 * The `/places` atlas as a bento grid.
 *
 * Ten plates — one editorial key and the nine landscapes — packed into a single
 * rectangle with one gutter everywhere and no ragged edge. The packing is data
 * (`src/lib/place-bento-layout.ts`): each plate publishes its three grid areas
 * (phone / tablet / desktop) as custom properties, the stylesheet switches
 * between them at the breakpoints, and `place-bento-layout.test.ts` proves
 * every breakpoint tiles exactly — so the composition can never open a hole or
 * strand a tile.
 *
 * Each photograph keeps the site's one image treatment (`--image-grade`, the
 * mist plate, the single navy scrim) and its label sits on that scrim as white
 * display type. The category photo is decorative (`alt=""`): the visible title
 * is the accessible name of the link, exactly as on the homepage carousel.
 *
 * The key plate carries the section's `h2`, which is why the index page no
 * longer needs a heading block above the grid — the type lives inside the
 * composition instead of sitting on top of it.
 */
export function PlaceBento({ titleId = 'places-bento-title' }: { titleId?: string }) {
  return (
    <div className="places-bento" data-places-bento="">
      <div className="pb-key" data-tile="key" style={bentoAreaVars('key') as CSSProperties}>
        <TopoContours />

        <div className="pb-key__head">
          <p className="pb-key__eyebrow eyebrow">
            <span className="pb-key__dot" aria-hidden="true" />
            Nine curated categories
          </p>
          <h2 id={titleId} className="pb-key__title">
            Start with a <i>landscape</i>
          </h2>
          <p className="pb-key__text">
            Lakes, passes, summits and sacred places — choose the feature you would travel toward,
            and we will show you the journeys and field notes gathered around it.
          </p>
        </div>

        {/* The route key — the nine survey glyphs the category pages each carry,
            in one hairline row. Decorative: the plates below are the links. */}
        <span className="pb-key__route" aria-hidden="true">
          {placeCategories.map((category) => (
            <PlaceGlyph key={category.value} value={category.value} strokeWidth={1.3} />
          ))}
        </span>

        <div className="pb-key__foot">
          <span className="pb-key__count">09 / Curated landscapes</span>
          <span className="pb-key__glyphs" aria-hidden="true">
            <PlaceGlyph value="lakes" />
            <PlaceGlyph value="mountain-peaks" />
            <PlaceGlyph value="temples" />
          </span>
        </div>
      </div>

      {placeCategories.map((category, index) => (
        <BentoPlate key={category.value} category={category} index={index} />
      ))}
    </div>
  )
}

/**
 * Survey contours of an unnamed ridge — the same cartographic decoration the
 * site's closing CTA card is drawn with, reduced to one ornament so the key
 * plate belongs to the same family as the dark panels elsewhere.
 */
function TopoContours() {
  return (
    <svg
      aria-hidden="true"
      className="pb-key__topo"
      viewBox="0 0 800 520"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke="currentColor" strokeWidth="1">
        <path d="M-20 420 C140 340 260 470 430 390 S700 300 830 360" />
        <path d="M-20 360 C150 285 280 410 450 330 S710 245 830 300" opacity="0.85" />
        <path d="M-20 300 C160 230 300 350 470 272 S720 190 830 242" opacity="0.7" />
        <path d="M-20 242 C170 178 320 292 490 216 S730 138 830 186" opacity="0.55" />
        <path d="M-20 186 C185 128 340 236 510 162 S740 88 830 132" opacity="0.4" />
        <path d="M-20 132 C200 82 360 182 530 110 S750 42 830 80" opacity="0.28" />
        <path d="M-20 82 C215 40 380 130 550 62 S760 4 830 34" opacity="0.18" />
      </g>
    </svg>
  )
}

/**
 * One landscape in the bento.
 *
 * Only structure lives here — the plate's size, crop and type scale come from
 * its placement data and its `data-tile` row in the stylesheet, so the same
 * markup serves the tall right-hand column, the wide feature bands and the
 * stacked phone layout.
 *
 * ACCESSIBLE NAME: the category title, and nothing else. The numeral and the
 * corner mark are `aria-hidden`, and the supporting line is hidden from the
 * name too (`aria-hidden`) because a screen-reader user meets all nine names
 * in one pass — the visible title is the label, the sentence is visual
 * emphasis. The link is therefore announced as "Lakes, link" rather than
 * "01, Lakes, mirror-still water…". The photo stays `alt=""` (the title is the
 * name), exactly as on the homepage carousel.
 */
function BentoPlate({
  category,
  index,
  priority,
}: {
  category: PlaceCategory
  index: number
  priority?: boolean
}) {
  return (
    <Link
      href={placeCategoryPath(category.value)}
      data-tile={category.value}
      data-place-bento-plate={category.value}
      className="pb-plate group"
      style={bentoAreaVars(category.value) as CSSProperties}
    >
      <Image
        src={category.image}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 64rem) 34vw, (min-width: 48rem) 52vw, 94vw"
        aria-hidden="true"
        className="pb-plate__image"
      />
      <span className="pb-plate__wash" aria-hidden="true" />

      <span className="pb-plate__inner">
        <span className="pb-plate__top" aria-hidden="true">
          <span className="pb-plate__num">{String(index + 1).padStart(2, '0')}</span>
          <span className="pb-plate__cue">
            <ArrowUpRight className="size-4" />
          </span>
        </span>

        <span className="pb-plate__body">
          <h3 className="pb-plate__title">{category.label}</h3>
          <span className="pb-plate__desc" aria-hidden="true">
            {category.description}
          </span>
        </span>
      </span>
    </Link>
  )
}
