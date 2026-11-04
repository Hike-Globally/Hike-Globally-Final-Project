import './key-takeaways.css'

/** Plain text by default; editors can emphasize a short phrase with **double asterisks**. */
export function KeyPointsList({ items }: { items: { id?: string | null; text: string }[] }) {
  return (
    <ul className="key-points-list">
      {items.map((item, index) => (
        <li key={item.id ?? index} className="whitespace-pre-line">
          {item.text
            .split(/(\*\*[^*\n]+\*\*)/g)
            .map((part, partIndex) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={partIndex}>{part.slice(2, -2)}</strong>
              ) : (
                part
              ),
            )}
        </li>
      ))}
    </ul>
  )
}
