import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')

/** @type {import('next').NextConfig} */
export default {
  images: { unoptimized: true },
  allowedDevOrigins: ['*.e2b.app', '*.arena.ai'],
  // The preview compiles the site's own components and stylesheets, which live
  // outside this folder.
  outputFileTracingRoot: repo,
  turbopack: {
    root: repo,
    resolveAlias: {
      '@': path.join(repo, 'src'),
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
}
