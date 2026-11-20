import assert from 'node:assert/strict'
import { after, beforeEach, test, type TestContext } from 'node:test'
import { JSDOM } from 'jsdom'
import { act, createElement, StrictMode } from 'react'
import { renderToString } from 'react-dom/server'

import { parseLinkPreviewMetadata, type ResolvedLinkPreview } from '../../lib/link-preview'
import { imageProxyUrl, LINK_PREVIEW_FALLBACK_IMAGE } from '../../lib/link-preview-image'
import { resolveMultiUrlPreview } from '../../lib/multi-url-preview-resolver'
import {
  multiPreviewKeyframes,
  type MultiPreviewAnimation,
  type MultiPreviewLayout,
} from '../../lib/multi-url-preview'
import { MultiUrlPreviewRail } from './multi-url-preview-rail'

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://hikeglobally.test',
  pretendToBeVisual: true,
})
const source = dom.window as unknown as Record<string, unknown>
for (const key of [
  'document',
  'navigator',
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'KeyboardEvent',
  'requestAnimationFrame',
  'cancelAnimationFrame',
]) {
  Object.defineProperty(globalThis, key, { value: source[key], configurable: true, writable: true })
}
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true })
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })

let reduced = false
const motionListeners = new Set<() => void>()
Object.defineProperty(dom.window, 'matchMedia', {
  value: () => ({
    get matches() {
      return reduced
    },
    addEventListener: (_: string, listener: () => void) => motionListeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => motionListeners.delete(listener),
  }),
})

const observers: EntryObserver[] = []
class EntryObserver {
  targets = new Set<Element>()
  constructor(private callback: IntersectionObserverCallback) {
    observers.push(this)
  }
  observe(target: Element) {
    this.targets.add(target)
  }
  unobserve(target: Element) {
    this.targets.delete(target)
  }
  disconnect() {
    this.targets.clear()
  }
  enter() {
    this.callback(
      [...this.targets].map((target) => ({
        target,
        isIntersecting: true,
      })) as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    )
  }
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: EntryObserver,
  configurable: true,
})

const effects: { frames: Keyframe[]; cancelled: boolean; options: KeyframeAnimationOptions }[] = []
Object.defineProperty(dom.window.HTMLElement.prototype, 'animate', {
  configurable: true,
  value: (frames: Keyframe[], options: KeyframeAnimationOptions) => {
    const record = { frames, options, cancelled: false }
    effects.push(record)
    const effect = {
      onfinish: null as (() => void) | null,
      oncancel: null as (() => void) | null,
      cancel: () => {
        record.cancelled = true
        effect.oncancel?.()
      },
    }
    return effect as unknown as Animation
  },
})

const { createRoot, hydrateRoot } = await import('react-dom/client')
const cards: ResolvedLinkPreview[] = Array.from({ length: 4 }, (_, index) => ({
  href: `/resources/${index}`,
  external: false,
  host: 'hikeglobally.test',
  title: `Resource ${index + 1}`,
  description: 'A useful trail guide.',
  image: null,
  price: 'US$ 700',
  originalPrice: 'US$ 900',
}))
const settle = (ms = 45) => new Promise((resolve) => setTimeout(resolve, ms))
const props = (
  layout: MultiPreviewLayout = 'carousel',
  animation: MultiPreviewAnimation = 'rise',
) => ({
  cards,
  layout,
  animation,
  heading: 'Worth exploring',
})

beforeEach(() => {
  reduced = false
  effects.length = 0
  observers.length = 0
})
after(() => {
  dom.window.close()
})

async function mount(
  t: TestContext,
  layout: MultiPreviewLayout = 'carousel',
  animation: MultiPreviewAnimation = 'rise',
) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })
  await act(async () => root.render(createElement(MultiUrlPreviewRail, props(layout, animation))))
  const track = container.querySelector<HTMLOListElement>('ol')!
  let width = 300
  Object.defineProperties(track, {
    clientWidth: { get: () => width },
    scrollWidth: { get: () => cards.length * 320 - 20 },
  })
  Array.from(track.children).forEach((slide, index) =>
    Object.defineProperties(slide, {
      offsetLeft: { get: () => index * 320 },
      offsetWidth: { get: () => 300 },
    }),
  )
  const scrolls: ScrollToOptions[] = []
  track.scrollTo = (options: ScrollToOptions | number = {}) => {
    if (typeof options === 'number') return
    scrolls.push(options)
    track.scrollLeft = options.left ?? 0
    track.dispatchEvent(new Event('scroll'))
  }
  const resize = async (value: number) => {
    width = value
    await act(async () => {
      window.dispatchEvent(new Event('resize'))
      await settle()
    })
  }
  await resize(width)
  const previous = () =>
    container.querySelector<HTMLButtonElement>('button[aria-label="Previous preview"]')
  const next = () => container.querySelector<HTMLButtonElement>('button[aria-label="Next preview"]')
  const key = async (target: Element, value: string, extras = {}) => {
    await act(async () => {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true, ...extras }),
      )
      await settle()
    })
  }
  const changeAnimation = async (value: MultiPreviewAnimation) => {
    await act(async () => root.render(createElement(MultiUrlPreviewRail, props(layout, value))))
  }
  return { container, track, previous, next, scrolls, resize, key, changeAnimation }
}

