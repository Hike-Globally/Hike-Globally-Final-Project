/** Only absolute HTTP(S) URLs may be used as public profile / identity links. */
export function httpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!/^https?:\/\//i.test(trimmed)) return undefined

  try {
    const url = new URL(trimmed)
    if (!url.hostname || url.username || url.password) return undefined
    return url.href
  } catch {
    return undefined
  }
}
