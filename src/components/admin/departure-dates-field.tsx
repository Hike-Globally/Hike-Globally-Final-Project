import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'
import type { ArrayFieldServerProps } from 'payload'

import DepartureDatesFieldClient from './departure-dates-field-client'

/**
 * Server wrapper for the Trip `departureDates` array: prepares an instant empty row template
 * (zero server round-trip on Add or calendar click) and hands it to the interactive date chooser.
 */
export default async function DepartureDatesField(props: ArrayFieldServerProps) {
  const { clientField, field, permissions, readOnly, req } = props
  const schemaPath = props.schemaPath ?? `trips.${field.name}`
  const template = await fieldSchemasToFormState({
    fields: field.fields,
    fieldSchemaMap: props.fieldSchemaMap,
    clientFieldSchemaMap: props.clientFieldSchemaMap,
    collectionSlug: props.collectionSlug,
    documentData: props.data,
    operation: props.operation === 'create' ? 'create' : 'update',
    permissions: typeof permissions === 'boolean' ? permissions : (permissions?.fields ?? true),
    preferences: props.preferences,
    readOnly,
    renderAllFields: true,
    req,
    schemaPath,
    skipValidation: true,
  })

  delete template.id

  return (
    <DepartureDatesFieldClient
      field={clientField}
      path={props.path}
      schemaPath={schemaPath}
      permissions={permissions}
      readOnly={readOnly}
      template={template}
    />
  )
}
