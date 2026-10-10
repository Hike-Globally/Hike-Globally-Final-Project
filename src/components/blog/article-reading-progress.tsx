'use client'

import { useEffect, useState } from 'react'

/** A lightweight progress indicator tied to the article, not the whole page. */
export function ArticleReadingProgress({ articleId, label }: { articleId: string; label: string }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      if (frame) return

      frame = window.requestAnimationFrame(() => {
        frame = 0
        const article = document.getElementById(articleId)
        if (!article) return

        const articleTop = article.getBoundingClientRect().top + window.scrollY
        const scrollableDistance = Math.max(1, article.offsetHeight - window.innerHeight)
        const nextProgress = Math.min(
          100,
          Math.max(0, ((window.scrollY - articleTop) / scrollableDistance) * 100),
        )

        setProgress(Math.round(nextProgress))
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
  }, [articleId])

  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 bg-ink/10"
      role="progressbar"
    >
      <div
        className="h-full origin-left bg-sage"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  )
}
