'use client'

import { ArrayField, fieldReducer, useForm } from '@payloadcms/ui'
import { FormContext } from '@payloadcms/ui/forms/Form'
import type { ArrayFieldClientProps, FormState } from 'payload'
import { useCallback } from 'react'

import { prepareInstantTripRow } from '@/lib/instant-trip-row'

export default function InstantTripArrayClient({
  template,
  ...props
}: ArrayFieldClientProps & { template: FormState }) {
  const form = useForm()
  const { addFieldRow, dispatchFields, getFields, setModified } = form
  const addInstantRow = useCallback<typeof addFieldRow>(
    (args) => {
      // Nested forms and other arrays retain Payload's normal behavior.
      if (args.path !== props.path) return addFieldRow(args)
      const state = getFields()
      const rowIndex = args.rowIndex ?? state[args.path]?.rows?.length ?? 0
      const next = fieldReducer(state, {
        type: 'ADD_ROW',
        path: args.path,
        rowIndex,
        subFieldState: prepareInstantTripRow(template, args.path, rowIndex),
      })
      const row = next[args.path].rows![rowIndex]
      row.isLoading = false
      row.collapsed = false

      // Update only this array, preserving the surrounding form, dirty state and autosave.
      dispatchFields({
        type: 'UPDATE_MANY',
        formState: Object.fromEntries(
          Object.entries(next).filter(
            ([path]) => path === args.path || path.startsWith(`${args.path}.`),
          ),
        ),
      })
      setModified(true)
    },
    [addFieldRow, dispatchFields, getFields, props.path, setModified, template],
  )

  return (
    <FormContext.Provider value={{ ...form, addFieldRow: addInstantRow }}>
      <ArrayField {...props} />
    </FormContext.Provider>
  )
}
