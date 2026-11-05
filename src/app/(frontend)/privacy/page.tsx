import type { Metadata } from 'next'
import { LegalPage } from '@/components/information/legal-page'
import { getSettings } from '@/lib/data'
import { buildMetadata } from '@/lib/seo'
import '../information.css'

const description =
  'How Hike Globally handles information when you explore our site or get in touch.'
export const revalidate = 3600
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildMetadata({
    title: 'Privacy policy',
    description,
    path: '/privacy',
    image: settings.defaultOgImage,
    siteName: settings.siteName,
  })
}
const sections = [
  {
    id: 'overview',
    title: 'The essentials',
    paragraphs: [
      'Hike Globally is an affiliate travel platform. This policy describes how information may be collected and used when you visit our website or contact us. Independent travel providers and other third parties have their own privacy policies.',
    ],
  },
  {
    id: 'information',
    title: 'Information you share',
    paragraphs: [
      'When you send an enquiry, you may provide your name, email address, phone number, country, travel preferences, dates and message. Please avoid sending sensitive personal information unless it is necessary to your enquiry.',
      'We use the information you provide to respond to your enquiry and communicate about your travel interests.',
    ],
  },
  {
    id: 'automatic',
    title: 'Information collected automatically',
    paragraphs: [
      'When you visit, technical information such as IP address, browser, device, pages visited and interactions may be collected through server logs, cookies or similar technologies. This site uses Google Analytics, Google AdSense and Vercel Analytics, which may collect usage information in accordance with their own policies.',
      'You can manage cookies through your browser settings. Blocking cookies may affect some site features. Advertising and analytics providers may also offer their own controls.',
    ],
  },
  {
    id: 'sharing',
    title: 'Who may receive information',
    paragraphs: [
      'Our enquiry form uses FormSubmit to deliver messages. Hosting, analytics, advertising and other service providers may process information in order to provide their services. If you follow a link to a travel provider, that provider handles any information you share with them under its own policy.',
      'Affiliate links may use tracking technologies to attribute referrals and commissions. We may also disclose information where required by law or to protect rights and safety.',
    ],
  },
  {
    id: 'retention',
    title: 'Retention and security',
    paragraphs: [
      'We keep information for as long as reasonably needed for the purpose for which it was collected, to resolve issues, and to meet applicable obligations. We take reasonable steps to protect information, but no method of transmission or storage is completely secure.',
    ],
  },
  {
    id: 'choices',
    title: 'Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, delete or object to certain uses of your personal information. Contact us to make a request; we may need to verify your identity and applicable law may limit some requests.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes and contact',
    paragraphs: [
      'We may update this policy as the site or our practices change. The current version will be available on this page. If you have a privacy question, please contact us using the link below.',
    ],
  },
]
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description={description}
      path="/privacy"
      sections={sections}
    />
  )
}
