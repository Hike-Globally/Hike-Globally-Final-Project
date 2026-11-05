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
    // Next optimizes and resizes on demand: one responsive `srcset` per image, served as AVIF or
    // WebP to browsers that accept it, at the width the layout actually renders. CMS media is
    // still addressed by its original `media.url` (`src/components/ui/payload-image.tsx`), so the
    // full-resolution file is the source and never a Payload-derived crop.
    remotePatterns: [
      // Vercel Blob storage in production
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Amazon S3 / Cloudflare R2 / DigitalOcean Spaces, if you swap the storage adapter
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      // Homepage hero background image
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/photo-1718880474770-1952b4e5f37c',
      },
    ],
  },

  // Payload + sharp must never be bundled by the Next compiler.
  serverExternalPackages: ['sharp', 'payload', '@payloadcms/db-postgres'],

  async redirects() {
    // Retire the legacy `/en`, `/de` and `/fr` locale prefixes with CDN-level 308 redirects
    // (preserving query strings automatically) so `src/middleware.ts` does not have to run Fluid
    // Compute CPU on every public storefront request.
    return [
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
  },

  async headers() {
    return [
      {
        // Baseline security headers on every response. HSTS is safe here: production is HTTPS
        // only (see README, Deployment) and this header is ignored over plain HTTP.
        //
        // No Content-Security-Policy: GA4, AdSense, the Pexels hero video and Vercel Blob all need
        // their own sources, and guessing one would break ads or analytics. That is a separate,
        // report-only exercise.
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The admin renders the site in a live-preview iframe, which is same origin, so
          // SAMEORIGIN keeps that working while blocking third-party framing.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
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
