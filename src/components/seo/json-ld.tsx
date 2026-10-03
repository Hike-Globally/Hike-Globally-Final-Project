/**
 * Renders schema.org JSON-LD.
 *
 * The `<` character is escaped so a string inside the data can never break out of the
 * script element — the one security rule that matters for inline structured data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