test('server markup contains every real link once, with no animation-dependent hidden content', () => {
  for (const layout of ['list', 'slider', 'carousel'] as const) {
    const html = renderToString(createElement(MultiUrlPreviewRail, props(layout)))
    const document = new JSDOM(html).window.document
    assert.equal(document.querySelectorAll('.link-preview-card').length, cards.length)
    assert.equal(
      document.querySelectorAll('li').length,
      cards.length,
      'no cloned slides or duplicate links',
    )
    assert.equal(document.querySelector('section')?.getAttribute('data-layout'), layout)
    assert.equal(document.querySelector('h2')?.textContent, 'Worth exploring')
    assert.doesNotMatch(
      html,
      /aria-hidden="true"[^>]*class="multi-url-preview__item|style="[^"]*opacity/,
    )
    assert.ok(
      document.querySelectorAll('img').length >= cards.length,
      'fallback thumbnails are populated before JavaScript',
    )
    if (layout === 'list') assert.equal(document.querySelector('button'), null)
  }
  assert.equal(renderToString(createElement(MultiUrlPreviewRail, { ...props(), cards: [] })), '')
})

test('one-link collections use the original card without unnecessary carousel controls', () => {
  const html = renderToString(
    createElement(MultiUrlPreviewRail, {
      ...props(),
      cards: cards.slice(0, 1),
      placement: 'inline',
    }),
  )
  const document = new JSDOM(html).window.document
  assert.ok(document.querySelector('[data-single]'))
  assert.equal(document.querySelector('button'), null)
  assert.equal(document.querySelector('ol')?.hasAttribute('tabindex'), false)
  assert.equal(document.querySelector('h3')?.textContent, 'Worth exploring')
})

test('buttons, native swipes and Home/End keep counts and disabled endpoints in sync', async (t) => {
  const rail = await mount(t)
  assert.equal(rail.previous()?.disabled, true)
  assert.equal(rail.next()?.disabled, false)
  await act(async () => {
    rail.next()?.click()
    await settle()
  })
  assert.equal(rail.track.scrollLeft, 320)
  assert.match(rail.container.textContent ?? '', /Showing link 2 of 4/)
  assert.equal(rail.previous()?.disabled, false)
  await rail.key(rail.track, 'End')
  assert.equal(rail.track.scrollLeft, 960)
  assert.equal(rail.next()?.disabled, true)
  await rail.key(rail.track, 'Home')
  assert.equal(rail.track.scrollLeft, 0)
  assert.equal(rail.previous()?.disabled, true)
  await act(async () => {
    rail.track.scrollLeft = 640
    rail.track.dispatchEvent(new Event('scroll'))
    await settle()
  })
  assert.match(rail.container.textContent ?? '', /Showing link 3 of 4/)
  assert.equal(rail.scrolls[0].behavior, 'smooth')
})

test('keyboard arrows move the focused link too; modifier keys and normal link activation are untouched', async (t) => {
  const rail = await mount(t, 'slider')
  const links = rail.container.querySelectorAll<HTMLAnchorElement>('a.link-preview-card')
  links[0].focus()
  await rail.key(links[0], 'ArrowRight')
  assert.equal(document.activeElement, links[1])
  assert.equal(rail.track.scrollLeft, 320)
  await rail.key(links[1], 'End')
  assert.equal(document.activeElement, links[3])
  await rail.key(links[3], 'ArrowLeft', { altKey: true })
  assert.equal(document.activeElement, links[3])
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  links[3].dispatchEvent(event)
  assert.equal(event.defaultPrevented, false)
  assert.equal(links[3].getAttribute('href'), '/resources/3')
})

test('responsive resizing updates visible ranges and removes controls when the whole collection fits', async (t) => {
  const rail = await mount(t, 'slider')
  await rail.resize(620)
  assert.match(rail.container.textContent ?? '', /Showing links 1 to 2 of 4/)
  await rail.resize(1300)
  assert.equal(rail.next(), null)
  assert.equal(rail.previous(), null)
  await rail.resize(300)
  assert.equal(rail.next()?.disabled, false)
})

for (const preset of ['fade', 'rise', 'slide', 'zoom', 'reveal'] as const) {
  test(`${preset} uses its real keyframes and cancels safely when motion preferences change`, async (t) => {
    const rail = await mount(t, 'slider', preset)
    await act(async () => observers.at(-1)?.enter())
    assert.equal(effects.length, cards.length)
    assert.deepEqual(effects[0].frames, multiPreviewKeyframes[preset])
    assert.ok(Number(effects[0].options.duration) >= 400)
    reduced = true
    await act(async () => {
      motionListeners.forEach((listener) => listener())
    })
    assert.ok(effects.every(({ cancelled }) => cancelled))
    assert.ok(rail.container.querySelector('.link-preview-card'))
    assert.equal(
      rail.container.querySelector<HTMLElement>('li')?.style.opacity,
      '',
      'cancellation cannot strand a hidden card',
    )
  })
}

test('reduced motion and None suppress Web Animations and use instant, accessible navigation', async (t) => {
  reduced = true
  const rail = await mount(t)
  await act(async () => observers.at(-1)?.enter())
  assert.equal(effects.length, 0)
  await act(async () => {
    rail.next()?.click()
    await settle(200)
  })
  assert.equal(rail.scrolls[0].behavior, 'instant')
  assert.equal(effects.length, 0)
  reduced = false
  const noMotion = await mount(t, 'carousel', 'none')
  await act(async () => {
    noMotion.next()?.click()
    await settle(200)
  })
  assert.equal(noMotion.scrolls[0].behavior, 'instant')
  assert.equal(effects.length, 0)
})

test('changing the animation in live preview observes the current carousel card, not an off-screen first card', async (t) => {
  const rail = await mount(t)
  await rail.key(rail.track, 'ArrowRight')
  assert.equal(rail.track.scrollLeft, 320)
  await rail.changeAnimation('reveal')
  const observer = observers.at(-1)!
  assert.deepEqual([...observer.targets], [rail.track.children[1]])
  await act(async () => observer.enter())
  assert.deepEqual(effects.at(-1)?.frames, multiPreviewKeyframes.reveal)
  assert.match(rail.container.textContent ?? '', /Showing link 2 of 4/)
})

test('server HTML hydrates under StrictMode without losing content or changing the region label', async (t) => {
  const container = document.createElement('div')
  const node = createElement(
    StrictMode,
    null,
    createElement(MultiUrlPreviewRail, props('list', 'none')),
  )
  container.innerHTML = renderToString(node)
  document.body.append(container)
  const warnings: string[] = []
  t.mock.method(console, 'error', (...args: unknown[]) => warnings.push(args.join(' ')))
  let root: ReturnType<typeof hydrateRoot>
  await act(async () => {
    root = hydrateRoot(container, node)
    await settle()
  })
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })
  const section = container.querySelector('section')!
  const heading = document.getElementById(section.getAttribute('aria-labelledby')!)
  assert.equal(heading?.textContent, 'Worth exploring')
  assert.equal(container.querySelectorAll('.link-preview-card').length, 4)
  assert.deepEqual(warnings, [])
})

