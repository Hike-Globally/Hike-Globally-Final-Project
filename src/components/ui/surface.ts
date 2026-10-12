/**
 * The one card surface used across the trip page: white, hairline border, soft layered shadow.
 *
 * It lives in its own module so the server-rendered trip view and the client-side itinerary
 * section can share the exact same string — two copies would drift the moment either side is
 * restyled.
 */
export const surface =
  'border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(1,22,30,0.04),0_18px_40px_-24px_rgba(1,22,30,0.18)]'
