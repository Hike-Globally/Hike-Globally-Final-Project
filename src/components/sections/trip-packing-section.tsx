'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Backpack,
  Check,
  Footprints,
  ListChecks,
  RotateCcw,
  Shirt,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { dictionary } from '@/i18n/dictionaries'
import {
  groupPackingList,
  packingItemKey,
  packingProgress,
  type PackingCategoryValue,
  type PackingListRow,
} from '@/lib/trip-packing'

import './trip-packing-section.css'

/* ----------------------------------------------------------------------------
   Chrome per group
   ---------------------------------------------------------------------------- */

/**
 * One icon and one short line of guidance per accordion. The icon is decoration (`aria-hidden`);
 * the blurb is the "why" that turns a bare list into advice — what to bring, not just a noun.
 */
const groupChrome: Record<PackingCategoryValue, { icon: LucideIcon; blurb: string }> = {
  'clothing-footwear': { icon: Shirt, blurb: dictionary.trip.packingBlurbClothing },
  'trekking-equipment': { icon: Backpack, blurb: dictionary.trip.packingBlurbEquipment },
  'personal-items': { icon: ShoppingBag, blurb: dictionary.trip.packingBlurbPersonal },
}

/* ----------------------------------------------------------------------------
   Packed state (local only)
   ---------------------------------------------------------------------------- */

const STORAGE_PREFIX = 'hg:packing:'

/**
 * Which items the visitor has ticked, remembered per trip in `localStorage`.
 *
 * Purely a checklist aid — nothing is sent anywhere, and a browser with storage blocked simply
 * gets an unticked list. Reading happens in an effect (never during render) so the server HTML and
 * the first client render match exactly and hydration stays clean.
 */
function usePackedItems(tripSlug: string) {
  const storageKey = `${STORAGE_PREFIX}${tripSlug}`
  const [packed, setPacked] = useState<ReadonlySet<string>>(() => new Set<string>())

  // Reading storage has to happen *after* mount: the server cannot see it, so doing it during
  // render (or in a state initialiser) would make the first client render disagree with the HTML
  // and hydration would fail. The extra render this costs is the price of a clean hydration, and
  // it is why the rule is disabled here — not a blanket opt-out.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (!stored) return
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- see the comment above
        setPacked(new Set(parsed.filter((key): key is string => typeof key === 'string')))
      }
    } catch {
      // Corrupt or unavailable storage is not an error worth surfacing — start unticked.
    }
  }, [storageKey])

  const persist = useCallback(
    (next: ReadonlySet<string>) => {
      setPacked(next)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch {
        // Private mode / quota: keep the in-memory state and move on.
      }
    },
    [storageKey],
  )

  const toggle = useCallback(
    (key: string) => {
      const next = new Set(packed)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      persist(next)
    },
    [packed, persist],
  )

  const reset = useCallback(() => persist(new Set<string>()), [persist])

  return { packed, toggle, reset }
}

/* ----------------------------------------------------------------------------
   Dashboard
   ---------------------------------------------------------------------------- */

/**
 * "Packing dashboard" — the strip above the accordions: how much kit this trip asks for, how many
 * groups it is split across, and how far through their own checklist the visitor is.
 *
 * The bar is a real readout, not decoration: it renders the same `packingProgress()` the list's
 * checkboxes drive, so ticking an item moves it immediately.
 */
