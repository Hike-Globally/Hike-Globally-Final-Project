import { withPayload } from '@payloadcms/next/withPayload'

// Keep in sync with `maxMediaUploadSize` in `src/payload.config.ts` (plus the same 10 MB of
// headroom Payload reserves for the multipart form fields around the file).
const maxMediaUploadSize = 1024 * 1024 * 1024

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Next 16 blocks cross-origin requests to the dev server unless the origin is allowlisted,
  // which would break the Payload admin and live preview behind a tunnel/proxy host.
  allowedDevOrigins: ['*.e2b.app', '*.arena.ai', '*.vercel.app'],

  experimental: {
    // Every request that matches `src/middleware.ts` (which includes all of /api) has its body
    // cloned so the proxy can read it — and Next truncates that clone at 10 MB by default
    // (`proxyClientMaxBodySize`), logging "Request body exceeded 10MB … Only the first 10MB
    // will be available". The route handler then receives a half-finished multipart body, and
    // Payload's uploader dies with `Unexpected end of form` / a 500 for any photo or video bigger
    // than 10 MB — even though `payload.config.ts` raises the upload limit to 1 GB precisely so
    // high-resolution expedition photos can go in. Raise the proxy limit to match it; the whole
    // body is only buffered in memory while a request is in flight, and Payload streams it
    // straight to a temp file (`upload.useTempFiles`).
    proxyClientMaxBodySize: maxMediaUploadSize + 10 * 1024 * 1024,

    // Barrel-import optimisation. `lucide-react` ships 1,500+ icons from a single entry point;
    // importing even one icon naively pulls the whole barrel into the bundle. This tells Next to
    // compile each icon to its own module so a page only ships the handful it actually renders.
    // (lucide-react is imported across 28 components — the single biggest client-JS win here.)
    optimizePackageImports: ['lucide-react'],
  },

  images: {
    // Serve original bytes everywhere (including bundled design assets), not a resized or
    // re-encoded /_next/image variant. CMS uploads also use their original media.url.
    unoptimized: true,
    remotePatterns: [
      // Vercel Blob storage in production
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Amazon S3 / Cloudflare R2 / DigitalOcean Spaces, if you swap the storage adapter
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      // The homepage hero photograph is not listed here: it is bundled with the site at
      // `public/images/home/hero-bg.webp` and served from our own origin.
    ],
  },

  // Payload + sharp must never be bundled by the Next compiler.
  serverExternalPackages: ['sharp', 'payload', '@payloadcms/db-postgres'],

  async redirects() {
    // Retire the legacy `/en`, `/de` and `/fr` locale prefixes with CDN-level 308 redirects
    // (preserving query strings automatically) so `src/middleware.ts` does not have to run Fluid
    // Compute CPU on every public storefront request.
    const localeRedirects = [
      {
        source: '/:locale(en|de|fr)',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:locale(en|de|fr)/:path+',
        destination: '/:path+',
        permanent: true,
      },
    ]

    // `/cdn-cgi/*` belongs to Cloudflare, not to this app. Email Address Obfuscation (on by default
    // on every Cloudflare zone) rewrites `mailto:` links to `/cdn-cgi/l/email-protection`, a path
    // with no document behind it — so crawlers follow a dead link on every page and file it as
    // broken (Semrush) or as a soft 404 (Search Console).
    //
    // `src/lib/public-email.ts` is the real fix: the pages no longer emit that link, so nothing new
    // points here. This redirect is the safety net for URLs already in crawler indexes and in other
    // people's bookmarks — they land on the contact page, which carries the form and the address,
    // instead of on a dead end. It only fires if the request reaches Next.js at all; when Cloudflare
    // proxies the zone the edge normally answers first.
    const cloudflareEmailProtection = {
      source: '/cdn-cgi/l/email-protection',
      destination: '/contact',
      permanent: true,
    }

    return [...localeRedirects, cloudflareEmailProtection]
  },

  async headers() {
    return [
      {
        // Static design assets under public/images (logo, difficulty badges, hero art) are never
        // mutated in place, so a long browser cache makes repeat visits instant. Media served by
        // Payload (`/api/media/file/...`) is deliberately NOT touched here — its route handler
        // sets its own Cache-Control *and* Content-Security-Policy, which must not be clobbered.
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ]
  },

  typescript: { ignoreBuildErrors: false },
}

export default withPayload(nextConfig)
