import type { Metadata } from 'next'
import { LegalPage } from '@/components/information/legal-page'
import { getSettings } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'
import '../information.css'

const description =
  'A straightforward guide to using Hike Globally and understanding the trips featured on our platform.'
export const revalidate = 3600
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildMetadata({
    title: 'Terms and conditions',
    description,
    path: '/terms',
    image: settings.defaultOgImage,
    siteName: settings.siteName,
  })
}
const sections = [
  {
    id: 'using-site',
    title: 'Using this website',
    paragraphs: [
      'By using Hike Globally, you agree to use the site lawfully and not interfere with its operation, misuse its content, or submit false or misleading information. If you do not agree, please do not use the site.',
    ],
  },
  {
    id: 'our-role',
    title: 'Our role',
    paragraphs: [
      'Hike Globally is an affiliate travel platform. The travel packages listed on this site are offered and operated by independent third-party providers, not by Hike Globally. We help travellers discover and connect with those providers; a listing or enquiry is not a booking confirmation.',
      'Some links may be affiliate links, meaning we may earn a commission if you make a qualifying booking.',
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings and provider terms',
    paragraphs: [
      'Your booking, payment, changes, cancellation, refunds and the delivery of travel services are subject to the relevant provider’s terms. Review those terms and confirm prices, availability, inclusions, exclusions and insurance requirements directly with the provider before booking.',
      'Trip information can change. While we aim to keep the site useful and accurate, we cannot guarantee that every description, price or date is complete or current.',
    ],
  },
  {
    id: 'travel',
    title: 'Travel responsibilities',
    paragraphs: [
      'Travel and outdoor activities can involve risk. You are responsible for assessing your suitability for a trip and arranging appropriate documents, visas, vaccinations and insurance. Follow the advice and safety instructions of your provider and relevant authorities.',
    ],
  },
  {
    id: 'third-parties',
    title: 'Third-party websites',
    paragraphs: [
      'Links to third-party sites are provided for convenience. We do not control their content, services or privacy practices. Review their terms and policies before sharing information or making a booking.',
    ],
  },
  {
    id: 'content',
    title: 'Website content',
    paragraphs: [
      'The content and branding on this site are protected by applicable intellectual property laws. You may use the site for personal, non-commercial planning, but may not reproduce or commercially exploit its content without permission.',
    ],
  },
  {
    id: 'liability',
    title: 'Availability and responsibility',
    paragraphs: [
      'The site is provided on an as-available basis. To the extent permitted by applicable law, Hike Globally does not guarantee uninterrupted access or accept responsibility for losses arising from use of the site or services supplied by independent providers. Nothing in these terms limits rights or liability that cannot lawfully be excluded.',
    ],
  },
  {
    id: 'updates',
    title: 'Updates and questions',
    paragraphs: [
      'We may update these terms from time to time. The current version will be posted here. If you have questions about the site or these terms, please contact us.',
    ],
  },
]
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      description={description}
      path="/terms"
      sections={sections}
    />
  )
}