function PackingDashboard({
  groups,
  packed,
  onReset,
}: {
  groups: ReturnType<typeof groupPackingList>
  packed: ReadonlySet<string>
  onReset: () => void
}) {
  const dict = dictionary.trip
  const { total, done, percent } = packingProgress(groups, packed)

  return (
    <div className="packing-dashboard">
      <dl className="packing-dashboard-stats">
        <div className="packing-stat">
          <dt>
            <ListChecks className="size-4" aria-hidden /> {dict.packingItemsStat}
          </dt>
          <dd>{total}</dd>
        </div>
        <div className="packing-stat">
          <dt>
            <ShoppingBag className="size-4" aria-hidden /> {dict.packingGroupsStat}
          </dt>
          <dd>{groups.length}</dd>
        </div>
        <div className="packing-stat">
          <dt>
            <Footprints className="size-4" aria-hidden /> {dict.packingPackedStat}
          </dt>
          <dd>
            {done}
            <span className="packing-stat-of">/{total}</span>
          </dd>
        </div>
      </dl>

      <div className="packing-dashboard-progress">
        <div className="packing-progress-head">
          <p className="packing-progress-label">
            {done === 0
              ? dict.packingStartTicking
              : done === total
                ? dict.packingAllPacked
                : dict.packingYourProgress}
          </p>
          <p className="packing-progress-value" aria-hidden>
            {percent}%
          </p>
        </div>

        {/* A native <progress> so the bar is exposed to assistive tech without extra ARIA. Its
            max is the item count, so a trip with an empty list renders an inert bar, never NaN. */}
        <progress
          className="packing-progress-bar"
          value={done}
          max={total || 1}
          aria-label={dict.packingPackedStat}
        />

        <div className="packing-progress-foot">
          <p className="packing-progress-note">{dict.packingLocalNote}</p>
          <button type="button" onClick={onReset} disabled={done === 0} className="packing-reset">
            <RotateCcw className="size-3.5" aria-hidden />
            {dict.packingReset}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------------
   Section
   ---------------------------------------------------------------------------- */

/**
 * The packing list — three accordions (Clothing and Footwear, Trekking Equipment, Personal Items)
 * under a dashboard, each opening onto a tickable checklist.
 *
 * Behaviour:
 *   - **Open by default.** All three groups start expanded, so the section reads as a list of kit at
 *     a glance (`defaultValue` = every group, exactly like Essential Information). Nobody has to
 *     discover that there is content behind a closed row.
 *   - **Independent.** `type="multiple"`, each row toggles on its own, and the count badge stays in
 *     the header when a group is closed, so a collapsed row still says how much it holds.
 *   - **Local ticks.** The checkboxes are a personal checklist (see `usePackedItems`), never a
 *     server action — the page is statically rendered and a trip page has no logged-in visitor.
 *
 * The item text is rendered from the CMS in the server HTML; the interactive furniture (ticks,
 * progress, reset) hydrates on top of it.
 */
export function TripPackingSection({
  rows,
  tripSlug,
}: {
  rows: PackingListRow[] | null | undefined
  tripSlug: string
}) {
  const dict = dictionary.trip
  const groups = useMemo(() => groupPackingList(rows), [rows])
  const { packed, toggle, reset } = usePackedItems(tripSlug)

  // `defaultValue` is only read once, so derive it from the groups present on first render.
  const initialOpen = useMemo(() => groups.map(({ category }) => category), [groups])

  if (!groups.length) return null

  return (
    <section id="packing-list" className="packing-section scroll-mt-24 py-16 md:py-24">
      <div className="mb-10">
        <h2 className="heading-lg">{dict.packingList}</h2>
        <p className="packing-standfirst">{dict.packingListIntro}</p>
      </div>

      <PackingDashboard groups={groups} packed={packed} onReset={reset} />

      <Accordion type="multiple" defaultValue={initialOpen} className="packing-accordion">
        {groups.map((group) => {
          const { icon: Icon, blurb } = groupChrome[group.category]
          const done = group.items.filter((_, index) =>
            packed.has(packingItemKey(group.category, index)),
          ).length

          return (
            <AccordionItem
              key={group.category}
              value={group.category}
              id={group.category}
              className="packing-group"
            >
              <AccordionTrigger
                headingLevel="h3"
                indicator="chevron"
                className="packing-group-trigger hover:no-underline"
              >
                <span className="packing-group-head">
                  <span className="packing-group-icon" aria-hidden>
                    <Icon className="size-[1.05rem]" strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0">
                    <span className="packing-group-title">{group.heading}</span>
                    <span className="packing-group-blurb">{blurb}</span>
                  </span>
                </span>
                {/* A collapsed row still answers "how much is in here?", and an open one doubles as
                    progress for that group. The visible number is decorative to screen readers, so
                    the full sentence next to it is what gets announced. */}
                <span className="packing-group-count" aria-hidden>
                  <span className="tabular-nums">
                    {done > 0 ? `${done}/${group.count}` : group.count}
                  </span>
                </span>
                <span className="sr-only">
                  {done > 0
                    ? `${done} of ${group.count} items packed in ${group.heading}`
                    : `${group.count} items in ${group.heading}`}
                </span>
              </AccordionTrigger>

              {/* No className here: the shared AccordionContent applies any `className` to its own
                  animated wrapper (which would replace the open/close animation), so the visual
                  spacing lives on the inner list instead. */}
              <AccordionContent>
                <ul className="packing-items">
                  {group.items.map((entry, index) => {
                    const key = packingItemKey(group.category, index)
                    const checked = packed.has(key)

                    return (
                      <li key={entry.id ?? key}>
                        <label className="packing-item" data-checked={checked || undefined}>
                          <input
                            type="checkbox"
                            className="packing-item-input"
                            checked={checked}
                            onChange={() => toggle(key)}
                          />
                          <span className="packing-item-box" aria-hidden>
                            <Check className="size-3" strokeWidth={3.5} />
                          </span>
                          <span className="packing-item-text">{entry.item}</span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </section>
  )
}
