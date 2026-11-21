import Link from 'next/link'
import { archiveHref, type Archive } from '@/lib/catalog'

export function ArchivePagination({
  archive,
  page,
  totalPages,
  filters,
}: {
  archive: Archive
  page: number
  totalPages: number
  filters?: string
}) {
  if (totalPages < 2) return null
  return (
    <nav
      aria-label="Archive pagination"
      className="container-content my-10 flex items-center justify-center gap-6"
    >
      {page > 1 && (
        <Link rel="prev" className="underline" href={archiveHref(archive, page - 1, filters)}>
          Previous page
        </Link>
      )}
      <span>
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link rel="next" className="underline" href={archiveHref(archive, page + 1, filters)}>
          Next page
        </Link>
      )}
    </nav>
  )
}
