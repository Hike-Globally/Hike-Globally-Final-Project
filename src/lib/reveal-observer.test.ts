import assert from 'node:assert/strict'
import { test } from 'node:test'

import { observeReveal } from '../components/motion/reveal-observer'

test('reveal observers share a single subscription and clean up independently', () => {
  const previous = globalThis.IntersectionObserver
  const instances: FakeObserver[] = []
  class FakeObserver {
    observed = new Set<Element>()
    disconnected = false
    constructor(
      public callback: IntersectionObserverCallback,
      public options: IntersectionObserverInit,
    ) {
      instances.push(this)
    }
    observe(element: Element) {
      this.observed.add(element)
    }
    unobserve(element: Element) {
      this.observed.delete(element)
    }
    disconnect() {
      this.disconnected = true
      this.observed.clear()
    }
    emit(element: Element, isIntersecting: boolean) {
      this.callback(
        [{ target: element, isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
    }
  }
  globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver

  try {
    const first = {} as Element
    const second = {} as Element
    const seen: string[] = []
    let stopOnce = () => {}
    stopOnce = observeReveal(first, (entry) => {
      seen.push(`once:${entry.isIntersecting}`)
      if (entry.isIntersecting) stopOnce()
    })
    const stopRepeat = observeReveal(second, (entry) => seen.push(`repeat:${entry.isIntersecting}`))
    const stopExtra = observeReveal(second, (entry) => seen.push(`extra:${entry.isIntersecting}`))
    assert.equal(instances.length, 1)
    const instance = instances[0]!
    assert.deepEqual(instance.options, { threshold: 0, rootMargin: '0px 0px -8% 0px' })
    assert.deepEqual([...instance.observed], [first, second])

    instance.emit(first, true)
    instance.emit(first, false) // once-only callback has removed itself
    instance.emit(second, true)
    stopExtra()
    instance.emit(second, false)
    assert.deepEqual(seen, ['once:true', 'repeat:true', 'extra:true', 'repeat:false'])
    assert.deepEqual([...instance.observed], [second])
    assert.equal(instance.disconnected, false)

    stopOnce() // cleanup is idempotent, including after once-only removal
    stopRepeat()
    assert.equal(instance.disconnected, true)
    const stopNew = observeReveal(first, () => {})
    assert.equal(instances.length, 2, 'a fresh observer is created after the last cleanup')
    stopNew()
    assert.equal(instances[1]!.disconnected, true)
  } finally {
    globalThis.IntersectionObserver = previous
  }
})
