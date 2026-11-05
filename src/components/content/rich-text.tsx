import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

/**
 * Lexical → React renderer.
 *
 * Payload stores rich text as structured JSON, not HTML. Rendering it ourselves in a server
 * component means: no `dangerouslySetInnerHTML`, no sanitizer, no client-side editor runtime
 * shipped to the browser — the CMS copy arrives as plain HTML in the initial response.
 */

/**
 * Lexical overloads the `format` property: on a *text* node it is a bitmask of
 * bold/italic/underline/…, on an *element* node (paragraph, heading, list, quote) it is an
 * alignment keyword. Both shapes are handled below.
 */
type TextFormat = number | undefined
type ElementFormat = 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''

type RichTextNode = {
  type?: string
  tag?: string
  format?: TextFormat | ElementFormat
  text?: string
  style?: string
  indent?: number
  version?: number
  children?: RichTextNode[]
  listType?: string
  value?: unknown
  relationTo?: string
  fields?: Record<string, unknown> | null
  url?: string
  newTab?: boolean
  linkType?: string
  doc?: unknown
  [key: string]: unknown
}

const FORMAT = {
  bold: 1,
  italic: 1 << 1,
  strikethrough: 1 << 2,
  underline: 1 << 3,
  code: 1 << 4,
  subscript: 1 << 5,
  superscript: 1 << 6,
} as const

const withFormat = (
  children: ReactNode,
  format: TextFormat | ElementFormat,
  key: string,
): ReactNode => {
  // An element's alignment keyword can never reach a text node's bitmask; bail out on anything
  // that is not a number rather than coercing it.
  if (!format || typeof format !== 'number') return children
  let node: ReactNode = children

  if (format & FORMAT.bold) node = <strong key={`b-${key}`}>{node}</strong>
  if (format & FORMAT.italic) node = <em key={`i-${key}`}>{node}</em>
  if (format & FORMAT.underline) node = <u key={`u-${key}`}>{node}</u>
  if (format & FORMAT.strikethrough) node = <s key={`s-${key}`}>{node}</s>
  if (format & FORMAT.code)
    node = (
      <code key={`c-${key}`} className="bg-mist-60 px-1.5 py-0.5 text-[0.9em]">
        {node}
      </code>
    )
  if (format & FORMAT.superscript) node = <sup key={`sup-${key}`}>{node}</sup>
  if (format & FORMAT.subscript) node = <sub key={`sub-${key}`}>{node}</sub>

  return node
}

const ALIGNMENTS: ReadonlySet<string> = new Set([
  'left',
  'start',
  'center',
  'right',
  'end',
  'justify',
])

/**
 * Block-level layout: alignment and indentation.
 *
 * The editor's toolbar exposes align and indent buttons, so the values they write have to reach
 * the page or those buttons are decoration. Payload's own HTML exporter maps them to
 * `text-align` and a 40px inset per indent level; this mirrors that exactly so the CMS and the
 * rendered site agree. Returns `undefined` (rather than an empty object) when there is nothing to
 * apply, keeping the markup clean for the common unaligned paragraph.
 */
const blockStyle = (node: RichTextNode): CSSProperties | undefined => {
  const align =
    typeof node.format === 'string' && ALIGNMENTS.has(node.format)
      ? (node.format as CSSProperties['textAlign'])
      : undefined
  const indent = typeof node.indent === 'number' && node.indent > 0 ? node.indent * 40 : undefined

  if (!align && !indent) return undefined
  return { textAlign: align, paddingInlineStart: indent }
}

type MediaValue = (Media & { slug?: string }) | number | null | undefined

const docHref = (relationTo: string | undefined, value: unknown): string | null => {
  if (!value || typeof value !== 'object') return null
  const slug = (value as { slug?: string | null }).slug
  if (!slug) return null
  if (relationTo === 'trips') return `/trips/${slug}`
  if (relationTo === 'destinations') return `/destinations/${slug}`
  if (relationTo === 'blog') return `/blog/${slug}`
  if (relationTo === 'pages') return slug === 'home' ? '/' : `/${slug}`
  return null
}

type RenderContext = {
  headingIds?: readonly string[]
  headingIndex: number
}

const renderNodes = (nodes: RichTextNode[] | undefined, context: RenderContext): ReactNode[] =>
  (nodes ?? []).map((node, index) => renderNode(node, index, context))

