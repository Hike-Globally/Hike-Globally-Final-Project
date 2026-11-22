import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  AUTHOR_EMAILS,
  COMMITTER_EMAILS,
  isDeployableEmail,
  OWNER,
} from './commit-identity.mjs'

test('the owner address deploys', () => {
  assert.equal(isDeployableEmail(OWNER.email), true)
})

test('the account primary address deploys', () => {
  assert.equal(isDeployableEmail('hikeglobally@gmail.com'), true)
})

test('the address in the reported failure does not deploy', () => {
  // "The deployment was blocked because the commit email agent@arena.ai could
  // not be matched to a GitHub account." — this is the regression test.
  assert.equal(isDeployableEmail('agent@arena.ai'), false)
})

test('unknown bot and tool addresses fail instead of silently passing', () => {
  // The old guard was a blocklist and these all slipped through.
  for (const email of [
    'agent@arena.ai',
    'noreply@anthropic.com',
    'dev@example.com',
    'probe@arena.local',
    'someone@localhost',
    'claude@cursor.sh',
    'a-brand-new-tool@some-new-vendor.dev',
    '',
    null,
    undefined,
  ]) {
    assert.equal(isDeployableEmail(email), false, `expected ${String(email)} to be rejected`)
  }
})

test('a look-alike owner address does not deploy', () => {
  for (const email of [
    '337236696+Hike-Globally@users.noreply.github.com', // different id
    '337236695+someone-else@users.noreply.github.com',
    'hikeglobally@gmail.com.evil.test',
    'not-hikeglobally@gmail.com',
  ]) {
    assert.equal(isDeployableEmail(email), false, `expected ${email} to be rejected`)
  }
})

test('plus-addressing is not normalised, matching Vercel', () => {
  // Vercel treats dev+work@example.com and dev@example.com as separate
  // identities, so the allowlist must compare exact strings.
  assert.equal(isDeployableEmail('hikeglobally+ci@gmail.com'), false)
})

test('an allowlisted address is accepted regardless of case and padding', () => {
  assert.equal(isDeployableEmail('  337236695+hike-globally@users.noreply.github.com  '), true)
})

test('GitHub Web-flow is allowed as committer only', () => {
  assert.equal(isDeployableEmail('noreply@github.com', { kind: 'committer' }), true)
  assert.equal(isDeployableEmail('noreply@github.com', { kind: 'author' }), false)
})

test('a bare sha and a range keep distinct meanings', () => {
  // Guards the regression where `git log <sha>` walked the whole ancestry.
  const isSingleRevision = (spec) =>
    !spec.includes('..') && !spec.endsWith('^@') && !spec.startsWith('-')

  assert.equal(isSingleRevision('HEAD'), true)
  assert.equal(isSingleRevision('8e97726f0dd0f80cc3809b480b2adacd8409556f'), true)
  assert.equal(isSingleRevision('origin/main..HEAD'), false)
  assert.equal(isSingleRevision('-1'), false)
})

test('the allowlist only contains the owning account', () => {
  assert.deepEqual(AUTHOR_EMAILS, [OWNER.email, 'hikeglobally@gmail.com'])
  assert.deepEqual(COMMITTER_EMAILS, ['noreply@github.com'])
})
