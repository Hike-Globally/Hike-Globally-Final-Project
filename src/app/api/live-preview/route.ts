import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'

import { isAdminOrEditor } from '@/access'
import { isLocale } from '@/i18n/config'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/**
 * Authenticated Live Preview entry point. Payload's own session cookie is required before Next
 * Draft Mode is enabled; arbitrary visitors cannot turn a public URL into a draft-content reader.
 */
export async function GET(request: NextRequest) {
  const requestURL = new URL(request.url)
  const requestedPath = requestURL.searchParams.get('path')

  if (
    !requestedPath ||
    !requestedPath.startsWith('/') ||
    requestedPath.startsWith('//') ||
    requestedPath.includes('\\')
  ) {
    return new Response('A valid localized preview path is required.', { status: 400 })
  }

  let target: URL
  try {
    target = new URL(requestedPath, requestURL)
  } catch {
    return new Response('The preview path is invalid.', { status: 400 })
  }

  const locale = target.pathname.split('/')[1]
  if (
    target.origin !== requestURL.origin ||
    !isLocale(locale) ||
    target.pathname === '/admin' ||
    target.pathname.startsWith('/admin/') ||
    target.pathname === '/api' ||
    target.pathname.startsWith('/api/')
  ) {
    return new Response('Only localized site pages can be previewed.', { status: 400 })
  }

  let payload
  try {
    payload = await getPayloadClient()
  } catch {
    return new Response('Live Preview is unavailable until the CMS database is configured.', {
      status: 503,
    })
  }

  let user: unknown = null
  try {
    const authResult = await payload.auth({ headers: request.headers })
    user = authResult.user
  } catch {
    // Treat missing or invalid Payload sessions as unauthenticated.
  }

  if (!isAdminOrEditor(user)) {
    return new Response('You must be signed in as a content editor to preview drafts.', {
      status: 401,
    })
  }

  const preview = await draftMode()
  preview.enable()

  // Use the parsed same-origin path rather than the original input to avoid open redirects.
  redirect(`${target.pathname}${target.search}${target.hash}`)
}
