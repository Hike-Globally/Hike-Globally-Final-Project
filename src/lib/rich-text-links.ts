/** Resolve Payload Lexical link fields, including the legacy top-level shape. */
export function resolveRichTextLink(node: {
  fields?: Record<string, unknown> | null
  linkType?: string
  url?: string
  newTab?: boolean
  doc?: unknown
  relationTo?: string
}): { href: string; newTab: boolean } | null {
  const fields = node.fields ?? {}
  const linkType = fields.linkType ?? node.linkType
  const rawDoc = fields.doc ?? node.doc
  let href: string | undefined

  if (linkType === 'internal' && rawDoc && typeof rawDoc === 'object') {
    const doc = rawDoc as { relationTo?: unknown; value?: unknown; slug?: unknown }
    const relation = typeof doc.relationTo === 'string' ? doc.relationTo : node.relationTo
    const value = doc.value && typeof doc.value === 'object' ? doc.value : doc
    const slug = (value as { slug?: unknown }).slug
    if (typeof slug === 'string' && slug) {
      if (relation === 'pages') href = slug === 'home' ? '/' : `/${slug}`
      if (relation === 'trips' || relation === 'destinations' || relation === 'blog') {
        href = `/${relation}/${slug}`
      }
    }
  } else {
    const url = fields.url ?? node.url
    if (typeof url === 'string') href = url.trim()
  }

  // Do not create dead '#' links or executable URLs from incomplete/unsafe CMS data.
  if (!href || /^(?:javascript|data|vbscript):/i.test(href)) return null
  return { href, newTab: Boolean(fields.newTab ?? node.newTab) }
}
