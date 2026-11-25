import Link from 'next/link'
import { useId } from 'react'
import { ArrowRight, Clock, Mountain, Users } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { splitInlineEmphasis } from '@/lib/inline-emphasis'
import { resolveLink } from '@/lib/links'
import type { CtaBlock } from '@/payload-types'

import './cta.css'

/** Shared, image-free closing card for the homepage and CMS CTA blocks. */

export type CtaCardLink = {
  href: string
  label: string
  newTab?: boolean
}

/* Survey contours of an unnamed ridge — decorative, drawn once. */
function TopoContours() {
  return (
    <svg
      aria-hidden="true"
      className="cta-card__topo"
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

export function CtaCard({
  eyebrow,
  heading,
  text,
  link,
  variant = 'dark',
}: {
  eyebrow?: string | null
  heading: string
  text?: string | null
  link?: CtaCardLink | null
  variant?: 'dark' | 'sage' | 'light'
}) {
  const dict = dictionary
  const titleId = useId()
  const headingSegments = splitInlineEmphasis(heading)
  const external = link ? /^(?:https?:\/\/|mailto:|tel:)/i.test(link.href) : false

  const trustItems = [
    { icon: Clock, label: dict.cta.replyTime },
    { icon: Mountain, label: dict.cta.localGuides },
    { icon: Users, label: dict.cta.smallGroups },
  ]

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <Reveal>
          <div className="relative">
            <span className="cta-card__frame" aria-hidden="true" />
            <article
              data-cta-card
              data-variant={variant}
              aria-labelledby={titleId}
              className="relative"
            >
              <TopoContours />
              <span className="cta-card__topline" aria-hidden="true" />

              <div className="cta-card__inner px-5 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 md:px-12 md:pt-16 lg:px-16 lg:pt-[4.5rem] 3xl:px-20">
                <div className="max-w-2xl min-w-0 3xl:max-w-3xl">
                  {eyebrow ? (
                    <p className="cta-card__eyebrow eyebrow mb-5">
                      <span className="cta-card__dot" aria-hidden="true" />
                      {eyebrow}
                    </p>
                  ) : null}

                  {/* An `<i>…</i>` in the heading field becomes the serif
                      italic second line (see lib/inline-emphasis.ts) — the
                      same two-voice treatment as the homepage hero. */}
                  <h2 id={titleId} className="cta-card__title">
                    {headingSegments.length
                      ? headingSegments.map((segment, index) =>
                          segment.emphasized ? (
                            <i key={index}>{segment.text}</i>
                          ) : (
                            <span key={index}>{segment.text}</span>
                          ),
                        )
                      : heading}
                  </h2>

                  {text ? <p className="cta-card__text lead mt-5 max-w-xl">{text}</p> : null}

                  {link ? (
                    <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
                      <Button
                        asChild
                        size="lg"
                        variant={variant === 'light' ? 'default' : 'paper'}
                        className="cta-card__button group h-[3.25rem] px-8 text-body"
                      >
                        {external || link.newTab ? (
                          <a
                            href={link.href}
                            target={link.newTab ? '_blank' : undefined}
                            rel={link.newTab ? 'noopener noreferrer' : undefined}
                          >
                            {link.label}
                            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </a>
                        ) : (
                          <Link href={link.href}>
                            {link.label}
                            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        )}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* The three quiet proofs, ruled off beneath the copy. */}
                <ul className="cta-card__trust mt-12 flex flex-wrap gap-x-10 gap-y-3 pt-6 md:mt-14">
                  {trustItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-2.5 text-small font-medium"
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Cta({ block }: { block: CtaBlock }) {
  const link = resolveLink(block.link)
  const variant = (block.variant ?? 'dark') as 'dark' | 'sage' | 'light'

  return (
    <CtaCard
      eyebrow={block.eyebrow}
      heading={block.heading}
      text={block.text}
      link={link ? { href: link.href, label: link.label, newTab: link.newTab } : null}
      variant={variantsGuard(variant)}
    />
  )
}

/** The CMS only ever stores the three known variants — this just satisfies the type. */
function variantsGuard(variant: string): 'dark' | 'sage' | 'light' {
  return variant === 'sage' || variant === 'light' ? variant : 'dark'
}
