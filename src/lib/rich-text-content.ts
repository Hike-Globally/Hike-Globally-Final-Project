import { normalizeMultiUrlPreview, type MultiUrlPreviewSource } from './multi-url-preview'

/** Empty Lexical paragraphs are saved by the editor even when no copy was entered. */
export function hasRichTextContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const node = value as {
    root?: unknown
    text?: string
    type?: string
    fields?: MultiUrlPreviewSource & {
      blockType?: string
      linkPreviewUrl?: unknown
      heading?: unknown
      description?: unknown
    }
    children?: unknown[]
  }
  if (node.root) return hasRichTextContent(node.root)
  if (typeof node.text === 'string' && node.text.trim()) return true
  if (node.type === 'block' && node.fields?.blockType === 'linkPreview') {
    return (
      typeof node.fields.linkPreviewUrl === 'string' && Boolean(node.fields.linkPreviewUrl.trim())
    )
  }
  if (node.type === 'block' && node.fields?.blockType === 'multiUrlPreview') {
    return normalizeMultiUrlPreview(node.fields).links.length > 0
  }
  if (node.type === 'block' && node.fields?.blockType === 'boxedContent') {
    const heading = node.fields.heading
    const description = node.fields.description
    return (
      (typeof heading === 'string' && Boolean(heading.trim())) ||
      (typeof description === 'string' && Boolean(description.trim()))
    )
  }
  if (node.type === 'upload' || node.type === 'horizontalrule') return true
  return Array.isArray(node.children) && node.children.some(hasRichTextContent)
}
