export type ArticleHeading = {
  id: string
  label: string
  level: 2 | 3
}

type LexicalNode = {
  type?: unknown
  tag?: unknown
  text?: unknown
  fields?: unknown
  children?: unknown
}

const asNode = (value: unknown): LexicalNode | null =>
  value && typeof value === 'object' ? (value as LexicalNode) : null

const textFromNode = (value: unknown): string => {
  const node = asNode(value)
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return node.children.map(textFromNode).join('')
}

const slugifyHeading = (value: string): string =>
  value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Collects the article's level-two and level-three headings in document order.
 * The same IDs are passed into the rich-text renderer, so the reading outline
 * always points to its matching section, including when headings repeat.
 */
export const getArticleHeadings = (content: unknown): ArticleHeading[] => {
  const root = asNode((content as { root?: unknown } | null | undefined)?.root)
  if (!root || !Array.isArray(root.children)) return []

  const headings: ArticleHeading[] = []
  const usedIds = new Map<string, number>()

  const pushHeading = (label: string, level: 2 | 3): void => {
    const baseId = slugifyHeading(label) || `section-${headings.length + 1}`
    const duplicateCount = usedIds.get(baseId) ?? 0
    usedIds.set(baseId, duplicateCount + 1)

    headings.push({
      id: `story-${duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount + 1}`}`,
      label,
      level,
    })
  }

  const visit = (value: unknown): void => {
    const node = asNode(value)
    if (!node) return

    const headingTag = node.tag ?? 'h2'
    if (node.type === 'heading' && (headingTag === 'h2' || headingTag === 'h3')) {
      const label = textFromNode(node).replace(/\s+/g, ' ').trim()
      pushHeading(label, headingTag === 'h2' ? 2 : 3)
    }

    if (node.type === 'block' && node.fields && typeof node.fields === 'object') {
      const fields = node.fields as Record<string, unknown>
      const boxedHeading = fields.heading
      if (
        fields.blockType === 'boxedContent' &&
        typeof boxedHeading === 'string' &&
        boxedHeading.trim()
      ) {
        pushHeading(boxedHeading.trim(), 2)
      }
    }

    if (Array.isArray(node.children)) node.children.forEach(visit)
  }

  root.children.forEach(visit)
  return headings
}
