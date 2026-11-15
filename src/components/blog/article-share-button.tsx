'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Share2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type ShareStatus = 'idle' | 'copied' | 'error'

type ArticleShareButtonProps = {
  title: string
  shareLabel: string
  copiedLabel: string
  errorLabel: string
  tone?: 'dark' | 'light'
  className?: string
}

const copyToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // A permission denial can still fall back to the older selection API below.
    }
  }

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()

  const copied = document.execCommand('copy')
  field.remove()
  if (!copied) throw new Error('The article link could not be copied.')
}

export function ArticleShareButton({
  title,
  shareLabel,
  copiedLabel,
  errorLabel,
  tone = 'dark',
  className,
}: ArticleShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const resetTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    },
    [],
  )

  const showStatus = (nextStatus: ShareStatus) => {
    setStatus(nextStatus)
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    if (nextStatus !== 'idle') {
      resetTimer.current = window.setTimeout(() => setStatus('idle'), 2400)
    }
  }

  const shareArticle = async () => {
    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        showStatus('idle')
        return
      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          return
        }
      }
    }

    try {
      await copyToClipboard(url)
      showStatus('copied')
    } catch {
      showStatus('error')
    }
  }

  const label = status === 'copied' ? copiedLabel : status === 'error' ? errorLabel : shareLabel
  const Icon = status === 'copied' ? Check : Share2

  return (
    <button
      type="button"
      onClick={shareArticle}
      aria-label={label}
      className={cn(
        'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[7px] border px-4 text-small font-medium transition-[background-color,border-color,color,transform] duration-250 ease-[var(--ease-brand)] focus-visible:outline-2 focus-visible:outline-offset-3 active:translate-y-px',
        tone === 'dark'
          ? 'border-white/40 bg-white/10 text-white backdrop-blur-[2px] hover:border-white hover:bg-paper hover:text-ink focus-visible:outline-mist'
          : 'border-ink/25 bg-paper text-ink shadow-2xs hover:border-btn-primary hover:bg-btn-primary hover:text-white focus-visible:outline-deep',
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      <span aria-live="polite" aria-atomic="true">
        {label}
      </span>
    </button>
  )
}
