import path from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Blog } from './collections/Blog'
import { Destinations } from './collections/Destinations'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Trips } from './collections/Trips'
import { Users } from './collections/Users'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Settings } from './globals/Settings'
import { defaultLocale, localeMeta, locales } from './i18n/config'
import { migrations } from './migrations'
import { resolveSiteUrl } from './lib/site-url'
import { trustedOrigins } from './lib/trusted-origins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Accepts Payload's convention (DATABASE_URI), Neon/Supabase (DATABASE_URL), and Vercel Postgres (POSTGRES_URL).
const databaseUri =
  process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
const isLocalDatabase = /localhost|127\.0\.0\.1/.test(databaseUri)
// Normalized: Payload logs "Failed to create URL object" and silently falls back to http://localhost
// for a schemeless `serverURL`, which then breaks admin CORS/CSRF and live preview.
const siteUrl = resolveSiteUrl()
const payloadSecret =
  process.env.PAYLOAD_SECRET ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'hike-globally-default-payload-secret-change-in-production'

// Allow high-resolution photos and long-form expedition footage without keeping uploads in RAM.
const maxMediaUploadSize = 1024 * 1024 * 1024

export default buildConfig({
  admin: {
    user: 'users',
    theme: 'light',
    components: {
      beforeLogin: ['@/components/admin/login-gallery'],
      afterLogin: ['@/components/admin/login-footer'],
      // The sidebar rail: a pinned brand header above the links, and a sign-out block that
      // verifies the session is really gone before it leaves the page.
      beforeNav: ['@/components/admin/nav-brand'],
      logout: {
        Button: '@/components/admin/nav-sign-out',
      },
      graphics: {
        Logo: '@/components/admin/admin-logo',
        Icon: '@/components/admin/admin-icon',
      },
      views: {
        dashboard: {
          Component: '@/components/admin/dashboard',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Hike Globally',
      robots: 'noindex, nofollow',
    },
    livePreview: {
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 390, height: 844 },
        { name: 'tablet', label: 'Tablet', width: 834, height: 1112 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
    },
  },

  // Lexical is Payload's default rich-text editor. It stores structured JSON (not HTML), which
  // lets the frontend render it with zero client-side JavaScript.
  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: databaseUri,
      // Hosted Postgres (Neon/Supabase/Vercel) requires TLS; local dev does not.
      ssl:
        !databaseUri || isLocalDatabase
          ? false
          : process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true'
            ? { rejectUnauthorized: true }
            : { rejectUnauthorized: false },
      // Serverless-friendly default. Override with DATABASE_POOL_MAX=1 for single-connection
      // databases (PGlite, pgBouncer in transaction mode, SQLite bridges).
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
    prodMigrations: migrations,
    // `push` is intentionally NOT used: production changes go through real migration files
    // (npm run migrate:create). Set PAYLOAD_PUSH=true only for throwaway local databases.
    // push: process.env.PAYLOAD_PUSH === 'true',
  }),

  collections: [Users, Media, Destinations, Trips, Blog, Pages],
  globals: [Header, Footer, Settings],

  localization: {
    defaultLocale,
    locales: locales.map((code) => ({
      code,
      label: localeMeta[code].adminLabel,
      rtl: false,
    })),
    // Fallback: a missing German translation transparently serves the English text instead of
    // an empty string, so a partially translated site never shows blank sections.
    fallback: true,
  },

  secret: payloadSecret,
  serverURL: siteUrl,
  sharp,
  telemetry: false,

  // Shared with the middleware, which defers to these origins instead of rewriting their headers.
  cors: trustedOrigins(),
  csrf: trustedOrigins(),

  upload: {
    // Leave headroom for multipart form fields and let temporary files handle large video uploads.
    requestSizeLimit: maxMediaUploadSize + 10 * 1024 * 1024,
    uploadTimeout: 10 * 60 * 1000,
    useTempFiles: true,
    tempFileDir: tmpdir(),
    abortOnLimit: true,
    limits: {
      fileSize: maxMediaUploadSize,
    },
  },

  plugins: [
    // Media lives on Vercel Blob in production (the filesystem is read-only there).
    // With no token present the plugin is a no-op and uploads fall back to ./public/media.
    vercelBlobStorage({
      collections: { media: true },
      // Upload directly from the browser to avoid Vercel Functions' 4.5 MB request limit.
      clientUploads: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    }),
  ],

  graphQL: {
    schemaOutputFile: path.resolve(dirname, '../generated-schema.graphql'),
  },

  routes: {
    api: '/api',
  },

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
