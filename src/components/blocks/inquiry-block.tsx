import Link from 'next/link'
import { Mail, MessageCircle, Phone } from 'lucide-react'

import { InquiryForm } from '@/components/forms/inquiry-form'
import { SectionHeading } from '@/components/sections/section-heading'
import { getSettings, getTripOptions } from '@/lib/data'
import type { InquiryBlock } from '@/payload-types'
import { cn } from '@/lib/utils'

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
}

export async function InquirySection({ block }: { block: InquiryBlock }) {
  const [settings, trips] = await Promise.all([getSettings(), getTripOptions()])

  const email =
    settings.formsubmitEmail || process.env.NEXT_PUBLIC_FORMSUBMIT_EMAIL || settings.email

  // When the block sits on a trip page, pre-select that trip in the form.
  const defaultTrip = block.trip && typeof block.trip !== 'number' ? block.trip : null

  const dark = block.variant === 'dark'

  return (
    <section
      id="inquiry"
      className={cn('py-16 md:py-24', dark ? 'bg-ink text-mist' : 'bg-mist text-ink')}
    >
      <div className="container-content">
        <div className="grid min-w-0 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              title={block.heading}
              description={block.subheading}
              variant={dark ? 'light' : 'dark'}
              className="mb-8"
            />

            <ul className={cn('space-y-3 text-ui', dark ? 'text-mist/80' : 'text-ink-70')}>
              {settings.email ? (
                <li className="flex items-center gap-3">
                  <Mail className="size-4 shrink-0 text-sage" aria-hidden />
                  <a href={`mailto:${settings.email}`} className="hover:underline">
                    {settings.email}
                  </a>
                </li>
              ) : null}
              {settings.phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-sage" aria-hidden />
                  <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="hover:underline">
                    {settings.phone}
                  </a>
                </li>
              ) : null}
              {settings.whatsapp ? (
                <li className="flex items-center gap-3">
                  <MessageCircle className="size-4 shrink-0 text-sage" aria-hidden />
                  <Link
                    href={`https://wa.me/${settings.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    WhatsApp
                  </Link>
                </li>
              ) : null}
            </ul>

            {settings.responseTimeNote ? (
              <p className={cn('mt-6 text-ui', dark ? 'text-sage-light' : 'text-deep-90')}>
                {settings.responseTimeNote}
              </p>
            ) : null}

            {settings.socials?.length ? (
              <p
                className={cn(
                  'mt-6 text-label tracking-[0.14em] uppercase',
                  dark ? 'text-mist/70' : 'text-slate-80',
                )}
              >
                {settings.socials
                  .map((social) => platformLabels[social.platform] ?? social.platform)
                  .join(' · ')}
              </p>
            ) : null}
          </div>

          <div>
            <InquiryForm
              trips={trips}
              email={email}
              defaultTripSlug={defaultTrip?.slug ?? null}
              variant={dark ? 'dark' : 'light'}
            />
            {block.note ? (
              <p className={cn('mt-4 text-small', dark ? 'text-mist/80' : 'text-slate-80')}>
                {block.note}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
