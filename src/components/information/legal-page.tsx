import Link from 'next/link'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbJsonLd, webPageJsonLd } from '@/lib/seo'

type LegalSection = { id: string; title: string; paragraphs: string[] }
export function LegalPage({
  title,
  description,
  path,
  sections,
}: {
  title: string
  description: string
  path: string
  sections: LegalSection[]
}) {
  return (
    <div className="info-page">
      <header className="legal-hero" data-header-hero>
        <div className="container-content">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: title }]} />
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="container-content legal-layout">
        <nav className="legal-nav" aria-label={`${title} contents`}>
          <p className="info-kicker">ON THIS PAGE</p>
          {sections.map((section, i) => (
            <a key={section.id} href={`#${section.id}`}>
              {String(i + 1).padStart(2, '0')} &nbsp; {section.title}
            </a>
          ))}
        </nav>
        <div className="legal-content">
          {sections.map((section) => (
            <section id={section.id} key={section.id}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <p>
            Questions? <Link href="/contact">Get in touch with us</Link>.
          </p>
        </div>
      </div>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: title, url: path },
          ]),
          webPageJsonLd({ name: title, description, url: path }),
        ]}
      />
    </div>
  )
}
