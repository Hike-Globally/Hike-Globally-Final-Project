import type { ReactNode } from 'react'

/**
 * The global header floats above every page's opening section instead of adding
 * its own band before the hero. The zero-height sticky frame keeps it above the
 * content while leaving the hero's viewport-sized layout unchanged.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  return <header className="hg-header">{children}</header>
}
