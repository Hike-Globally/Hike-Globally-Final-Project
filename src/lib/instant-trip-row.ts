import type { FormState } from 'payload'
import { cloneElement, isValidElement } from 'react'

/** Bind the reusable empty row to its insertion path without sharing mutable field values. */
export function prepareInstantTripRow(
  template: FormState,
  path: string,
  rowIndex: number,
): FormState {
  return Object.fromEntries(
    Object.entries(template).map(([name, field]) => {
      const fieldPath = `${path}.${rowIndex}.${name}`
      const { customComponents, ...state } = field
      const component = customComponents?.Field
      return [
        name,
        {
          ...structuredClone(state),
          // The component is already rendered; background validation must not replace it
          // (or treat this field as newly added and overwrite text entered while it runs).
          lastRenderedPath: fieldPath,
          ...(customComponents
            ? {
                customComponents: {
                  ...customComponents,
                  Field: isValidElement<{ path: string }>(component)
                    ? cloneElement(component, { path: fieldPath })
                    : component,
                },
              }
            : {}),
        },
      ]
    }),
  )
}
