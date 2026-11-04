/** Empty Lexical paragraphs are saved by the editor even when no copy was entered. */
export function hasRichTextContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const node = value as { root?: unknown; text?: string; type?: string; children?: unknown[] }
  if (node.root) return hasRichTextContent(node.root)
  if (typeof node.text === 'string' && node.text.trim()) return true
  if (node.type === 'upload' || node.type === 'horizontalrule') return true
  return Array.isArray(node.children) && node.children.some(hasRichTextContent)
}
