/**
 * The one card surface used across the trip page: white on a warm hairline, with no shadow —
 * the site draws its cards with 1px rules and lets whitespace do the separating.
 *
 * It lives in its own module so the server-rendered trip view and the client-side itinerary
 * section can share the exact same string — two copies would drift the moment either side is
 * restyled.
 */
export const surface = 'border border-slate-20 bg-white'
