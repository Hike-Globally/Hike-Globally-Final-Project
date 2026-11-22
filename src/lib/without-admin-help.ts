import type { Field } from 'payload'

/** Remove Payload's helper descriptions recursively without changing field behavior. */
export function withoutAdminHelp(fields: Field[]): Field[] {
  return fields.map((field) => {
    const cleaned = { ...field } as Field & { admin?: Record<string, unknown>; fields?: Field[] }

    if (cleaned.admin?.description) {
      cleaned.admin = { ...cleaned.admin }
      delete cleaned.admin.description
    }

    if (cleaned.fields) cleaned.fields = withoutAdminHelp(cleaned.fields)
    return cleaned
  })
}
