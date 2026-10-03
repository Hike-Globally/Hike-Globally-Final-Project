'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Locale } from '@/i18n/config'
import { getDictionary, type Dictionary } from '@/i18n/dictionaries'

export type TripOption = { id: number; title: string; slug: string }

/**
 * Inquiry form — wired straight to Formsubmit.co, no backend required.
 *
 * WHY A PLAIN FORM POST: the form is a real <form> with method="POST", so it works even if
 * JavaScript fails to load. React is only used for the pending state and the select widget.
 *
 * The `_next` hidden field tells Formsubmit where to send the visitor afterwards, so we keep
 * the "thank you" page (and its analytics) on our own domain instead of on formsubmit.co.
 */
export function InquiryForm({
  locale,
  trips,
  email,
  defaultTripSlug,
  compact = false,
  variant = 'light',
}: {
  locale: Locale
  trips: TripOption[]
  email: string
  defaultTripSlug?: string | null
  compact?: boolean
  variant?: 'light' | 'dark'
}) {
  const dict: Dictionary = getDictionary(locale)
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)

  const endpoint = `https://formsubmit.co/${email}`
  const successPath = process.env.NEXT_PUBLIC_FORMSUBMIT_SUCCESS_PATH || '/inquiry/thank-you'
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
  const nextUrl = siteUrl ? `${siteUrl}/${locale}${successPath}` : `/${locale}${successPath}`

  const onSubmit = () => {
    setSubmitting(true)
    // The browser performs the actual POST to Formsubmit — this is only the pending state.
  }

  const labelClass = variant === 'dark' ? 'text-mist/80' : 'text-ink'
  const ghostClass =
    variant === 'dark'
      ? 'border-white/15 bg-white/[0.06] text-mist placeholder:text-mist/40 focus-visible:border-sage'
      : ''

  return (
    <form
      ref={formRef}
      action={endpoint}
      method="POST"
      onSubmit={onSubmit}
      className={
        compact
          ? 'space-y-4'
          : 'grid gap-5 rounded-2xl border border-black/[0.06] bg-card p-6 shadow-[0_1px_2px_rgba(1,22,30,0.04)] sm:p-8 md:grid-cols-2'
      }
    >
      {/* Formsubmit controls */}
      <input type="hidden" name="_subject" value={`New trip enquiry — ${dict.inquiry.formTitle}`} />
      <input type="hidden" name="_next" value={nextUrl} />
      <input type="hidden" name="_captcha" value="false" />
      <input type="hidden" name="_template" value="table" />
      <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="_language" value={locale} />

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="name" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.name} <span className="text-slate">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          required
          minLength={2}
          autoComplete="name"
          placeholder="Jane Doe"
          className={ghostClass}
        />
      </div>

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="email" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.email} <span className="text-slate">*</span>
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="jane@example.com"
          className={ghostClass}
        />
      </div>

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="phone" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.phone}
        </Label>
        <Input id="phone" name="phone" autoComplete="tel" placeholder="+49 170 0000000" className={ghostClass} />
      </div>

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="country" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.country}
        </Label>
        <Input id="country" name="country" autoComplete="country-name" placeholder="Germany" className={ghostClass} />
      </div>

      <div className={compact ? '' : 'md:col-span-2'}>
        <Label htmlFor="trip" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.trip}
        </Label>
        {/* A plain <select>: it posts its value with the native form submission, works with
            JavaScript disabled, and costs zero client JS. */}
        <select
          id="trip"
          name="tripTitle"
          defaultValue={trips.find((trip) => trip.slug === defaultTripSlug)?.title ?? ''}
          className={cn(
            'h-11 w-full rounded-xl border border-input bg-white px-4 text-sm text-ink shadow-[0_1px_2px_rgba(1,22,30,0.03)] outline-none transition-[color,box-shadow,border-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
            ghostClass,
          )}
        >
          <option value="">{dict.inquiry.noTrip}</option>
          {trips.map((trip) => (
            <option key={trip.id} value={trip.title}>
              {trip.title}
            </option>
          ))}
        </select>
      </div>

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="travellers" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.travellers}
        </Label>
        <Input
          id="travellers"
          name="travellers"
          type="number"
          min={1}
          max={30}
          defaultValue={2}
          className={ghostClass}
        />
      </div>

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="startDate" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.startDate}
        </Label>
        <Input id="startDate" name="startDate" type="date" className={ghostClass} />
      </div>

      <div className={compact ? '' : 'md:col-span-2'}>
        <Label htmlFor="message" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.message}
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={10}
          placeholder={dict.inquiry.messagePlaceholder}
          className={ghostClass}
        />
      </div>

      <div className={compact ? 'space-y-3' : 'md:col-span-2 md:flex md:items-center md:justify-between'}>
        <Button type="submit" size="lg" variant={variant === 'dark' ? 'sage' : 'default'} disabled={submitting}>
          {submitting ? dict.inquiry.submitting : dict.inquiry.submit}
        </Button>
        <p className={`mt-3 text-xs md:mt-0 ${variant === 'dark' ? 'text-mist/60' : 'text-slate'}`}>
          {dict.inquiry.privacyNote}
        </p>
      </div>
    </form>
  )
}
