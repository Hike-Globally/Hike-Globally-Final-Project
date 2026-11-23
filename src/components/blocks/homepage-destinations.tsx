import { DestinationCarousel } from '@/components/cards/destination-carousel'
import { sitePath } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import { NEPAL_REGION_CARDS, WORLD_REGION_CARDS } from '@/lib/homepage-destinations'

/**
 * The two destination sliders on the homepage, in order:
 *  1. "DESTINATIONS" — the five Nepal regions;
 *  2. "Destinations Around The World" — the six continents.
 *
 * Both use the same carousel, animation and type scale as each other.
 *
 * "Browse places" is deliberately *not* rendered here: it already appears once, high on
 * the homepage (right after "Find your match"), and repeating it after the second
 * destination slider put a duplicate section immediately above "Latest Blogs and Stories".
 */
export function HomepageDestinations() {
  return (
    <>
      <DestinationCarousel
        destinations={NEPAL_REGION_CARDS}
        title={dictionary.destinations.homeSectionTitle}
        description={dictionary.destinations.homeSectionDescription}
        action={{ href: sitePath('/destinations'), label: dictionary.common.viewAll }}
        titleClassName="home-section-title"
        descriptionClassName="home-section-intro"
      />
      <DestinationCarousel
        destinations={WORLD_REGION_CARDS}
        title="Destinations Around The World"
        description="Beyond Nepal, we plan treks and expeditions on every continent. Tell us where you want to walk and we will shape the journey around it."
        action={{ href: sitePath('/contact'), label: dictionary.common.viewAll }}
        titleClassName="home-section-title"
        descriptionClassName="home-section-intro"
      />
    </>
  )
}
