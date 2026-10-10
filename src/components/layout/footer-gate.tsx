'use client'

import { usePathname } from 'next/navigation'

/**
 * The homepage ends at the "Plan your trip" (inquiry) section — the footer is deliberately not
 * shown there. Every other page keeps it.
 *
 * The root layout is shared by all frontend routes and cannot see the URL on the server, so the
 * switch is made here on the client. `children` stays a server-rendered subtree (the Footer still
 * fetches its CMS content on the server and is passed through untouched on every other route).
 */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Normalise a possible trailing slash so both '/' and '' count as the homepage.
  const normalised = pathname?.replace(/\/+$/, '') || ''
  if (normalised === '') return null

  return <>{children}</>
}
