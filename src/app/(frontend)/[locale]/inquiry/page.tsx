import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Mail, MessageCircle, Phone } from 'lucide-react'

import { InquiryForm } from '@/components/forms/inquiry-form'
import { PageHeader } from '@/components/sections/page-header'
import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getSettings, getTripOptions } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const dict = getDictionary(locale)

  return buildMetadata({
    title: dict.inquiry.title,
    description: dict.inquiry.subtitle,
    path: localizedPath(locale, '/inquiry'),
    locale,
  })
}

/**
 * INQUIRY PAGE — `/[locale]/inquiry`
 * The form posts directly to Formsubmit.co; no Payload form collection, no API route.
 */
export default async function InquiryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const dict = getDictionary(locale)
  const [settings, trips] = await Promise.all([getSettings(locale), getTripOptions(locale)])

  const email = settings.formsubmitEmail || process.env.NEXT_PUBLIC_FORMSUBMIT_EMAIL || settings.email

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={dict.nav.contact}
        title={dict.inquiry.title}
        lead={dict.inquiry.subtitle}
        breadcrumbs={[
          { label: dict.nav.home, href: localizedPath(locale, '/') },
          { label: dict.nav.inquiry },
        ]}
      />

      <section className="py-14 md:py-20">
        <div className="container-content grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <aside className="space-y-8">
            <div className="rounded-2xl bg-sage-20 p-7">
              <h2 className="heading-md mb-5">{dict.footer.contact}</h2>
              <ul className="space-y-4 text-[0.9375rem]">
                {settings.email ? (
                  <li className="flex items-center gap-3">
                    <Mail className="size-4 shrink-0 text-deep" aria-hidden />
                    <a href={`mailto:${settings.email}`} className="text-ink-80 hover:text-deep">
                      {settings.email}
                    </a>
                  </li>
                ) : null}
                {settings.phone ? (
                  <li className="flex items-center gap-3">
                    <Phone className="size-4 shrink-0 text-deep" aria-hidden />
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="text-ink-80 hover:text-deep"
                    >
                      {settings.phone}
                    </a>
                  </li>
                ) : null}
                {settings.whatsapp ? (
                  <li className="flex items-center gap-3">
                    <MessageCircle className="size-4 shrink-0 text-deep" aria-hidden />
                    <Link
                      href={`https://wa.me/${settings.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-80 hover:text-deep"
                    >
                      {dict.inquiry.openWhatsApp}
                    </Link>
                  </li>
                ) : null}
              </ul>

              {settings.responseTimeNote ? (
                <p className="mt-6 text-[0.9375rem] text-deep">{settings.responseTimeNote}</p>
              ) : null}
            </div>

            {settings.address ? (
              <div className="rounded-2xl border border-black/[0.06] p-7">
                <h2 className="heading-md mb-4">{dict.structuredData.organization}</h2>
                <p className="text-[0.9375rem] whitespace-pre-line text-ink-70">{settings.address}</p>
              </div>
            ) : null}
          </aside>

          <div>
            <InquiryForm locale={locale} trips={trips} email={email} />
          </div>
        </div>
      </section>
    </>
  )
}
