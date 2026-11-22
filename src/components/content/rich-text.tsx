import { InlineLinkPreview } from '@/components/sections/inline-link-preview'
import { MultiUrlPreviewSection } from '@/components/sections/multi-url-preview-section'
import { BoxedContent } from '@/components/sections/boxed-content'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'
import { resolveRichTextLink } from '@/lib/rich-text-links'
import {
  splitAutoLinkedText,
  type AutoLinkSegment,
  type InternalLinker,
  type NodeLinkPlan,
} from '@/lib/internal-links'

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
      <code key={`c-${key}`} className="bg-mist-60 px-1.5 py-0.5 text-small">
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

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * One text node, cut into plain runs and the mentions this page decided to link.
 *
 * Returns the untouched string when the node won nothing, so the overwhelmingly common case keeps
 * rendering exactly the markup it did before this feature existed — important because the output of
 * this renderer is asserted on in tests and read by crawlers.
 *
 * The anchor text is the copy as written (see `splitAutoLinkedText`), and the link is marked with
 * `data-auto-link` so the automated links can be counted in QA and styled separately if they ever
 * need to be. It is `next/link`, not a bare `<a>`, for the same reason an editor's internal link is:
 * client-side navigation and prefetching.
 */
const autoLinkedText = (
  text: string,
  node: RichTextNode,
  linker: InternalLinker | null | undefined,
): string | ReactNode[] => {
  if (!linker) return text

  const plan: NodeLinkPlan | null = linker.planFor(node)
  if (!plan?.length) return text

  const segments: AutoLinkSegment[] = splitAutoLinkedText(text, plan)
  if (!segments.some((segment) => segment.kind === 'link')) return text

  return segments.map((segment, index) =>
    segment.kind === 'link' ? (
      <Link key={`auto-${index}`} href={segment.href} data-auto-link="true">
        {segment.text}
      </Link>
    ) : (
      segment.text
    ),
  )
}

type RenderContext = {
  headingIds?: readonly string[]
  headingIndex: number
  /** Render every heading node at this level, whatever tag the editor stored. */
  headingTag?: HeadingTag
  /** The page's automated internal linking, threaded down from the `linker` prop. */
  linker?: InternalLinker | null
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
  const storedHeadingTag = node.tag ?? 'h2'
  const boxedContentHeading =
    node.type === 'block' &&
    node.fields?.blockType === 'boxedContent' &&
    typeof node.fields.heading === 'string'
      ? node.fields.heading.trim()
      : ''
  const boxedContentHeadingTag = context.headingTag === 'h3' ? 'h3' : 'h2'
  const isOutlineHeading =
    (node.type === 'heading' && (storedHeadingTag === 'h2' || storedHeadingTag === 'h3')) ||
    (Boolean(boxedContentHeading) &&
      (boxedContentHeadingTag === 'h2' || boxedContentHeadingTag === 'h3'))
  const headingId = isOutlineHeading ? context.headingIds?.[context.headingIndex] : undefined
  if (isOutlineHeading) context.headingIndex += 1
  const children = renderNodes(node.children, context)

  switch (node.type) {
    case 'text': {
      const text = node.text ?? ''
      // The auto-link pass runs inside `withFormat`, so a bold or italic mention keeps its
      // formatting and the `<a>` sits inside the `<strong>` rather than around it.
      return (
        <span key={key}>
          {withFormat(autoLinkedText(text, node, context.linker), node.format, key)}
        </span>
      )
    }

    case 'linebreak':
      return <br key={key} />

    case 'paragraph':
      return (
        <p key={key} style={blockStyle(node)}>
          {children}
        </p>
      )

    case 'heading': {
      // `context.headingTag` keeps CMS subheadings one level below their section's H2, even
      // when an older document was written with the editor's H2/H4 heading buttons.
      const tag = context.headingTag ?? storedHeadingTag
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

    case 'link':
    case 'autolink': {
      const link = resolveRichTextLink(node)
      // Keep the text readable when a relationship hasn't been populated or has been deleted.
      if (!link) return <span key={key}>{children}</span>
      const external = /^(?:https?:\/\/|mailto:|tel:|\/\/)/i.test(link.href)
      const target = link.newTab ? '_blank' : undefined
      const rel = link.newTab ? 'noopener noreferrer' : undefined
      if (external) {
        return (
          <a key={key} href={link.href} target={target} rel={rel}>
            {children}
          </a>
        )
      }
      return (
        <Link key={key} href={link.href} target={target} rel={rel}>
          {children}
        </Link>
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

    case 'block': {
      if (node.fields?.blockType === 'linkPreview') {
        return <InlineLinkPreview key={key} source={node.fields} />
      }
      if (node.fields?.blockType === 'multiUrlPreview') {
        return <MultiUrlPreviewSection key={key} source={node.fields} placement="inline" />
      }
      if (node.fields?.blockType === 'boxedContent') {
        return (
          <BoxedContent
            key={key}
            source={node.fields}
            headingId={headingId}
            headingTag={boxedContentHeadingTag}
            linker={context.linker}
          />
        )
      }
      return null
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
            <figcaption className="mt-3 text-center text-small text-slate-80">{caption}</figcaption>
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
  headingTag,
  linker,
}: {
  content: unknown
  className?: string
  /** Adds matching anchor IDs to h2/h3 nodes when a page renders a table of contents. */
  headingIds?: readonly string[]
  /**
   * Force every heading node to this tag. Used where the rich text sits under its own CMS
   * heading: subheadings become real `<h3>` elements rather than styled paragraphs or a
   * second, competing `<h2>` level.
   */
  headingTag?: HeadingTag
  /**
   * Automated internal keyword linking for this page (see `src/lib/internal-links.ts`).
   *
   * One linker is created per page render by the route and threaded to every rich text block on it,
   * which is what makes the budget — eight links, one per target — a *page* budget rather than a
   * paragraph budget. Omit it and this component renders byte-for-byte as it did before the feature
   * existed, which is also what a build without a database does: `createInternalLinker()` hands back
   * an empty linker rather than throwing.
   *
   * A prop rather than React context because this is a React Server Component tree, and `createContext`
   * is not available to one — nor would it help: a provider component returns before React has
   * rendered its children, so there is no moment at which a context value could be both set and read.
   */
  linker?: InternalLinker | null
}) {
  const root = (content as { root?: RichTextNode } | null | undefined)?.root
  if (!root?.children?.length) return null

  /**
   * Collect before rendering, so this block's mentions compete for the page budget against every
   * other block's rather than only against the paragraphs that happen to precede them. `planFor()`
   * flushes whatever is still undecided, so each block decides its own nodes at the moment it
   * renders, with full knowledge of everything collected on the page so far.
   */
  if (linker) {
    linker.collect(content)
    linker.flush()
  }

  const context: RenderContext = { headingIds, headingIndex: 0, headingTag, linker }
  return <div className={cn('prose-hg', className)}>{renderNodes(root.children, context)}</div>
}
