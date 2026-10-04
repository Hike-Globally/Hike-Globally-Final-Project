import type { ReactElement, ReactNode, SVGProps } from 'react'

/**
 * The navigation rail's icon set.
 *
 * A tiny, hand-tuned Lucide-style set drawn on a 24px grid with a 1.7 stroke, so every icon in the
 * rail shares the same optical weight. Icons inherit `currentColor`, which lets the rail recolour
 * them on hover and for the active state without a second asset.
 */

export type RailIconName =
  | 'account'
  | 'blog'
  | 'chevron-right'
  | 'collapse'
  | 'collection'
  | 'dashboard'
  | 'destinations'
  | 'external'
  | 'media'
  | 'pages'
  | 'panel-bottom'
  | 'panel-top'
  | 'search'
  | 'settings'
  | 'sign-out'
  | 'trips'
  | 'users'
  | 'x'

type IconProps = SVGProps<SVGSVGElement>

const Icon = ({ children, ...props }: IconProps & { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.7}
    viewBox="0 0 24 24"
    {...props}
  >
    {children}
  </svg>
)

const icons: Record<RailIconName, (props: IconProps) => ReactElement> = {
  // The workspace home — an abstract summit, matching the brand mark.
  dashboard: (props) => (
    <Icon {...props}>
      <path d="m4 16 5.2-7.4 3.1 4.3 2-2.6L20 16" />
      <path d="M3 19.5h18" />
    </Icon>
  ),
  trips: (props) => (
    <Icon {...props}>
      <path d="m8.5 3.5 4 8 4.5-4.5L21 20.5H3L8.5 3.5Z" />
    </Icon>
  ),
  destinations: (props) => (
    <Icon {...props}>
      <path d="M20 10c0 5-8 11.5-8 11.5S4 15 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  ),
  blog: (props) => (
    <Icon {...props}>
      <path d="M12 6.5C12 6.5 10 4 6.5 4H3v14h4c3 0 5 2 5 2s2-2 5-2h4V4h-3.5C14 4 12 6.5 12 6.5Z" />
      <path d="M12 6.5v13.5" />
    </Icon>
  ),
  pages: (props) => (
    <Icon {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </Icon>
  ),
  media: (props) => (
    <Icon {...props}>
      <rect height="16" rx="2.5" width="18" x="3" y="4" />
      <circle cx="8.75" cy="9.5" r="1.6" />
      <path d="m4 17 4.4-4.2a2 2 0 0 1 2.7 0L20 20.5" />
    </Icon>
  ),
  users: (props) => (
    <Icon {...props}>
      <path d="M15.5 20v-1.6a3.9 3.9 0 0 0-3.9-3.9H6.4A3.9 3.9 0 0 0 2.5 18.4V20" />
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M21.5 20v-1.6a3.9 3.9 0 0 0-2.9-3.8" />
      <path d="M16 4.2a3.5 3.5 0 0 1 0 6.6" />
    </Icon>
  ),
  'panel-top': (props) => (
    <Icon {...props}>
      <rect height="16" rx="2.5" width="18" x="3" y="4" />
      <path d="M3 9.5h18" />
    </Icon>
  ),
  'panel-bottom': (props) => (
    <Icon {...props}>
      <rect height="16" rx="2.5" width="18" x="3" y="4" />
      <path d="M3 15h18" />
    </Icon>
  ),
  settings: (props) => (
    <Icon {...props}>
      <path d="M4 7h9.5" />
      <path d="M18 7h2" />
      <path d="M4 17h3" />
      <path d="M11.5 17H20" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="9.2" cy="17" r="2.2" />
    </Icon>
  ),
  collection: (props) => (
    <Icon {...props}>
      <rect height="7" rx="2" width="8" x="3" y="3.5" />
      <rect height="7" rx="2" width="8" x="13" y="3.5" />
      <rect height="7" rx="2" width="8" x="3" y="13.5" />
      <rect height="7" rx="2" width="8" x="13" y="13.5" />
    </Icon>
  ),
  search: (props) => (
    <Icon {...props}>
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.5 15.5 4 4" />
    </Icon>
  ),
  'sign-out': (props) => (
    <Icon {...props}>
      <path d="M14.5 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5" />
      <path d="m10 16.5-4.5-4.5L10 7.5" />
      <path d="M5.5 12h9" />
    </Icon>
  ),
  account: (props) => (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19a6.4 6.4 0 0 1 11 0" />
    </Icon>
  ),
  external: (props) => (
    <Icon {...props}>
      <path d="M7.5 16.5 16.5 7.5" />
      <path d="M9.5 7.5h7v7" />
    </Icon>
  ),
  collapse: (props) => (
    <Icon {...props}>
      <path d="m13.5 7.5-4.5 4.5 4.5 4.5" />
      <path d="M19 5.5v13" />
    </Icon>
  ),
  'chevron-right': (props) => (
    <Icon {...props}>
      <path d="m10 7 5 5-5 5" />
    </Icon>
  ),
  x: (props) => (
    <Icon {...props}>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M17.5 6.5 6.5 17.5" />
    </Icon>
  ),
}

export const RailIcon = ({ name, ...props }: { name: RailIconName } & IconProps) => {
  const Component = icons[name] ?? icons.collection
  return <Component {...props} />
}
