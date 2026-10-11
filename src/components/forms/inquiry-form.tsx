'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { resolveSiteUrl } from '@/lib/site-url'
import { dictionary, type Dictionary } from '@/i18n/dictionaries'

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
  trips,
  email,
  defaultTripSlug,
  compact = false,
  variant = 'light',
}: {
  trips: TripOption[]
  email: string
  defaultTripSlug?: string | null
  compact?: boolean
  variant?: 'light' | 'dark'
}) {
  const dict: Dictionary = dictionary
  const formRef = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)

  const endpoint = `https://formsubmit.co/${email}`
  const successPath = process.env.NEXT_PUBLIC_FORMSUBMIT_SUCCESS_PATH || '/inquiry/thank-you'
  // Normalized so a schemeless NEXT_PUBLIC_SITE_URL still produces a usable absolute return URL.
  // Unset means "no absolute URL": Formsubmit then redirects to a relative path on our own domain.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ? resolveSiteUrl() : ''
  const nextUrl = siteUrl ? `${siteUrl}${successPath}` : successPath

  const onSubmit = () => {
    setSubmitting(true)
    // The browser performs the actual POST to Formsubmit — this is only the pending state.
  }

  const isDark = variant === 'dark'

  const labelClass = isDark ? 'text-mist/80' : 'text-ink'
  // `color-scheme: dark` is what keeps the native widgets legible on the ink panel: without it the
  // date-picker icon and the <select> arrow stay black-on-dark, and the pickers pop open light.
  const ghostClass = isDark
    ? '[color-scheme:dark] border-white/15 bg-white/[0.06] text-mist placeholder:text-mist/40 focus-visible:border-sage'
    : ''
  const requiredMarkClass = isDark ? 'text-sage' : 'text-slate'

  return (
    <form
      ref={formRef}
      action={endpoint}
      method="POST"
      onSubmit={onSubmit}
      className={
        compact
          ? 'space-y-4'
          : cn(
              // The panel surface follows the section it sits in: a white card on light backgrounds,
              // a translucent white film on the dark ink panels (same treatment as the testimonial
              // cards). Hardcoding `bg-card` here made the dark-variant form a solid white block
              // with near-white labels and inputs on top of it — i.e. unreadable.
              'grid gap-5 border p-4 sm:p-6 md:grid-cols-2 md:p-8',
              isDark
                ? 'border-white/10 bg-white/[0.04]'
                : 'border-black/[0.06] bg-card shadow-[0_1px_2px_rgba(1,22,30,0.04)]',
            )
      }
    >
      {/* Formsubmit controls */}
      <input type="hidden" name="_subject" value={`New trip enquiry — ${dict.inquiry.formTitle}`} />
      <input type="hidden" name="_next" value={nextUrl} />
      <input type="hidden" name="_captcha" value="false" />
      <input type="hidden" name="_template" value="table" />
      <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="_language" value="en" />

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="name" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.name} <span className={requiredMarkClass}>*</span>
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
          {dict.inquiry.email} <span className={requiredMarkClass}>*</span>
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
        <Input
          id="phone"
          name="phone"
          autoComplete="tel"
          placeholder="+49 170 0000000"
          className={ghostClass}
        />
      </div>

      <div className={compact ? '' : 'md:col-span-1'}>
        <Label htmlFor="country" className={`mb-2 ${labelClass}`}>
          {dict.inquiry.country}
        </Label>
        <Input
          id="country"
          name="country"
          autoComplete="country-name"
          placeholder="Germany"
          className={ghostClass}
        />
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
            'h-11 w-full border px-4 text-sm shadow-[0_1px_2px_rgba(1,22,30,0.03)] outline-none transition-[color,box-shadow,border-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
            // A raw <select> has no shadcn primitive to inherit a surface from, so spell it out.
            isDark ? ghostClass : 'border-input bg-white text-ink',
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

      <div
        className={
          compact ? 'space-y-3' : 'md:col-span-2 md:flex md:items-center md:justify-between'
        }
      >
        <Button
          type="submit"
          size="lg"
          variant={variant === 'dark' ? 'sage' : 'default'}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          {submitting ? dict.inquiry.submitting : dict.inquiry.submit}
        </Button>
        <p className={`mt-3 text-xs md:mt-0 ${variant === 'dark' ? 'text-mist/60' : 'text-slate'}`}>
          {dict.inquiry.privacyNote}
        </p>
      </div>
    </form>
  )
}
