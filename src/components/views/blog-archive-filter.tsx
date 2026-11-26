'use client'

import { useRouter } from 'next/navigation'

type FilterOption = { value: string; label: string; href: string }

/** The only interactive part of the server-rendered journal archive. */
export function BlogArchiveFilter({
  category,
  allLabel,
  allHref,
  options,
}: {
  category: string
  allLabel: string
  allHref: string
  options: FilterOption[]
}) {
  const router = useRouter()

  return (
    <div className="blog-archive-filter">
      <select
        aria-label="Filter by topic"
        value={category}
        onChange={(event) => {
          const href =
            options.find((option) => option.value === event.target.value)?.href ?? allHref
          router.push(href, { scroll: false })
        }}
      >
        <option value="all">{allLabel}</option>
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  )
}
