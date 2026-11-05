import { permanentRedirect } from 'next/navigation'

/** Preserve old enquiry links, including trip and departure-date parameters. */
export default async function InquiryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else if (value !== undefined) params.append(key, value)
  }
  const query = params.toString()
  permanentRedirect(`/contact${query ? `?${query}` : ''}`)
}
