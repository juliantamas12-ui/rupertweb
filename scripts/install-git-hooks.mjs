#!/usr/bin/env node
// install-git-hooks.mjs
// One-shot installer: points this clone's git at scripts/git-hooks/ so the
// in-tree hooks (currently just pre-commit) run automatically.
//
// Usage:
//   node scripts/install-git-hooks.mjs
//
// Why not symlink into .git/hooks/? Because core.hooksPath keeps the source
// of truth in-tree (so the hook is reviewable, versioned, and travels with
// the repo) without requiring a copy step on every change.
//
// Safe to re-run. Idempotent. Won't override an existing custom hooksPath
// unless --force is passed.

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const desired = 'scripts/git-hooks';
const force = process.argv.includes('--force');

function sh(cmd) {
  return execSync(cmd, { cwd: root, encoding: 'utf8' }).trim();
}

// Verify we're in a git repo.
try {
  sh('git rev-parse --git-dir');
} catch {
  console.error('FAIL: not inside a git repo (run from rupertweb/).');
  process.exit(1);
}

// Verify the hook directory + file exist.
const hookDir = resolve(root, desired);
const hookFile = resolve(hookDir, 'pre-commit');
if (!fs.existsSync(hookFile)) {
  console.error(`FAIL: ${desired}/pre-commit not found. Is the repo fully checked out?`);
  process.exit(1);
}

// Ensure the hook is executable. Required even on case-insensitive filesystems
// where git would otherwise preserve the executable bit.
try {
  const st = fs.statSync(hookFile);
  // 0o111 = any-execute bits. Add owner-execute if missing.
  if ((st.mode & 0o111) === 0) {
    fs.chmodSync(hookFile, st.mode | 0o755);
    console.log(`  chmod +x ${desired}/pre-commit`);
  }
} catch (e) {
  console.error(`WARN: could not chmod ${desired}/pre-commit:`, e.message);
}

// Check current setting.
let current = '';
try {
  current = sh('git config --local --get core.hooksPath');
} catch {
  // unset; that's fine.
}

if (current === desired) {
  console.log(`OK: core.hooksPath already set to "${desired}". Nothing to do.`);
  process.exit(0);
}

if (current && !force) {
  console.error(`WARN: core.hooksPath is set to "${current}" (expected "${desired}").`);
  console.error('Re-run with --force to overwrite.');
  process.exit(1);
}

sh(`git config --local core.hooksPath ${desired}`);
console.log(`OK: set core.hooksPath = ${desired}`);
console.log('Pre-commit hook is active. Skip on a one-off commit with --no-verify.');
