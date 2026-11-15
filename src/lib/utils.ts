import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Custom tailwind-merge instance aware of `@theme`'s `--text-*` typography scale tokens in
 * `globals.css`, so font-size classes (`text-ui`, `text-small`, `text-body`, …) never collide
 * with or strip text-colour classes (`text-white`, `text-ink`, …).
 */
const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'hero',
            'section',
            'card',
            'subhead',
            'lead',
            'body',
            'small',
            'label',
            'ui',
          ],
        },
      ],
    },
  },
})

/** shadcn/ui's canonical class merger: conditional classes + Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
