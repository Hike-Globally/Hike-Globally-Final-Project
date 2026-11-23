/** A landscape hub is indexable when it has at least one published trip or field note. */
export function hasHubContent(content: { trips: readonly unknown[]; posts: readonly unknown[] }): boolean {
  return content.trips.length > 0 || content.posts.length > 0
}
