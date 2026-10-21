/**
 * ============================================================================
 * LATEST BLOGS AND STORIES — how many stories the homepage board carries.
 * ============================================================================
 * The journal board is an editorial split, not a card grid: one lead plate, and
 * beside it a short index of the stories behind it (see
 * `blog-dispatch-board.tsx`). Three index rows is the whole design — the index
 * is the *supporting* column, and every row past the third makes it outgrow the
 * plate and turns the section into a long, portrait list.
 *
 * The cap lives here because two sides of the client boundary read it: the
 * server section (how many posts to fetch) and the client board (how many rows
 * it will ever render). One number, so the fetch and the render can never
 * disagree — and so a CMS page saved with a larger `latestPosts.limit` cannot
 * stretch the section again. That `limit` field still drives the tile grids the
 * same block renders on other pages; on the homepage the board is fixed.
 */

/** Index rows beside the lead plate — always three. */
export const HOMEPAGE_INDEX_ROWS = 3

/** Stories fetched for the homepage board: the lead plus its three index rows. */
export const HOMEPAGE_POST_LIMIT = HOMEPAGE_INDEX_ROWS + 1
