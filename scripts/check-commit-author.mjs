#!/usr/bin/env node
/**
 * Vercel refuses to deploy a commit whose author email it cannot map to a
 * GitHub account. The deployment fails before the build starts with:
 *
 *   "GitHub couldn't verify an account for the commit."
 *   "The commit author email is not a valid email address"
 *
 * That is what happened to the bot-authored commits on this repository: the
 * merge commits deployed, the individual commits arrived blocked, and the
 * preview stayed on the previous build even though the push succeeded.
 *
 * This check reads the commits about to be pushed (or the given range) and
 * fails loudly, with the exact command that fixes it, instead of leaving a
 * silent "Deployment was blocked" in Vercel.
 *
 * Usage:
 *   npm run verify:commit-author                 # checks HEAD (the commit Vercel would build)
 *   npm run verify:commit-author origin/main..HEAD
 *   BASE=origin/main npm run verify:commit-author
 *
 * The check mirrors what Vercel does: it builds the commit at the tip of the
 * push, so merges are checked like any other commit and only the tip matters
 * when you push a single branch. Ancestors are not inspected, because Vercel
 * never builds them — a merge commit authored by a verified account deploys
 * even when a commit it merges was authored by a bot.
 */

import { execFileSync } from 'node:child_process'

/** Addresses GitHub/Vercel cannot map to an account. Extend as needed. */
const UNVERIFIABLE = [
  /@arena\.ai$/i,
  /@example\.(com|org|net)$/i,
  /@localhost$/i,
  /@local$/i,
  /\.local$/i,
  /^[^+@]+@users\.noreply\.github\.com$/i, // old form, no numeric id — usually a bot alias
  /^(agent|bot|probe|cursor|codex|claude|gemini)@/i,
]

const FIX = `Fix it (repo-local, affects only new commits):
  git config user.name  "Hike-Globally"
  git config user.email "337236695+Hike-Globally@users.noreply.github.com"

For a commit that is already pushed, amend or rebase it:
  git commit --amend --no-edit --reset-author
  git push --force-with-lease origin <branch>`

const run = (args) =>
  execFileSync('git', args, { encoding: 'utf8' }).trim()

const range = process.argv[2] ?? (process.env.BASE ? `${process.env.BASE}..HEAD` : '-1')

let log
try {
  log = run(['log', range, '--pretty=%h%x09%an <%ae>%x09%s'])
} catch {
  console.error('verify:commit-author — could not read git history for range:', range)
  process.exit(1)
}

if (!log) {
  console.log('verify:commit-author — no commits in range, nothing to check.')
  process.exit(0)
}

const commits = log.split('\n').map((line) => {
  const [sha, author, subject] = line.split('\t')
  const email = author?.match(/<([^>]+)>/)?.[1] ?? ''
  return { sha, author, subject, email }
})

const bad = commits.filter((c) => UNVERIFIABLE.some((rule) => rule.test(c.email)))

if (bad.length === 0) {
  console.log(`verify:commit-author — ${commits.length} commit(s) OK:`)
  for (const c of commits) console.log(`  ${c.sha}  ${c.author}`)
  process.exit(0)
}

console.error('verify:commit-author — Vercel will block these commits:\n')
for (const c of bad.slice(0, 10)) {
  console.error(`  ${c.sha}  ${c.author}`)
  console.error(`           ${c.subject}`)
}
if (bad.length > 10) console.error(`  ... and ${bad.length - 10} more`)
console.error(`\n${FIX}\n`)
process.exit(1)