test('Multi-URL cards hydrate with page images and retry featured, direct, body, then local fallback', async (t) => {
  const page = 'https://publisher.example.com/article'
  const featured = 'https://publisher.example.com/featured.jpg'
  const body = 'https://publisher.example.com/body.jpg'
  const resolved = await resolveMultiUrlPreview(
    {
      multiPreviewLinks: [
        { linkPreviewUrl: page },
        { linkPreviewUrl: 'https://publisher.example.com/no-featured' },
      ],
    },
    {
      metadata: async (url) =>
        parseLinkPreviewMetadata(
          url === page
            ? '<meta property="og:image" content="/featured.jpg"><img data-original="/body.jpg">'
            : '<img src="/only-body.jpg">',
          url,
        ),
    },
  )
  assert.ok(resolved)
  const container = document.createElement('div')
  const node = createElement(MultiUrlPreviewRail, {
    ...resolved,
    layout: 'list',
    animation: 'none',
  })
  container.innerHTML = renderToString(node)
  document.body.append(container)
  let root: ReturnType<typeof hydrateRoot>
  await act(async () => {
    root = hydrateRoot(container, node)
  })
  t.after(async () => {
    await act(async () => root.unmount())
    container.remove()
  })
  const image = () => container.querySelector('.link-preview-card img')!
  for (const src of [imageProxyUrl(featured, page), featured, imageProxyUrl(body, page), body]) {
    assert.equal(image().getAttribute('src'), src)
    await act(async () => {
      image().dispatchEvent(new Event('error'))
    })
  }
  assert.equal(image().getAttribute('src'), LINK_PREVIEW_FALLBACK_IMAGE)
  assert.equal(
    container.querySelectorAll('.link-preview-card img')[1].getAttribute('src'),
    imageProxyUrl(
      'https://publisher.example.com/only-body.jpg',
      'https://publisher.example.com/no-featured',
    ),
  )
})
