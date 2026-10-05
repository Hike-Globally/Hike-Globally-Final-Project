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
  },

  images: {
    // AVIF first — roughly 50% smaller than WebP at the same visual quality.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Vercel Blob storage in production
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Amazon S3 / Cloudflare R2 / DigitalOcean Spaces, if you swap the storage adapter
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },

  // Payload + sharp must never be bundled by the Next compiler.
  serverExternalPackages: ['sharp', 'payload', '@payloadcms/db-postgres'],

  typescript: { ignoreBuildErrors: false },
}

export default withPayload(nextConfig)
