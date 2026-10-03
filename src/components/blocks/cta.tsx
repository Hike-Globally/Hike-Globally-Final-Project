import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Locale } from '@/i18n/config'
import type { CtaBlock } from '@/payload-types'
import { resolveLink } from '@/lib/links'

const variants: Record<string, string> = {
  dark: 'bg-ink text-mist',
  sage: 'bg-sage text-ink',
  light: 'bg-mist-60 text-ink',
}

export function Cta({ block, locale }: { block: CtaBlock; locale: Locale }) {
  const link = resolveLink(block.link, locale)
  const variant = variants[block.variant ?? 'dark'] ?? variants.dark!

  return (
    <section className="py-16 md:py-24">
      <div className="container-content">
        <div className={`relative overflow-hidden rounded-3xl px-8 py-14 md:px-16 md:py-20 ${variant}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl"
          />
          <div className="relative max-w-2xl">
            {block.eyebrow ? (
              <p className="eyebrow mb-4 text-sage">{block.eyebrow}</p>
            ) : null}
            <h2 className="heading-lg">{block.heading}</h2>
            {block.text ? (
              <p className="lead mt-5 opacity-80">{block.text}</p>
            ) : null}

            {link ? (
              <Button asChild size="lg" variant={block.variant === 'light' ? 'default' : 'sage'} className="mt-9">
                <Link href={link.href}>
                  {link.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
