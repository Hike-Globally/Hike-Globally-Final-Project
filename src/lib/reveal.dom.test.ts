import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { JSDOM } from 'jsdom'
import { act, createElement, type ComponentType, type ReactNode } from 'react'
import { Reveal } from '../components/motion/reveal'

// React's createElement overload does not infer required children from its trailing arguments.
const TestReveal = Reveal as ComponentType<{ once?: boolean; children?: ReactNode }>

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://hikeglobally.test/',
  pretendToBeVisual: true,
})
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node']) {
  Object.defineProperty(globalThis, key, {
    value: (dom.window as unknown as Record<string, unknown>)[key],
    configurable: true,
    writable: true,
  })
}
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { value: true, configurable: true })
Object.defineProperty(dom.window, 'innerHeight', { value: 800, configurable: true })
Object.defineProperty(dom.window, 'matchMedia', {
  value: () => ({ matches: false }),
  configurable: true,
})
Object.defineProperty(dom.window.HTMLElement.prototype, 'getBoundingClientRect', {
  value: () => ({ top: 1000 }),
  configurable: true,
})

const observers: FakeObserver[] = []
class FakeObserver {
  elements = new Set<Element>()
  disconnected = false
  constructor(private callback: IntersectionObserverCallback) {
    observers.push(this)
  }
  observe(element: Element) {
    this.elements.add(element)
  }
  unobserve(element: Element) {
    this.elements.delete(element)
  }
  disconnect() {
    this.disconnected = true
    this.elements.clear()
  }
  emit(element: Element, isIntersecting: boolean) {
    this.callback(
      [{ target: element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}
Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: FakeObserver,
  configurable: true,
})
const { createRoot } = await import('react-dom/client')
after(() => dom.window.close())

test('multiple mounted reveals share the observer while preserving once and replay behavior', async () => {
  const container = document.getElementById('root')!
  const root = createRoot(container)
  await act(async () => {
    root.render(
      createElement(
        'div',
        null,
        createElement(TestReveal, { once: true }, 'First reveal'),
        createElement(TestReveal, { once: false }, 'Repeating reveal'),
      ),
    )
  })
  const [once, repeat] = [...container.querySelectorAll('div > div > div')] as HTMLElement[]
  assert.ok(once && repeat)
  assert.equal(observers.length, 1)
  const observer = observers[0]!
  assert.equal(observer.elements.size, 2)
  assert.equal(once.style.opacity, '0')
  assert.equal(repeat.style.opacity, '0')
  await act(async () => {
    observer.emit(once, true)
    observer.emit(repeat, true)
  })
  assert.equal(once.style.opacity, '1')
  assert.equal(repeat.style.opacity, '1')
  assert.equal(observer.elements.has(once), false)
  assert.equal(observer.elements.has(repeat), true)
  await act(async () => observer.emit(repeat, false))
  assert.equal(repeat.style.opacity, '0')
  await act(async () => observer.emit(repeat, true))
  assert.equal(repeat.style.opacity, '1')
  await act(async () => root.unmount())
  assert.equal(observer.disconnected, true)
})

test('missing observer and reduced motion both leave content visible', async () => {
  const container = document.getElementById('root')!
  const savedObserver = globalThis.IntersectionObserver
  const savedMatchMedia = window.matchMedia
  const root = createRoot(container)
  try {
    // Neither case should arm a reveal or hide content.
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      value: undefined,
      configurable: true,
    })
    await act(async () => root.render(createElement(Reveal, null, 'No observer')))
    assert.equal((container.firstElementChild as HTMLElement).style.opacity, '1')

    Object.defineProperty(globalThis, 'IntersectionObserver', {
      value: savedObserver,
      configurable: true,
    })
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: true }),
      configurable: true,
    })
    await act(async () =>
      root.render(createElement(TestReveal, { key: 'reduced' }, 'Reduced motion')),
    )
    assert.equal((container.firstElementChild as HTMLElement).style.opacity, '1')
    assert.equal(observers.length, 1, 'neither fallback creates an observer')
  } finally {
    await act(async () => root.unmount())
    Object.defineProperty(globalThis, 'IntersectionObserver', {
      value: savedObserver,
      configurable: true,
    })
    Object.defineProperty(window, 'matchMedia', { value: savedMatchMedia, configurable: true })
  }
})
