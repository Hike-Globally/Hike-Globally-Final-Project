/**
 * `next/image`, interop-safe.
 *
 * The Next.js build hands `import Image from 'next/image'` the component directly. Our tsx-run
 * unit tests (node:test + jsdom, see src/lib/mega-menu.dom.test.ts) import this module graph
 * without Next's SWC ESM/CJS interop, where the binding arrives double-wrapped as
 * `{ default: Component, getImageProps }` and React rejects it ("Element type is invalid…").
 *
 * The guard unwraps at most one level and is a no-op in a Next build, so both worlds render the
 * same component. Import this instead of `next/image` in any component a dom test renders —
 * or may render later.
 */
import NextImage from 'next/image'

type ImageComponent = typeof NextImage

const interop = NextImage as unknown as { default?: ImageComponent } | ImageComponent
const unwrapped =
  typeof interop === 'object' && interop !== null && 'default' in interop && interop.default
    ? interop.default
    : (interop as ImageComponent)

export default unwrapped as ImageComponent
