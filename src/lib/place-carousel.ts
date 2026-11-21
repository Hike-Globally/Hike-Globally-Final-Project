/** Pure geometry helpers for the Browse places auto-plus-manual marquee. */

/** 28 px per second — slow enough to read a card, fast enough to feel alive. */
export const AUTO_SCROLL_SPEED = 0.028

/** Avoid a large jump when a tab has been in the background. */
export const MAX_FRAME_MS = 50

export const getAutoScrollDelta = (elapsedMs: number): number =>
  Math.max(0, Math.min(elapsedMs, MAX_FRAME_MS)) * AUTO_SCROLL_SPEED

/**
 * Width of one complete set of cards. The first card of the duplicated set sits
 * exactly one loop away from the first original, including the flex gap, so
 * this is more accurate than halving `scrollWidth` (which includes the track's
 * inline padding).
 */
export const getLoopWidth = (track: HTMLElement, setSize: number): number => {
  const first = track.children[0] as HTMLElement | undefined
  const clone = track.children[setSize] as HTMLElement | undefined
  const measured = first && clone ? clone.offsetLeft - first.offsetLeft : 0
  if (measured > 0) return measured

  // JSDOM and an unlaid-out first paint report offsetLeft as 0. Half of the
  // scroll width is a good fallback until the next animation frame measures it.
  const half = Math.floor(track.scrollWidth / 2)
  return half > 0 ? half : 0
}

/** Fold any scroll position into the seamless first loop. */
export const normalizeLoopPosition = (scrollLeft: number, loopWidth: number): number => {
  if (!Number.isFinite(scrollLeft) || !Number.isFinite(loopWidth) || loopWidth <= 0) {
    return Math.max(0, Number.isFinite(scrollLeft) ? scrollLeft : 0)
  }

  const wrapped = scrollLeft % loopWidth
  return wrapped < 0 ? wrapped + loopWidth : wrapped
}

/** Advance the marquee without ever reaching the end of the duplicated set. */
export const advanceLoopPosition = (
  scrollLeft: number,
  delta: number,
  loopWidth: number,
): number => normalizeLoopPosition(scrollLeft + delta, loopWidth)

/** One card plus its gap; `count` supports PageUp / PageDown keyboard jumps. */
export const getSlideDistance = (cardWidth: number, gap: number, count = 1): number => {
  const safeWidth = Number.isFinite(cardWidth) && cardWidth > 0 ? cardWidth : 320
  const safeGap = Number.isFinite(gap) && gap > 0 ? gap : 20
  return Math.max(1, (safeWidth + safeGap) * Math.abs(count)) * Math.sign(count || 1)
}

/**
 * Before a smooth arrow scroll, move a position in the duplicated set back to
 * its identical position in the first loop. Otherwise clicking "next" near the
 * loop boundary would animate backwards across the whole track.
 */
export const getArrowScroll = (
  current: number,
  step: number,
  loopWidth: number,
): { prepared: number; target: number } => {
  if (!Number.isFinite(loopWidth) || loopWidth <= 0) {
    const prepared = Math.max(0, Number.isFinite(current) ? current : 0)
    return { prepared, target: Math.max(0, prepared + step) }
  }

  let prepared = normalizeLoopPosition(current, loopWidth)
  if (step < 0 && prepared + step < 0) prepared += loopWidth

  return { prepared, target: prepared + step }
}
