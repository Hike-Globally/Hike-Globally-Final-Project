import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ArrayField, CollapsibleField, DateField, Field } from 'payload'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { Trips } from '../collections/Trips'
import { DeparturesSection } from '../components/sections/departures-section'
import type { Trip } from '../payload-types'
import {
  addCalendarDays,
  buildCalendarMonthGrid,
  dateKeyToIsoNoon,
  daysBetweenInclusive,
  departureStatusOptions,
  formatCalendarMonth,
  formatDepartureRange,
  getDepartureMonths,
  normalizeDepartures,
  pickInitialDeparture,
  resolveEndDateKey,
  shiftMonthKey,
  toDateKey,
} from './departures'

const flattenNamedFields = (fields: Field[]): Field[] =>
  fields.flatMap((field) =>
    'fields' in field && !('name' in field) ? flattenNamedFields(field.fields) : [field],
  )

test('Trips collection Departures section provides date-choosing fields and keeps rich-text notes', () => {
  const departuresPanel = Trips.fields.find(
    (field): field is CollapsibleField =>
      field.type === 'collapsible' && field.label === 'Departures',
  )
  assert.ok(departuresPanel, 'Trips must include the Departures collapsible section')

  const departureDatesField = departuresPanel.fields.find(
    (field): field is ArrayField => 'name' in field && field.name === 'departureDates',
  )
  assert.ok(departureDatesField, 'Departures panel must define departureDates array')
  assert.equal(departureDatesField.type, 'array')
  assert.equal(
    departureDatesField.admin?.components?.Field,
    '@/components/admin/departure-dates-field',
  )
  assert.equal(
    departureDatesField.admin?.components?.RowLabel,
    '@/components/admin/departure-row-label',
  )

  const subFields = flattenNamedFields(departureDatesField.fields)
  const startDate = subFields.find(
    (field): field is DateField => 'name' in field && field.name === 'startDate',
  )
  const endDate = subFields.find(
    (field): field is DateField => 'name' in field && field.name === 'endDate',
  )
  assert.ok(startDate && startDate.type === 'date' && startDate.required === true)
  assert.equal(startDate.admin?.date?.pickerAppearance, 'dayOnly')
  assert.ok(endDate && endDate.type === 'date')
  assert.equal(endDate.admin?.date?.pickerAppearance, 'dayOnly')

  // Validate endDate cannot precede startDate
  assert.ok(typeof endDate.validate === 'function')
  const validateEnd = endDate.validate as (
    val: unknown,
    ctx: { siblingData: Record<string, unknown> },
  ) => true | string
  assert.equal(validateEnd(null, { siblingData: { startDate: '2026-10-15T12:00:00.000Z' } }), true)
  assert.equal(
    validateEnd('2026-10-28T12:00:00.000Z', {
      siblingData: { startDate: '2026-10-15T12:00:00.000Z' },
    }),
    true,
  )
  assert.equal(
    typeof validateEnd('2026-10-10T12:00:00.000Z', {
      siblingData: { startDate: '2026-10-15T12:00:00.000Z' },
    }),
    'string',
  )

  const statusField = subFields.find((field) => 'name' in field && field.name === 'status')
  assert.ok(statusField && statusField.type === 'select')
  assert.deepEqual(statusField.options, [...departureStatusOptions])

  const richTextNotes = departuresPanel.fields.find(
    (field) => 'name' in field && field.name === 'departures',
  )
  assert.ok(richTextNotes && richTextNotes.type === 'richText')
})

test('toDateKey and calendar math stay invariant across ISO timestamps and leap/year boundaries', () => {
  assert.equal(toDateKey('2026-11-15'), '2026-11-15')
  assert.equal(toDateKey('2026-11-15T12:00:00.000Z'), '2026-11-15')
  // Payload dayOnly timestamp from UTC+5:45 (Kathmandu)
  assert.equal(toDateKey('2026-11-15T11:15:00.000Z'), '2026-11-15')
  assert.equal(toDateKey(new Date('2026-11-15T12:00:00.000Z')), '2026-11-15')
  assert.equal(toDateKey('2026-02-30'), null)
  assert.equal(toDateKey('not-a-date'), null)
  assert.equal(toDateKey(''), null)
  assert.equal(toDateKey(null), null)

  assert.equal(dateKeyToIsoNoon('2026-11-15'), '2026-11-15T12:00:00.000Z')
  assert.equal(addCalendarDays('2026-10-15', 13), '2026-10-28')
  assert.equal(addCalendarDays('2026-12-24', 13), '2027-01-06')
  assert.equal(addCalendarDays('2028-02-28', 1), '2028-02-29')
  assert.equal(daysBetweenInclusive('2026-10-15', '2026-10-28'), 14)

  assert.equal(resolveEndDateKey('2026-10-15', null, 14), '2026-10-28')
  assert.equal(resolveEndDateKey('2026-10-15', '2026-10-30', 14), '2026-10-30')
  // Malformed earlier endDate falls back to durationDays span
  assert.equal(resolveEndDateKey('2026-10-15', '2026-10-10', 14), '2026-10-28')
})

