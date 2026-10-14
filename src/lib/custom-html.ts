import sanitizeHtml from 'sanitize-html'

/** Allow content HTML, never executable markup or page-level CSS. Sanitize at render time
 * as well as for previews so unsafe legacy/API content cannot bypass the policy. */
export function sanitizeCustomHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'details', 'summary'],
    allowedAttributes: {
      '*': ['class', 'style', 'title'],
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      ol: ['start', 'reversed'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    allowedStyles: {
      '*': {
        color: [/^#[0-9a-f]{3,8}$/i, /^[a-z]+$/i, /^rgba?\([\d\s,.%]+\)$/i],
        'background-color': [/^#[0-9a-f]{3,8}$/i, /^[a-z]+$/i, /^rgba?\([\d\s,.%]+\)$/i],
        'text-align': [/^(left|right|center|justify)$/],
        'font-weight': [/^(normal|bold|[1-9]00)$/],
        'font-style': [/^(normal|italic)$/],
        'text-decoration': [/^(none|underline|line-through)$/],
        'font-size': [/^\d+(\.\d+)?(px|rem|em|%)$/],
        width: [/^\d+(\.\d+)?(px|rem|em|%)$/],
        'max-width': [/^\d+(\.\d+)?(px|rem|em|%)$/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
    },
  })
}
