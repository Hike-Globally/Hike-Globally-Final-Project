import Link from 'next/link'
import type { ReactNode } from 'react'

import { PayloadImage } from '@/components/ui/payload-image'
import type { Locale } from '@/i18n/config'
import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

/**
 * Lexical → React renderer.
 *
 * Payload stores rich text as structured JSON, not HTML. Rendering it ourselves in a server
 * component means: no `dangerouslySetInnerHTML`, no sanitizer, no client-side editor runtime
 * shipped to the browser — the CMS copy arrives as plain HTML in the initial response.
 */

type TextFormat = number | undefined

type RichTextNode = {
  type?: string
  tag?: string
  format?: TextFormat
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

const withFormat = (children: ReactNode, format: TextFormat, key: string): ReactNode => {
  if (!format) return children
  let node: ReactNode = children

  if (format & FORMAT.bold) node = <strong key={`b-${key}`}>{node}</strong>
  if (format & FORMAT.italic) node = <em key={`i-${key}`}>{node}</em>
  if (format & FORMAT.underline) node = <u key={`u-${key}`}>{node}</u>
  if (format & FORMAT.strikethrough) node = <s key={`s-${key}`}>{node}</s>
  if (format & FORMAT.code)
    node = (
      <code key={`c-${key}`} className="rounded bg-mist-60 px-1.5 py-0.5 text-[0.9em]">
        {node}
      </code>
    )
  if (format & FORMAT.superscript) node = <sup key={`sup-${key}`}>{node}</sup>
  if (format & FORMAT.subscript) node = <sub key={`sub-${key}`}>{node}</sub>

  return node
}

type MediaValue = (Media & { slug?: string }) | number | null | undefined

const docHref = (relationTo: string | undefined, value: unknown, locale: Locale): string | null => {
  if (!value || typeof value !== 'object') return null
  const slug = (value as { slug?: string | null }).slug
  if (!slug) return null
  if (relationTo === 'trips') return `/${locale}/trips/${slug}`
  if (relationTo === 'destinations') return `/${locale}/destinations/${slug}`
  if (relationTo === 'blog') return `/${locale}/blog/${slug}`
  if (relationTo === 'pages') return slug === 'home' ? `/${locale}` : `/${locale}/${slug}`
  return null
}

const renderNodes = (nodes: RichTextNode[] | undefined, locale: Locale): ReactNode =>
  (nodes ?? []).map((node, index) => renderNode(node, locale, index))

const renderNode = (node: RichTextNode, locale: Locale, index: number): ReactNode => {
  if (!node) return null
  const key = `${node.type ?? 'node'}-${index}`
  const children = renderNodes(node.children, locale)

  switch (node.type) {
    case 'text':
      return (
        <span key={key} style={node.style ? undefined : undefined}>
          {withFormat(node.text ?? '', node.format, key)}
        </span>
      )

    case 'linebreak':
      return <br key={key} />

    case 'paragraph':
      return <p key={key}>{children}</p>

    case 'heading': {
      const tag = node.tag ?? 'h2'
      const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ? tag : 'h2') as 'h2'
      return <Tag key={key}>{children}</Tag>
    }

    case 'list': {
      const ListTag = node.listType === 'number' ? 'ol' : 'ul'
      return (
        <ListTag key={key} className={node.listType === 'check' ? 'list-none' : undefined}>
          {children}
        </ListTag>
      )
    }

    case 'listitem':
      return <li key={key}>{children}</li>

    case 'quote':
      return <blockquote key={key}>{children}</blockquote>

    case 'horizontalrule':
      return <hr key={key} />

    case 'link': {
      const internal = node.linkType === 'internal' ? docHref(node.relationTo, node.doc, locale) : null
      const href = internal ?? node.url ?? '#'
      const external = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')

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
      const href = docHref(node.relationTo, node.value, locale)
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
          <div className="overflow-hidden rounded-2xl bg-mist-60">
            <PayloadImage
              media={media}
              size="tablet"
              sizes="(min-width: 1024px) 768px, 100vw"
              className="aspect-[16/10] w-full"
            />
          </div>
          {caption ? (
            <figcaption className="mt-3 text-center text-sm text-slate">{caption}</figcaption>
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
  locale,
  className,
}: {
  content: unknown
  locale: Locale
  className?: string
}) {
  const root = (content as { root?: RichTextNode } | null | undefined)?.root
  if (!root?.children?.length) return null

  return (
    <div className={cn('prose-hg', className)}>{renderNodes(root.children, locale)}</div>
  )
}
