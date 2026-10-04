import '@fontsource-variable/archivo/wght.css'
import '@fontsource-variable/google-sans-flex/wght.css'

import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import type React from 'react'

import { importMap } from './admin/importMap'
// Payload's own admin stylesheet — theme variables, layout grid, nav rail, form controls.
// Must come before `custom.scss`, which overrides it.
import '@payloadcms/next/css'
import './custom.scss'

/**
 * Root layout for the Payload admin panel.
 *
 * `serverFunction` is the bridge that lets client components inside the admin call
 * server-only code (server functions). It is created here and handed to RootLayout.
 */
const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export const metadata = {
  title: 'Hike Globally · CMS',
  description: 'Content management for the Hike Globally website',
  robots: 'noindex, nofollow',
}

const Layout = ({ children }: { children: React.ReactNode }) =>
  RootLayout({ config, children, importMap, serverFunction })

export default Layout