test('normalizeDepartures sorts chronologically, skips incomplete rows, and resolves pricing and months', () => {
  const departures = normalizeDepartures(
    [
      {
        id: 'b',
        startDate: '2026-11-10T12:00:00.000Z',
        status: 'limited',
        price: 1990,
        note: ' 2 left ',
      },
      { id: 'empty', startDate: null },
      { id: 'a', startDate: '2026-10-05T12:00:00.000Z', status: 'sold-out' },
      { id: 'c', startDate: '2026-10-19T12:00:00.000Z', status: 'guaranteed' },
    ],
    { durationDays: 14, priceFrom: 1850 },
  )

  assert.deepEqual(
    departures.map((d) => d.id),
    ['a', 'c', 'b'],
  )
  assert.equal(departures[0]!.endDateKey, '2026-10-18')
  assert.equal(departures[0]!.price, 1850)
  assert.equal(departures[2]!.price, 1990)
  assert.equal(departures[2]!.note, '2 left')

  // First bookable departure is picked ahead of leading sold-out dates
  assert.equal(pickInitialDeparture(departures)?.id, 'c')

  const months = getDepartureMonths(departures)
  assert.deepEqual(months, [
    { monthKey: '2026-10', label: 'October 2026', shortLabel: 'Oct 2026', count: 2 },
    { monthKey: '2026-11', label: 'November 2026', shortLabel: 'Nov 2026', count: 1 },
  ])
})

test('buildCalendarMonthGrid and range formatters cover full weeks and cross-year dates', () => {
  const grid = buildCalendarMonthGrid('2026-11')
  assert.equal(grid.length % 7, 0)
  const inMonth = grid.filter((cell) => cell.inCurrentMonth)
  assert.equal(inMonth.length, 30)
  assert.equal(inMonth[0]!.dateKey, '2026-11-01')
  assert.equal(inMonth.at(-1)!.dateKey, '2026-11-30')

  assert.equal(shiftMonthKey('2026-12', 1), '2027-01')
  assert.equal(shiftMonthKey('2027-01', -1), '2026-12')
  assert.equal(formatCalendarMonth('2026-11'), 'November 2026')
  assert.equal(formatDepartureRange('2026-10-15', '2026-10-15'), 'Oct 15, 2026')
  assert.equal(formatDepartureRange('2026-10-15', '2026-10-28'), 'Oct 15 – Oct 28, 2026')
  assert.equal(formatDepartureRange('2026-12-24', '2027-01-06'), 'Dec 24, 2026 – Jan 6, 2027')
})

test('DeparturesSection renders calendar + departure dates, preserves rich-text notes, and hides when empty', () => {
  const baseTrip = {
    id: 1,
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp',
    summary: 'Summary',
    heroImage: 1,
    destination: 1,
    tripType: 'trekking',
    durationDays: 14,
    difficulty: 'challenging',
    priceFrom: 1850,
    priceCurrency: 'USD',
    priceUnit: 'per-person',
    updatedAt: '2026-11-04T00:00:00.000Z',
    createdAt: '2026-11-04T00:00:00.000Z',
  } as Trip

  // Empty trip hides section completely
  assert.equal(
    renderToStaticMarkup(
      createElement(DeparturesSection, {
        trip: baseTrip,
        bookingHref: '#inquiry',
        hasExternalBookingLink: false,
      }),
    ),
    '',
  )

  // Scheduled departures render both the calendar and the departure dates list
  const html = renderToStaticMarkup(
    createElement(DeparturesSection, {
      trip: {
        ...baseTrip,
        departureDates: [
          {
            id: 'dep-1',
            startDate: '2026-10-15T12:00:00.000Z',
            status: 'guaranteed',
            note: '4 spots left',
          },
          {
            id: 'dep-2',
            startDate: '2026-11-05T12:00:00.000Z',
            status: 'available',
            price: 1950,
          },
        ],
        departures: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  { type: 'text', version: 1, text: 'Private dates available on request.' },
                ],
              },
            ],
          },
        },
      },
      bookingHref: '/inquiry',
      hasExternalBookingLink: false,
    }),
  )

  assert.match(html, /id="departures"/)
  assert.match(html, /October 2026/)
  assert.match(html, /Oct 15 – Oct 28, 2026/)
  assert.match(html, /Nov 5 – Nov 18, 2026/)
  assert.match(html, /Guaranteed/)
  assert.match(html, /4 spots left/)
  assert.match(html, /\$1,850/)
  assert.match(html, /\$1,950/)
  assert.match(html, /\/inquiry\?trip=everest-base-camp&amp;startDate=2026-10-15/)
  assert.match(html, /Private dates available on request\./)
})
