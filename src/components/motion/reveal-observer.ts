/**
 * All scroll reveals use the same observer settings. Share one observer rather than creating
 * one per section/card, while retaining independent subscriptions and cleanup for each element.
 */
type Listener = (entry: IntersectionObserverEntry) => void

const listeners = new Map<Element, Set<Listener>>()
let observer: IntersectionObserver | undefined

export function observeReveal(element: Element, listener: Listener): () => void {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Snapshot because a once-only reveal unsubscribes from inside its callback.
          for (const callback of [...(listeners.get(entry.target) ?? [])]) callback(entry)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )
  }

  let callbacks = listeners.get(element)
  if (!callbacks) {
    callbacks = new Set()
    listeners.set(element, callbacks)
    observer.observe(element)
  }
  callbacks.add(listener)

  let subscribed = true
  return () => {
    if (!subscribed) return
    subscribed = false
    const current = listeners.get(element)
    if (!current) return
    current.delete(listener)
    if (current.size === 0) {
      listeners.delete(element)
      observer?.unobserve(element)
    }
    if (listeners.size === 0) {
      observer?.disconnect()
      observer = undefined
    }
  }
}
