'use client'

import { useFormFields, useRowLabel } from '@payloadcms/ui'

import {
  departureStatusLabel,
  formatDepartureRange,
  resolveEndDateKey,
  toDateKey,
} from '@/lib/departures'

type DepartureRowData = {
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  price?: number | null
  note?: string | null
}

export default function DepartureRowLabel() {
  const { data, rowNumber } = useRowLabel<DepartureRowData>()
  const durationDays = useFormFields(([fields]) => Number(fields?.durationDays?.value) || 1)

  const indexLabel = (rowNumber ?? 0) + 1
  const startKey = toDateKey(data?.startDate)
  if (!startKey) {
    return <span>{indexLabel}. Choose a departure date</span>
  }

  const endKey = resolveEndDateKey(startKey, data?.endDate, durationDays)
  const range = formatDepartureRange(startKey, endKey)
  const status = departureStatusLabel(data?.status)
  const note = data?.note?.trim()

  return (
    <span>
      {indexLabel}. {range} · {status}
      {note ? ` (${note})` : ''}
    </span>
  )
}
