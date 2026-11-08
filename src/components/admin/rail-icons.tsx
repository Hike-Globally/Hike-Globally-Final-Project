import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  Images,
  LayoutDashboard,
  LogOut,
  MapPin,
  Mountain,
  PanelBottom,
  PanelLeftClose,
  PanelTop,
  Search,
  Settings,
  Signpost,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SVGProps } from 'react'

/**
 * The navigation rail's icon set.
 *
 * One set only: every icon is a Lucide glyph, the same library the dashboard and
 * the rest of the admin use, so stroke weight and optical size are identical
 * everywhere. Each glyph is drawn on a 24px grid with the shared 1.75 stroke.
 *
 * Size is left to CSS (`--hg-icon-size`), which keeps icon buttons, rail items
 * and table cells aligned without per-icon dimensions.
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
  | 'redirects'
  | 'search'
  | 'settings'
  | 'sign-out'
  | 'trips'
  | 'users'
  | 'x'

const icons: Record<RailIconName, LucideIcon> = {
  account: UserRound,
  blog: BookOpen,
  'chevron-right': ChevronRight,
  collapse: PanelLeftClose,
  collection: Folder,
  dashboard: LayoutDashboard,
  destinations: MapPin,
  external: ExternalLink,
  media: Images,
  pages: FileText,
  'panel-bottom': PanelBottom,
  'panel-top': PanelTop,
  redirects: Signpost,
  search: Search,
  settings: Settings,
  'sign-out': LogOut,
  trips: Mountain,
  users: Users,
  x: X,
}

type RailIconProps = SVGProps<SVGSVGElement> & {
  name: RailIconName
  size?: number | string
}

export function RailIcon({ name, size, strokeWidth, ...props }: RailIconProps) {
  const Icon = icons[name] ?? Folder

  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      size={size}
      strokeWidth={strokeWidth ?? 1.75}
      {...props}
    />
  )
}

export default RailIcon