/**
 * Table support — Payload's Lexical table feature stores a grid as `table` → `tablerow` →
 * `tablecell` nodes, and marks header cells with a bitmask instead of grouping rows:
 * `1` = the cell sits in the table's header row, `2` = in its header column, `3` = the corner
 * where the two meet, `0` = an ordinary body cell.
 */
const HEADER = { row: 1, column: 2 } as const

const headerState = (node: RichTextNode): number =>
  typeof node.headerState === 'number' ? node.headerState : 0

/**
 * Which cells a header cell heads, as the `scope` attribute screen readers use. A cell in the
 * header row heads its column; a cell in the header column heads its row; the corner cell carries
 * both bits and reads as a column head.
 */
const cellScope = (state: number): 'col' | 'row' | undefined => {
  if ((state & HEADER.row) === HEADER.row) return 'col'
  if ((state & HEADER.column) === HEADER.column) return 'row'
  return undefined
}

/** Merged cells are only worth emitting when they actually span something. */
const cellSpan = (value: unknown): number | undefined =>
  typeof value === 'number' && value > 1 ? value : undefined

/** Per-cell presentation the editor can set: alignment inside the cell and a highlight colour. */
const cellStyle = (node: RichTextNode): CSSProperties | undefined => {
  const style: CSSProperties = {}
  if (typeof node.verticalAlign === 'string' && node.verticalAlign) {
    style.verticalAlign = node.verticalAlign as CSSProperties['verticalAlign']
  }
  if (typeof node.backgroundColor === 'string' && node.backgroundColor) {
    style.backgroundColor = node.backgroundColor
  }
  return Object.keys(style).length ? style : undefined
}

/**
 * Column widths as percentages, or `null` when the editor never sized a column.
 *
 * Dragging a column border in the admin writes absolute pixels measured inside the editor's own
 * ~700px pane. Emitting those pixels here would strand a table at that width (or overflow the page
 * column on a narrow screen), so they are normalised to a share of their total: the relative
 * sizing an editor dragged out survives, the table still fills the space it is rendered in, and
 * only content that genuinely cannot shrink needs the scroll wrapper below. A column nobody
 * resized keeps the 75px default Lexical shows for it in the editor, so one widened column still
 * reads as wider rather than being averaged back into equality.
 */
const DEFAULT_COLUMN_WIDTH = 75

const columnWidths = (node: RichTextNode): number[] | null => {
  if (!Array.isArray(node.colWidths) || !node.colWidths.length) return null

  const widths = node.colWidths.map((width) =>
    typeof width === 'number' && width > 0 ? width : DEFAULT_COLUMN_WIDTH,
  )
  const total = widths.reduce((sum, width) => sum + width, 0)
  return widths.map((width) => Math.round((width / total) * 1000) / 10)
}

