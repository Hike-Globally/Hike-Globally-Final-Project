import Image from 'next/image'

const slides = [
  {
    image: '/images/admin/himalaya-01.jpg',
    location: 'EVEREST REGION · NEPAL',
    title: 'Closer to what moves you.',
  },
  {
    image: '/images/admin/himalaya-02.jpg',
    location: 'ANNAPURNA REGION · NEPAL',
    title: 'A slower kind of wonder.',
  },
  {
    image: '/images/admin/himalaya-03.jpg',
    location: 'THE HIGH HIMALAYA',
    title: 'Find your own horizon.',
  },
]

/** A CSS-driven, reduced-motion-aware photo carousel for Payload's built-in login view. */
export default function AdminLoginGallery() {
  return (
    <>
      <aside className="hg-login-gallery" aria-hidden="true">
        <div className="hg-login-gallery__slides">
          {slides.map((slide, index) => (
            <div
              className={`hg-login-gallery__slide hg-login-gallery__slide--${index + 1}`}
              key={slide.image}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="(max-width: 900px) 100vw, 50vw"
                className="hg-login-gallery__image"
              />
              <div className="hg-login-gallery__caption">
                <p>{slide.location}</p>
                <h2>{slide.title}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="hg-login-gallery__topline">
          <span className="hg-login-gallery__topline-mark" />
          <span>Himalayan field notes</span>
          <span className="hg-login-gallery__topline-rule" />
          <span>Nepal · 8,000 m+</span>
        </div>

        <div className="hg-login-gallery__indicators">
          <span className="hg-login-gallery__indicator hg-login-gallery__indicator--1" />
          <span className="hg-login-gallery__indicator hg-login-gallery__indicator--2" />
          <span className="hg-login-gallery__indicator hg-login-gallery__indicator--3" />
        </div>
        <div className="hg-login-gallery__edge" />
      </aside>

      <div className="hg-login-intro">
        <p className="hg-login-intro__eyebrow">
          TEAM ACCESS <span /> HIMALAYAN EXPEDITIONS
        </p>
        <h1>Welcome back.</h1>
        <p className="hg-login-intro__description">
          Sign in to shape the journeys that bring the Himalaya closer to the world.
        </p>
      </div>
    </>
  )
}
