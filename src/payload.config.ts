import path from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
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
import { resolveMediaStorage } from './lib/media-storage'
import { MEDIA_FILES_TABLE } from './lib/media-storage-schema'
import { resolveSiteUrl } from './lib/site-url'
import { trustedOrigins } from './lib/trusted-origins'
import { mediaStoragePlugin } from './storage/plugin'

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

// Where uploaded files physically live: Vercel Blob when a token is configured, Postgres on a
// serverless host that has no external storage, and the local disk everywhere else. The rules (and
// the reasoning) are in src/lib/media-storage.ts.
const mediaStorage = resolveMediaStorage()

// Which storage the deployment actually uses, and why — logged once per process so an upload that
// fails because of missing storage configuration is never a mystery again.
const logMediaStorage = mediaStorage.mode === 'database' ? console.warn : console.log
logMediaStorage(`[media] storage mode: ${mediaStorage.mode} — ${mediaStorage.reason}`)

export default buildConfig({
  admin: {
    user: 'users',
    theme: 'light',
    components: {
      beforeLogin: ['@/components/admin/login-gallery'],
      afterLogin: ['@/components/admin/login-footer'],
      // The sidebar rail is a bespoke component (brand header, filterable sections, pinned
      // account footer). `logout.Button` points at the same sign-out the rail renders, so
      // Payload's own logout slot keeps working if the default nav is ever restored.
      Nav: '@/components/admin/nav',
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
      // Default to a visible pane on the first visit, while keeping Payload's normal preference
      // persistence so editors can collapse it once and reopen it whenever they need it.
      openByDefault: true,
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 390, height: 844 },
        { name: 'tablet', label: 'Tablet', width: 834, height: 1112 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
    },
  },

  // Lexical is Payload's default rich-text editor. It stores structured JSON (not HTML), which
  // lets the frontend render it with zero client-side JavaScript.
  //
  // Out of the box Lexical only shows a floating popup toolbar once you select some text, so the
  // available formatting is invisible until you know to look for it. Adding `FixedToolbarFeature`
  // pins a full ribbon above the editor — headings, bold/italic/underline, lists, alignment,
  // links, quotes, images — always on screen, the way MS Word and the WordPress editor behave.
  // Every standard feature already registers its own fixed-toolbar group, so enabling this one
  // feature surfaces the whole set; nothing is added to the stored document shape.
  //
  // `EXPERIMENTAL_TableFeature` is the one thing the default set does not include, and the reason
  // is worth knowing: tables are not a formatting flag but three extra node types (`table`,
  // `tablerow`, `tablecell`), so anything that renders rich text has to understand them. Payload
  // names the feature "experimental" (it is the only table implementation it ships in this
  // version), and the frontend renderer here does — see `src/components/content/rich-text.tsx`,
  // styled by the `.prose-hg table` rules in `src/app/(frontend)/globals.css`.
  //
  // What an editor gets: a **Table** item in the ribbon's `+` dropdown (and `/table` in the slash
  // menu) that opens a rows × columns dialog, then hover controls on the inserted table for
  // adding/removing rows and columns, merging cells, marking a header row or column and dragging
  // column widths. It is enabled on the shared editor, so every rich-text field has it — the
  // trip's post-itinerary content sections and a blog post's body included.
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
    ],
    admin: {
      placeholder: 'Start writing…',
    },
  }),

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

    // Payload's dev-mode schema push only knows the tables it generates from the config. The
    // media store's `media_files` table is owned by the migration / boot-time DDL, so without this
    // filter drizzle offers to DROP it on every dev start — one stray `y` and every stored upload
    // is gone. Excluding it from introspection keeps push for everything else. (tablesFilter only
    // affects drizzle-kit push; `npm run migrate:create` is unaffected.)
    tablesFilter: [`!${MEDIA_FILES_TABLE}`],
  }),

  collections: [Users, Media, Destinations, Trips, Blog, Pages],
  globals: [Header, Footer, Settings],

  // The site is English-only, so Payload is configured with a single locale: the admin shows no
  // language selector, and localized fields fall back to that one locale. Keeping the layer in
  // place means adding a language back is a one-line change in src/i18n/config.ts, and existing
  // content tables (`_locales` columns) stay valid.
  localization: {
    defaultLocale,
    locales: locales.map((code) => ({
      code,
      label: localeMeta[code].label,
      rtl: false,
    })),
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

  plugins: [mediaStoragePlugin(mediaStorage.mode)],

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
