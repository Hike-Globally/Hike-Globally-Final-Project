import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Next 16 blocks cross-origin requests to the dev server unless the origin is allowlisted,
  // which would break the Payload admin and live preview behind a tunnel/proxy host.
  allowedDevOrigins: ['*.e2b.app', '*.arena.ai', '*.vercel.app'],

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
