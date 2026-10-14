import { RscEntryLexicalField } from '@payloadcms/richtext-lexical/rsc'
import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState'
import type { ArrayFieldServerProps } from 'payload'
import type { ComponentProps } from 'react'

import InstantTripArrayClient from './instant-trip-array-client'

/** Prepare an empty row with the form, rather than waiting for a server round trip on Add. */
export default async function InstantTripArray(props: ArrayFieldServerProps) {
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

  // Payload's rich-text field has no client-only fallback. Include the configured Lexical
  // component even when the array is empty, so the first content section is also ready to edit.
  for (const child of field.fields) {
    if (child.type !== 'richText') continue
    const editor = child.editor
    const childClientField = clientField.fields.find(
      (candidate) => 'name' in candidate && candidate.name === child.name,
    )
    if (
      !editor ||
      typeof editor === 'function' ||
      !('editorConfig' in editor) ||
      !childClientField
    ) {
      continue
    }
    const component = editor.FieldComponent
    const editorProps = typeof component === 'object' ? component.serverProps : {}
    const fieldPermissions = typeof permissions === 'boolean' ? permissions : permissions?.fields
    const childPermissions =
      typeof fieldPermissions === 'boolean'
        ? fieldPermissions
        : (fieldPermissions?.[child.name] ?? true)
    template[child.name].customComponents = {
      Field: await RscEntryLexicalField({
        ...props,
        ...editorProps,
        field: child,
        clientField: childClientField,
        path: child.name,
        schemaPath: `${schemaPath}.${child.name}`,
        siblingData: {},
        permissions: childPermissions,
        sanitizedEditorConfig: editor.editorConfig,
      } as ComponentProps<typeof RscEntryLexicalField>),
    }
  }

  // Array IDs must be generated anew on each click, not copied from the template.
  delete template.id

  return (
    <InstantTripArrayClient
      field={clientField}
      path={props.path}
      schemaPath={schemaPath}
      permissions={permissions}
      readOnly={readOnly}
      template={template}
    />
  )
}
