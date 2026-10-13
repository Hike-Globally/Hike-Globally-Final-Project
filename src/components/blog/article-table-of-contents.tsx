'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, Compass } from 'lucide-react'

import type { ArticleHeading } from '@/lib/article-headings'
import { cn } from '@/lib/utils'

import './article-table-of-contents.css'

/** An unnumbered reading outline; native anchors work even before hydration. */
export function ArticleTableOfContents({
  headings,
  label,
  eyebrow,
  readingTime,
}: {
  headings: ArticleHeading[]
  label: string
  eyebrow: string
  readingTime: string
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let frame = 0
    const sections = headings.flatMap(({ id }) => {
      const element = document.getElementById(id)
      return element ? [element] : []
    })

    const update = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        // Match the article's 8rem anchor offset, with a little breathing room.
        const readingLine = parseFloat(getComputedStyle(document.documentElement).fontSize) * 8 + 24
        let current = sections[0]?.id ?? null
        for (const section of sections) {
          if (section.getBoundingClientRect().top > readingLine) break
          current = section.id
        }
        setActiveId(current)
      })
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [headings])

  return (
    <nav aria-label={label} className="article-outline">
      <div className="article-outline__header">
        <svg
          aria-hidden="true"
          focusable="false"
          className="article-outline__contours"
          viewBox="0 0 200 160"
          fill="none"
        >
          <g stroke="currentColor" strokeWidth="0.8">
            <path d="M40-20c-60 60 90 65 38 125s35 90 130 45" />
            <path d="M57-20c-60 60 90 65 38 125s35 90 130 45" />
            <path d="M74-20c-60 60 90 65 38 125s35 90 130 45" />
            <path d="M91-20c-60 60 90 65 38 125s35 90 130 45" />
            <path d="M108-20c-60 60 90 65 38 125s35 90 130 45" />
          </g>
        </svg>
        <span className="article-outline__emblem" aria-hidden="true">
          <Compass size={20} strokeWidth={1.25} />
        </span>
        <p className="article-outline__eyebrow">{eyebrow}</p>
        <h2 className="article-outline__title">{label}</h2>
      </div>

      <div className="article-outline__scroll" tabIndex={0}>
        <ul className="article-outline__list">
          {headings.map((heading) => {
            const active = activeId === heading.id
            return (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'article-outline__link',
                    heading.level === 3 && 'article-outline__link--nested',
                    active && 'article-outline__link--active',
                  )}
                >
                  <span className="article-outline__marker" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{heading.label}</span>
                  <ArrowUpRight className="article-outline__arrow" size={14} aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="article-outline__footer">
        <span className="article-outline__rule" aria-hidden="true" />
        <span>{readingTime}</span>
      </div>
    </nav>
  )
}
