import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveRichTextLink } from './rich-text-links'

test('resolves Payload Lexical custom and auto links from fields', () => {
  assert.deepEqual(
    resolveRichTextLink({
      fields: { linkType: 'custom', url: 'https://example.com', newTab: true },
    }),
    { href: 'https://example.com', newTab: true },
  )
  assert.deepEqual(resolveRichTextLink({ fields: { url: 'mailto:hello@example.com' } }), {
    href: 'mailto:hello@example.com',
    newTab: false,
  })
})

test('resolves populated internal links and home', () => {
  for (const relationTo of ['trips', 'destinations', 'blog']) {
    assert.equal(
      resolveRichTextLink({
        fields: { linkType: 'internal', doc: { relationTo, value: { id: 1, slug: 'example' } } },
      })?.href,
      `/${relationTo}/example`,
    )
  }
  assert.equal(
    resolveRichTextLink({
      fields: {
        linkType: 'internal',
        doc: { relationTo: 'pages', value: { id: 1, slug: 'home' } },
      },
    })?.href,
    '/',
  )
  assert.equal(
    resolveRichTextLink({
      fields: {
        linkType: 'internal',
        doc: { relationTo: 'pages', value: { id: 1, slug: 'about' } },
      },
    })?.href,
    '/about',
  )
})

test('handles older links and avoids dead or unsafe links', () => {
  assert.equal(resolveRichTextLink({ url: '/trips', newTab: true })?.href, '/trips')
  assert.equal(
    resolveRichTextLink({
      fields: { linkType: 'internal', doc: { relationTo: 'trips', value: 1 } },
    }),
    null,
  )
  assert.equal(resolveRichTextLink({ fields: { url: 'javascript:alert(1)' } }), null)
})

test('rich text renders clickable internal, external and auto links', async () => {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { RichText } = await import('../components/content/rich-text')
  const content = {
    root: {
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              fields: {
                linkType: 'internal',
                doc: { relationTo: 'trips', value: { id: 1, slug: 'everest' } },
              },
              children: [{ type: 'text', text: 'Everest' }],
            },
            {
              type: 'link',
              fields: { linkType: 'custom', url: 'https://example.com', newTab: true },
              children: [{ type: 'text', text: 'External' }],
            },
            {
              type: 'autolink',
              fields: { url: 'https://example.org' },
              children: [{ type: 'text', text: 'Auto' }],
            },
          ],
        },
      ],
    },
  }
  const html = renderToStaticMarkup(React.createElement(RichText, { content }))
  assert.match(html, /href="\/trips\/everest"[^>]*><span>Everest<\/span><\/a>/)
  assert.match(html, /href="https:\/\/example\.com"[^>]*><span>External<\/span><\/a>/)
  assert.match(html, /target="_blank"/)
  assert.match(html, /rel="noopener noreferrer"/)
  assert.match(html, /href="https:\/\/example\.org"[^>]*><span>Auto<\/span><\/a>/)
})
