#!/usr/bin/env node
/**
 * Make it structurally impossible to author a commit Vercel will reject.
 *
 * Run by `npm install` (see the `prepare` script), by `npm run setup:git`, and
 * by the verify workflow before it checks anything. It is idempotent and never
 * throws: a missing git, a read-only checkout or a CI checkout without a
 * writable identity must not break an install.
 *
 * Two things happen:
 *
 *  1. `git config user.name` / `user.email` are set to the owning account when
 *     they are unset or set to an address that cannot deploy. A correct value
 *     is left untouched, so this does not fight a human who set it on purpose.
 *
 *  2. The repo-local `pre-push` hook is written so a bad commit is refused
 *     before it ever reaches GitHub — the point where the old guard was
 *     bypassed, because `.git/hooks` is not version controlled and every fresh
 *     clone had no hook at all.
 */

import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeployableEmail, OWNER } from './commit-identity.mjs'

const log = (msg) => console.log(`setup:git — ${msg}`)

const git = (args, cwd) =>
  execFileSync('git', args, { encoding: 'utf8', cwd }).trim()

/** Absolute path of the git dir, so hooks work from worktrees and submodules. */
function gitDir(cwd) {
  return git(['rev-parse', '--absolute-git-dir'], cwd)
}

function ensureIdentity(cwd) {
  const changes = []
  for (const [key, want] of [
    ['user.name', OWNER.name],
    ['user.email', OWNER.email],
  ]) {
    let current = ''
    try {
      current = git(['config', '--local', key], cwd)
    } catch {
      current = ''
    }

    const alreadyCorrect = key === 'user.email' ? isDeployableEmail(current) : current === want
    if (alreadyCorrect) continue

    git(['config', '--local', key, want], cwd)
    changes.push(`${key}: ${current || '(unset)'} → ${want}`)
  }

  if (changes.length) {
    log('set the commit identity Vercel accepts:')
    for (const change of changes) log(`  ${change}`)
  } else {
    log('commit identity already correct.')
  }
}

function ensurePrePushHook(cwd) {
  const dir = join(gitDir(cwd), 'hooks')
  const hook = join(dir, 'pre-push')

  mkdirSync(dir, { recursive: true })

  // Never clobber a hook someone wrote by hand; only replace our own.
  if (existsSync(hook)) {
    const existing = execFileSync('cat', [hook], { encoding: 'utf8' })
    const ours = existing.includes('check-commit-author.mjs')
    if (!ours) {
      log('a custom pre-push hook exists — leaving it alone.')
      return
    }
  }

  // A pre-push hook receives "<remote> <url>" as $1/$2. Pass HEAD explicitly:
  // forwarding $1 would hand the guard the remote name, and `git log <remote>`
  // resolves to the wrong commit, so the hook would silently approve a bad push.
  writeFileSync(
    hook,
    ['#!/bin/sh', '# Installed by scripts/setup-git-identity.mjs — do not edit.', 'exec node scripts/check-commit-author.mjs HEAD', ''].join('\n'),
  )
  chmodSync(hook, 0o755)
  log('installed the pre-push hook (refuses an undeployable author).')
}

function main() {
  const cwd = process.cwd()
  try {
    ensureIdentity(cwd)
  } catch (error) {
    log(`could not set the identity (${error.message.split('\n')[0]}) — continuing.`)
  }
  try {
    ensurePrePushHook(cwd)
  } catch (error) {
    log(`could not install the pre-push hook (${error.message.split('\n')[0]}) — continuing.`)
  }
}

main()
