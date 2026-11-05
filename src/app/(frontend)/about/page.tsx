import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, Compass, Globe2, Handshake } from 'lucide-react'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'
import '../information.css'

const description =
  'Meet Hike Globally, an affiliate travel platform connecting curious travellers with journeys offered by independent operators.'
export const revalidate = 3600
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildMetadata({
    title: 'About us',
    description,
    path: '/about',
    image: settings.defaultOgImage,
    siteName: settings.siteName,
  })
}

export default function AboutPage() {
  return (
    <div className="info-page">
      <section className="info-hero" data-header-hero>
        <Image
          src="/images/admin/himalaya-03.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="info-hero__image"
        />
        <div className="info-hero__shade" />
        <div className="container-content info-hero__content">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About us' }]} />
          <div className="info-hero__main">
            <p className="info-kicker light">
              THE STORY BEHIND THE JOURNEY <span> / 01</span>
            </p>
            <h1>
              For the places
              <br />
              <em>that move you.</em>
            </h1>
            <p className="info-hero__lead">
              The world is wonderfully wide. We make finding your way into it a little simpler.
            </p>
            <a href="#our-story" className="info-hero__scroll">
              Discover our story <ArrowDown size={16} aria-hidden />
            </a>
          </div>
          <div className="info-hero__bottom">
            <span>HIKE GLOBALLY</span>
            <span>TRAVEL BEYOND THE ORDINARY</span>
          </div>
        </div>
      </section>

      <section id="our-story" className="info-intro container-content">
        <div>
          <p className="info-kicker">
            OUR POINT OF VIEW <span> / 01</span>
          </p>
          <h2>
            Curiosity is a<br />
            <em>good compass.</em>
          </h2>
        </div>
        <div className="info-intro__copy">
          <p className="info-large-copy">A memorable journey begins long before the first step.</p>
          <p>
            Hike Globally is an affiliate travel platform for people who believe the journey matters
            as much as the destination. We bring travel packages and inspiration together in one
            place, helping you discover experiences that speak to you.
          </p>
          <p>
            From mountain trails to new corners of the world, our role is to connect you with
            opportunities to explore. The experiences listed here are offered and operated by
            independent travel providers, not by Hike Globally.
          </p>
          <Link href="/trips" className="info-text-link">
            Explore the trips <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </section>
      <section className="info-philosophy">
        <div className="container-content">
          <div className="info-section-head">
            <div>
              <p className="info-kicker light">
                A LITTLE MORE CLARITY <span> / 02</span>
              </p>
              <h2>
                How the journey
                <br />
                <em>comes together.</em>
              </h2>
            </div>
            <p>Good travel starts with knowing who does what. Here’s how we fit into your plans.</p>
          </div>
          <div className="info-steps">
            <article>
              <Compass aria-hidden />
              <span>01 / DISCOVER</span>
              <h3>Find your inspiration.</h3>
              <p>
                Browse destinations and packages, and find the kind of adventure that feels right
                for you.
              </p>
            </article>
            <article>
              <Handshake aria-hidden />
              <span>02 / CONNECT</span>
              <h3>Meet the provider.</h3>
              <p>
                Independent operators arrange and run the trips. Check their listing and booking
                terms for the details of your experience.
              </p>
            </article>
            <article>
              <Globe2 aria-hidden />
              <span>03 / GO FURTHER</span>
              <h3>Travel with perspective.</h3>
              <p>
                Ask questions, prepare thoughtfully, and leave room for the unexpected along the
                way.
              </p>
            </article>
          </div>
          <div className="info-disclosure">
            <span>OUR AFFILIATE RELATIONSHIP</span>
            <p>
              Some links on Hike Globally may earn us a commission if you book through them. The
              provider is responsible for the travel services; always review their terms, inclusions
              and cancellation policies before booking.
            </p>
          </div>
        </div>
      </section>
      <section className="info-about-end container-content">
        <div className="info-about-end__image">
          <Image
            src="/images/destinations/hero.jpg"
            alt="A mountain landscape"
            fill
            sizes="(max-width: 800px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="info-kicker">
            WHERE TO NEXT? <span> / 03</span>
          </p>
          <h2>
            There’s a whole world
            <br />
            <em>waiting out there.</em>
          </h2>
          <p>
            Whether you have a trip in mind or are just beginning to dream, we’d love to hear from
            you.
          </p>
          <Link href="/contact" className="info-button">
            Start a conversation <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </section>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'About us', url: '/about' },
          ]),
          webPageJsonLd({
            type: 'AboutPage',
            name: 'About us',
            description,
            url: '/about',
            siteName: 'Hike Globally',
          }),
        ]}
      />
    </div>
  )
}
