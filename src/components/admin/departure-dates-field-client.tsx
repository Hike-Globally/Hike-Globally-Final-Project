'use client'

import { ArrayField, fieldReducer, useForm, useFormFields } from '@payloadcms/ui'
import { FormContext } from '@payloadcms/ui/forms/Form'
import type { ArrayFieldClientProps, FormState } from 'payload'
import { useCallback, useMemo, useState } from 'react'

import {
  CALENDAR_WEEKDAYS,
  buildCalendarMonthGrid,
  currentMonthKey,
  dateKeyToIsoNoon,
  formatCalendarMonth,
  formatDepartureDate,
  resolveEndDateKey,
  shiftMonthKey,
  toDateKey,
} from '@/lib/departures'
import { prepareInstantTripRow } from '@/lib/instant-trip-row'

type AdminScheduledRow = {
  rowIndex: number
  startDateKey: string
  endDateKey: string
}

export default function DepartureDatesFieldClient({
  template,
  ...props
}: ArrayFieldClientProps & { template: FormState }) {
  const form = useForm()
  const { addFieldRow, dispatchFields, getFields, removeFieldRow, setModified } = form

  // Primitive string snapshot keeps useContextSelector referentially stable across unrelated edits.
  const serializedSchedule = useFormFields(([fields]) => {
    const duration = Math.max(1, Math.round(Number(fields?.durationDays?.value) || 1))
    const rowCount = fields?.[props.path]?.rows?.length ?? 0
    const entries: string[] = [`d:${duration}`]
    for (let i = 0; i < rowCount; i++) {
      const start = toDateKey(fields?.[`${props.path}.${i}.startDate`]?.value as string | undefined)
      if (!start) continue
      const end = resolveEndDateKey(
        start,
        fields?.[`${props.path}.${i}.endDate`]?.value as string | undefined,
        duration,
      )
      entries.push(`${i}:${start}:${end}`)
    }
    return entries.join('|')
  })

  const { durationDays, scheduledRows } = useMemo(() => {
    const [head, ...rest] = serializedSchedule.split('|')
    const parsedDuration = Number(head?.slice(2)) || 1
    const rows: AdminScheduledRow[] = rest.map((token) => {
      const [idx, startDateKey, endDateKey] = token.split(':')
      return {
        rowIndex: Number(idx),
        startDateKey: startDateKey!,
        endDateKey: endDateKey!,
      }
    })
    return { durationDays: parsedDuration, scheduledRows: rows }
  }, [serializedSchedule])

  const [baseMonth, setBaseMonth] = useState<string>(() => {
    const firstMonth = scheduledRows[0]?.startDateKey.slice(0, 7)
    return firstMonth ?? currentMonthKey()
  })

  const displayedMonths = useMemo(() => [baseMonth, shiftMonthKey(baseMonth, 1)], [baseMonth])

  const startMap = useMemo(() => {
    const map = new Map<string, AdminScheduledRow>()
    for (const row of scheduledRows) {
      if (!map.has(row.startDateKey)) {
        map.set(row.startDateKey, row)
      }
    }
    return map
  }, [scheduledRows])

  const isDateInSpan = useCallback(
    (dateKey: string): boolean =>
      scheduledRows.some((row) => dateKey > row.startDateKey && dateKey <= row.endDateKey),
    [scheduledRows],
  )

  const insertDepartureRow = useCallback(
    (rowIndex?: number, initialStartDateKey?: string) => {
      const state = getFields()
      const targetIndex = rowIndex ?? state[props.path]?.rows?.length ?? 0
      const subFieldState = prepareInstantTripRow(template, props.path, targetIndex)

      if (initialStartDateKey && subFieldState.startDate) {
        const iso = dateKeyToIsoNoon(initialStartDateKey)
        subFieldState.startDate = {
          ...subFieldState.startDate,
          initialValue: iso,
          value: iso,
          valid: true,
        }
      }

      const next = fieldReducer(state, {
        type: 'ADD_ROW',
        path: props.path,
        rowIndex: targetIndex,
        subFieldState,
      })
      const row = next[props.path].rows![targetIndex]
      row.isLoading = false
      row.collapsed = false

      dispatchFields({
        type: 'UPDATE_MANY',
        formState: Object.fromEntries(
          Object.entries(next).filter(
            ([fieldPath]) => fieldPath === props.path || fieldPath.startsWith(`${props.path}.`),
          ),
        ),
      })
      setModified(true)
    },
    [dispatchFields, getFields, props.path, setModified, template],
  )

  const addInstantRow = useCallback<typeof addFieldRow>(
    (args) => {
      if (args.path !== props.path) return addFieldRow(args)
      insertDepartureRow(args.rowIndex)
    },
    [addFieldRow, insertDepartureRow, props.path],
  )

  const handleToggleDate = useCallback(
    (dateKey: string) => {
      if (props.readOnly) return
      const existing = startMap.get(dateKey)
      if (existing) {
        removeFieldRow({ path: props.path, rowIndex: existing.rowIndex })
        setModified(true)
        return
      }
      insertDepartureRow(undefined, dateKey)
    },
    [insertDepartureRow, props.path, props.readOnly, removeFieldRow, setModified, startMap],
  )

  return (
    <div className="hg-departure-picker-wrap">
      <div className="hg-departure-picker" aria-label="Departure date calendar">
        <div className="hg-departure-picker__header">
          <div className="hg-departure-picker__intro">
            <p className="hg-departure-picker__title">Choose departure dates</p>
            <p className="hg-departure-picker__hint">
              Click a date to add a {durationDays}-day departure (click again to remove), or edit
              individual dates, availability and pricing below.
            </p>
          </div>

          <div className="hg-departure-picker__controls">
            <label className="hg-departure-picker__jump">
              <span className="hg-view-live__sr">Jump to month</span>
              <input
                type="month"
                value={baseMonth}
                onChange={(event) => {
                  if (/^\d{4}-\d{2}$/.test(event.target.value)) {
                    setBaseMonth(event.target.value)
                  }
                }}
                className="hg-departure-picker__month-input"
              />
            </label>
            <button
              type="button"
              className="hg-departure-picker__nav-btn"
              onClick={() => setBaseMonth((prev) => shiftMonthKey(prev, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              className="hg-departure-picker__today-btn"
              onClick={() => setBaseMonth(currentMonthKey())}
            >
              Today
            </button>
            <button
              type="button"
              className="hg-departure-picker__nav-btn"
              onClick={() => setBaseMonth((prev) => shiftMonthKey(prev, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        <div className="hg-departure-picker__months">
          {displayedMonths.map((monthKey) => {
            const cells = buildCalendarMonthGrid(monthKey)
            return (
              <div key={monthKey} className="hg-departure-picker__month">
                <p className="hg-departure-picker__month-label">{formatCalendarMonth(monthKey)}</p>
                <div className="hg-departure-picker__weekdays" aria-hidden>
                  {CALENDAR_WEEKDAYS.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="hg-departure-picker__grid">
                  {cells.map((cell) => {
                    if (!cell.inCurrentMonth) {
                      return (
                        <span
                          key={cell.dateKey}
                          className="hg-departure-picker__day hg-departure-picker__day--outside"
                          aria-hidden
                        >
                          {cell.dayOfMonth}
                        </span>
                      )
                    }

                    const isSelectedStart = startMap.has(cell.dateKey)
                    const inSpan = !isSelectedStart && isDateInSpan(cell.dateKey)

                    return (
                      <button
                        key={cell.dateKey}
                        type="button"
                        disabled={Boolean(props.readOnly)}
                        aria-pressed={isSelectedStart}
                        aria-label={`${isSelectedStart ? 'Remove' : 'Add'} departure on ${formatDepartureDate(cell.dateKey)}`}
                        onClick={() => handleToggleDate(cell.dateKey)}
                        className={[
                          'hg-departure-picker__day',
                          isSelectedStart && 'hg-departure-picker__day--selected',
                          inSpan && 'hg-departure-picker__day--span',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {cell.dayOfMonth}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="hg-departure-picker__footer">
          <div className="hg-departure-picker__legend">
            <span>
              <i className="hg-departure-picker__swatch hg-departure-picker__swatch--start" />
              Departure start
            </span>
            <span>
              <i className="hg-departure-picker__swatch hg-departure-picker__swatch--span" />
              Trip duration ({durationDays} {durationDays === 1 ? 'day' : 'days'})
            </span>
          </div>
          <span className="hg-departure-picker__count">
            {scheduledRows.length}{' '}
            {scheduledRows.length === 1 ? 'departure scheduled' : 'departures scheduled'}
          </span>
        </div>
      </div>

      <FormContext.Provider value={{ ...form, addFieldRow: addInstantRow }}>
        <ArrayField {...props} />
      </FormContext.Provider>
    </div>
  )
}
