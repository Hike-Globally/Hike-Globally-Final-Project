'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { ResolvedLink } from '@/lib/links'
import { cn } from '@/lib/utils'

export type NavLink = ResolvedLink

export function MobileNav({
  links,
  actions,
  label,
}: {
  links: NavLink[]
  actions: NavLink[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden" aria-label={label}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[86vw] max-w-sm px-0">
        <SheetTitle className="sr-only">{label}</SheetTitle>
        <SheetDescription className="sr-only">{label}</SheetDescription>

        <nav className="flex flex-1 flex-col gap-1 px-6 pt-16">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                target={link.newTab ? '_blank' : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  'border-b border-black/5 py-4 font-heading text-xl font-semibold tracking-tight transition-colors',
                  active ? 'text-deep' : 'text-ink hover:text-deep',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-col gap-3 px-6 pb-8">
          {actions.map((action) => (
            <Button key={action.href} asChild size="lg" className="w-full">
              <Link href={action.href} onClick={() => setOpen(false)}>
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