const renderNode = (node: RichTextNode, index: number, context: RenderContext): ReactNode => {
  if (!node) return null
  const key = `${node.type ?? 'node'}-${index}`
  const headingTag = node.tag ?? 'h2'
  const isOutlineHeading = node.type === 'heading' && (headingTag === 'h2' || headingTag === 'h3')
  const headingId = isOutlineHeading ? context.headingIds?.[context.headingIndex] : undefined
  if (isOutlineHeading) context.headingIndex += 1
  const children = renderNodes(node.children, context)

  switch (node.type) {
    case 'text':
      return <span key={key}>{withFormat(node.text ?? '', node.format, key)}</span>

    case 'linebreak':
      return <br key={key} />

    case 'paragraph':
      return (
        <p key={key} style={blockStyle(node)}>
          {children}
        </p>
      )

    case 'heading': {
      const tag = node.tag ?? 'h2'
      const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ? tag : 'h2') as 'h2'
      return (
        <Tag
          key={key}
          id={headingId}
          className={headingId ? 'scroll-mt-32' : undefined}
          style={blockStyle(node)}
        >
          {children}
        </Tag>
      )
    }

    case 'list': {
      const ListTag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <ListTag
          key={key}
          className={node.listType === 'check' ? 'list-none' : undefined}
          style={blockStyle(node)}
        >
          {children}
        </ListTag>
      )
    }

    case 'listitem':
      return <li key={key}>{children}</li>

    case 'quote':
      return (
        <blockquote key={key} style={blockStyle(node)}>
          {children}
        </blockquote>
      )

    case 'horizontalrule':
      return <hr key={key} />

    /* -------------------------- Tables — editor ribbon: + → Table -------------------------- */
    case 'table': {
      // Header cells are flagged individually rather than grouped into a header row, so a table
      // whose first row is entirely header cells is promoted into a real <thead>: assistive tech
      // announces the column headings, and `.prose-hg thead` has something to style.
      const firstRowCells = node.children?.[0]?.children ?? []
      const hasHeaderRow =
        firstRowCells.length > 0 &&
        firstRowCells.every((cell) => (headerState(cell) & HEADER.row) === HEADER.row)
      const widths = columnWidths(node)
      // "Toggle First Column Freeze" in the cell menu keeps row labels in view while a grid wide
      // enough to scroll slides past them (the editor only ever freezes 0 or 1 columns).
      const frozenColumns = typeof node.frozenColumnCount === 'number' && node.frozenColumnCount > 0

      return (
        // Wide grids scroll sideways inside their own wrapper instead of stretching the page.
        <div key={key} className="table-scroll">
          <table
            className={node.rowStriping ? 'is-striped' : undefined}
            data-frozen-columns={frozenColumns ? 'true' : undefined}
          >
            {widths ? (
              <colgroup>
                {widths.map((width, columnIndex) => (
                  <col key={`col-${columnIndex}`} style={{ width: `${width}%` }} />
                ))}
              </colgroup>
            ) : null}
            {hasHeaderRow ? <thead>{children[0]}</thead> : null}
            <tbody>{hasHeaderRow ? children.slice(1) : children}</tbody>
          </table>
        </div>
      )
    }

    case 'tablerow':
      return <tr key={key}>{children}</tr>

    case 'tablecell': {
      const state = headerState(node)
      const CellTag = state === 0 ? 'td' : 'th'
      return (
        <CellTag
          key={key}
          scope={cellScope(state)}
          colSpan={cellSpan(node.colSpan)}
          rowSpan={cellSpan(node.rowSpan)}
          style={cellStyle(node)}
        >
          {children}
        </CellTag>
      )
    }

    case 'link': {
      const internal = node.linkType === 'internal' ? docHref(node.relationTo, node.doc) : null
      const href = internal ?? node.url ?? '#'
      const external =
        href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')

      if (external) {
        return (
          <a
            key={key}
            href={href}
            target={node.newTab ? '_blank' : undefined}
            rel={node.newTab ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        )
      }

      return (
        <Link key={key} href={href} target={node.newTab ? '_blank' : undefined}>
          {children}
        </Link>
      )
    }

    case 'autolink': {
      const href = node.url ?? '#'
      return (
        <a
          key={key}
          href={href}
          target={node.newTab ? '_blank' : undefined}
          rel={node.newTab ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    }

    case 'relationship': {
      const href = docHref(node.relationTo, node.value)
      const label =
        (node.value && typeof node.value === 'object'
          ? ((node.value as { title?: string; name?: string }).title ??
            (node.value as { title?: string; name?: string }).name)
          : null) ?? children

      if (!href) return <span key={key}>{label}</span>
      return (
        <Link key={key} href={href}>
          {label}
        </Link>
      )
    }

    case 'upload': {
      const value = node.value as MediaValue
      if (!value || typeof value === 'number') return null

      const media = value as Media & { caption?: string | null }
      const caption = (node.fields as { caption?: string | null } | null)?.caption ?? null

      return (
        <figure key={key} className="-mx-0">
          <div className="overflow-hidden bg-mist-60">
            <PayloadImage
              media={media}
              sizes="(min-width: 1024px) 768px, 100vw"
              className="aspect-[16/10] w-full"
            />
          </div>
          {caption ? (
            <figcaption className="mt-3 text-center text-sm text-slate-80">{caption}</figcaption>
          ) : null}
        </figure>
      )
    }

    default:
      return node.children ? <span key={key}>{children}</span> : null
  }
}

export function RichText({
  content,
  className,
  headingIds,
}: {
  content: unknown
  className?: string
  /** Adds matching anchor IDs to h2/h3 nodes when a page renders a table of contents. */
  headingIds?: readonly string[]
}) {
  const root = (content as { root?: RichTextNode } | null | undefined)?.root
  if (!root?.children?.length) return null

  const context: RenderContext = { headingIds, headingIndex: 0 }
  return <div className={cn('prose-hg', className)}>{renderNodes(root.children, context)}</div>
}
