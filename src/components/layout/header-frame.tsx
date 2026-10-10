'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { sitePath } from '@/i18n/config'
import { cn } from '@/lib/utils'

/**
 * Wraps the site header and decides whether it floats over the page content.
 *
 * - Every other page: the header keeps its in-flow footprint, so page headers sit below it.
 * - Homepage: the header takes no space of its own and floats above the full-viewport hero
 *   (`z-50`, above the hero's `z-0`), so the hero starts at the very top of the screen.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const overlaysHero = pathname === sitePath('/')

  return <header className={cn('hg-header', overlaysHero && 'hg-header--overlay')}>{children}</header>
}
