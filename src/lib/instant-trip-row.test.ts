import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { fieldReducer as PayloadFieldReducer } from '@payloadcms/ui'
import type { FormState } from 'payload'
import { createElement, isValidElement } from 'react'

import { prepareInstantTripRow } from './instant-trip-row'

// Load the installed Payload reducer directly: its barrel also imports browser-only styles.
const formModule = new URL('../../forms/Form/', import.meta.resolve('@payloadcms/ui'))
const { fieldReducer } = (await import(new URL('fieldReducer.js', formModule).href)) as {
  fieldReducer: typeof PayloadFieldReducer
}
const { mergeServerFormState } = (await import(
  new URL('mergeServerFormState.js', formModule).href
)) as {
  mergeServerFormState: (args: { currentState: FormState; incomingState: FormState }) => FormState
}

const emptyText = { initialValue: null, value: null, valid: true }
const template: FormState = {
  heading: emptyText,
  content: {
    initialValue: { root: { children: [] } },
    value: { root: { children: [] } },
    valid: true,
    customComponents: { Field: createElement('div', { 'data-editor': 'lexical' }) },
  },
}

function addRow(state: FormState, rowIndex?: number, path = 'contentSections', row = template) {
  const index = rowIndex ?? state[path]?.rows?.length ?? 0
  const next = fieldReducer(state, {
    type: 'ADD_ROW',
    path,
    rowIndex: index,
    subFieldState: prepareInstantTripRow(row, path, index),
  })
  next[path].rows![index].isLoading = false
  next[path].rows![index].collapsed = false
  return next
}

test('first highlight, itinerary day and content section have editable state without a server response', () => {
  const templates: Record<string, FormState> = {
    highlights: { text: emptyText },
    itinerary: { day: emptyText, title: emptyText, description: emptyText, food: emptyText },
    contentSections: template,
  }
  for (const [path, row] of Object.entries(templates)) {
    const next = addRow({}, 0, path, row)
    assert.equal(next[path].value, 1)
    assert.equal(next[path].rows![0].isLoading, false)
    assert.equal(next[path].rows![0].collapsed, false)
    assert.equal(next[`${path}.0.id`].value, next[path].rows![0].id)
    for (const name of Object.keys(row)) {
      assert.ok(next[`${path}.0.${name}`])
    }
  }
})

test('each new row gets independent values, a fresh ID and the correct editor path', () => {
  const next = addRow(addRow({}))
  assert.notEqual(next['contentSections.0.id'].value, next['contentSections.1.id'].value)
  assert.notEqual(next['contentSections.0.content'].value, next['contentSections.1.content'].value)
  const component = next['contentSections.1.content'].customComponents?.Field
  assert.ok(isValidElement<{ path: string }>(component))
  assert.equal(component.props.path, 'contentSections.1.content')
  assert.equal(next['contentSections.1.content'].lastRenderedPath, 'contentSections.1.content')
  assert.equal(template.content.lastRenderedPath, undefined)
})

test('inserting, moving, duplicating and removing rows preserves existing content and unrelated fields', () => {
  let state = addRow({ title: { value: 'Everest' } })
  state['contentSections.0.heading'].value = 'Existing section'
  const existingID = state['contentSections.0.id'].value
  state = addRow(state, 0)
  assert.equal(state['contentSections.1.heading'].value, 'Existing section')
  assert.equal(state['contentSections.1.id'].value, existingID)
  state = fieldReducer(state, {
    type: 'MOVE_ROW',
    path: 'contentSections',
    moveFromIndex: 1,
    moveToIndex: 0,
  })
  state = fieldReducer(state, { type: 'DUPLICATE_ROW', path: 'contentSections', rowIndex: 0 })
  assert.equal(state['contentSections.1.heading'].value, 'Existing section')
  assert.notEqual(state['contentSections.1.id'].value, existingID)
  state = fieldReducer(state, { type: 'REMOVE_ROW', path: 'contentSections', rowIndex: 1 })
  assert.equal(state['contentSections.0.heading'].value, 'Existing section')
  assert.equal(state.title.value, 'Everest')
  assert.equal(state.contentSections.value, 2)
})

test('background form validation does not overwrite text entered immediately after adding', () => {
  const current = addRow({})
  current['contentSections.0.heading'].value = 'Typed before server responds'
  const merged = mergeServerFormState({
    currentState: current,
    incomingState: {
      'contentSections.0.heading': { initialValue: null, value: null, valid: true },
      'contentSections.0.content': { valid: false, errorMessage: 'Required' },
    },
  })
  assert.equal(merged['contentSections.0.heading'].value, 'Typed before server responds')
  assert.equal(merged['contentSections.0.content'].valid, false)
  assert.ok(merged['contentSections.0.content'].customComponents?.Field)
})
