import type { Access, FieldAccess } from 'payload'

type UserWithRoles = {
  id?: string | number
  collection?: string
  roles?: string[] | null
} | null

const rolesOf = (user: unknown): string[] => {
  const roles = (user as UserWithRoles)?.roles
  return Array.isArray(roles) ? roles : []
}

export const isAdmin = (user: unknown): boolean => rolesOf(user).includes('admin')

export const isAdminOrEditor = (user: unknown): boolean =>
  rolesOf(user).includes('admin') || rolesOf(user).includes('editor')

/** Public visitors can read published content; logged-in editors see drafts too. */
export const publishedOrSignedIn: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

/** Anyone, including anonymous visitors. Used for Media and public globals. */
export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

/** Only admins can create/delete users and other destructive operations. */
export const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

/** Editors can write content; only admins can delete it. */
export const adminOrEditor: Access = ({ req: { user } }) => isAdminOrEditor(user)

/** Users can always see and edit their own account; admins see everyone. */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}

/** Field-level guard: only admins may flip sensitive flags (featured, roles, …). */
export const adminFieldLevel: FieldAccess = ({ req: { user } }) => isAdmin(user)
