import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Mail, MessageCircle, Phone } from 'lucide-react'
import { InquiryForm } from '@/components/forms/inquiry-form'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { getSettings, getTripOptions } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'
import '../information.css'

const description =
  'Have a journey in mind? Contact Hike Globally with your questions or tell us about your travel plans.'
export const revalidate = 3600
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildMetadata({
    title: 'Contact us',
    description,
    path: '/contact',
    image: settings.defaultOgImage,
    siteName: settings.siteName,
  })
}
export default async function ContactPage() {
  const [settings, trips] = await Promise.all([getSettings(), getTripOptions()])
  const email =
    settings.formsubmitEmail || process.env.NEXT_PUBLIC_FORMSUBMIT_EMAIL || settings.email
  return (
    <div className="info-page">
      <section className="info-hero info-hero--contact" data-header-hero>
        <Image
          src="/images/trips/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="info-hero__image"
        />
        <div className="info-hero__shade" />
        <div className="container-content info-hero__content">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact us' }]} />
          <div className="info-hero__main">
            <p className="info-kicker light">
              WE’RE HERE TO HELP <span> / GET IN TOUCH</span>
            </p>
            <h1>
              Every journey starts
              <br />
              <em>with a hello.</em>
            </h1>
            <p className="info-hero__lead">
              A question, a place on your mind, or a trip you can’t stop thinking about. We’re
              listening.
            </p>
            <a href="#contact-form" className="info-hero__scroll">
              Get in touch <ArrowDown size={16} aria-hidden />
            </a>
          </div>
          <div className="info-hero__bottom">
            <span>HIKE GLOBALLY</span>
            <span>LET’S FIND YOUR NEXT ADVENTURE</span>
          </div>
        </div>
      </section>
      <section id="contact-form" className="contact-section container-content">
        <div className="contact-aside">
          <p className="info-kicker">
            LET’S TALK <span> / 01</span>
          </p>
          <h2>
            Tell us what’s
            <br />
            <em>on your horizon.</em>
          </h2>
          <p>
            Share a little about your plans and we’ll help point you in the right direction. No
            perfect itinerary required.
          </p>
          <div className="contact-details">
            <p className="info-kicker">OTHER WAYS TO REACH US</p>
            {settings.email && (
              <a href={`mailto:${settings.email}`}>
                <Mail size={18} aria-hidden />
                <span>
                  <small>EMAIL US</small>
                  {settings.email}
                </span>
                <ArrowUpRight size={16} aria-hidden />
              </a>
            )}
            {settings.phone && (
              <a href={`tel:${settings.phone.replace(/[^+\d]/g, '')}`}>
                <Phone size={18} aria-hidden />
                <span>
                  <small>GIVE US A CALL</small>
                  {settings.phone}
                </span>
                <ArrowUpRight size={16} aria-hidden />
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} aria-hidden />
                <span>
                  <small>SEND A MESSAGE</small>WhatsApp
                </span>
                <ArrowUpRight size={16} aria-hidden />
              </a>
            )}
          </div>
          {settings.responseTimeNote && <p className="contact-note">{settings.responseTimeNote}</p>}
          {settings.address && (
            <p className="contact-note whitespace-pre-line">{settings.address}</p>
          )}
        </div>
        <div className="contact-form-wrap">
          <div className="contact-form-heading">
            <div>
              <p className="info-kicker">YOUR NEXT CHAPTER</p>
              <h3>Send us a message.</h3>
            </div>
            <span>↗</span>
          </div>
          <p className="contact-form-intro">
            The more you share, the better we can help. Fields marked * are required.
          </p>
          <InquiryForm trips={trips} email={email} />
          <p className="contact-affiliate-note">
            Hike Globally is an affiliate platform. Travel packages are operated by independent
            providers. <Link href="/about">Learn more</Link>.
          </p>
        </div>
      </section>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Contact us', url: '/contact' },
          ]),
          webPageJsonLd({
            type: 'ContactPage',
            name: 'Contact us',
            description,
            url: '/contact',
            siteName: settings.legalName || settings.siteName,
          }),
        ]}
      />
    </div>
  )
}
