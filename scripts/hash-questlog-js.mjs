#!/usr/bin/env node
// hash-questlog-js.mjs
// Computes a short content hash of rupertweb/questlog.js and rewrites the
// <script defer src="/questlog.js?v=..."></script> reference in rupertweb/questlog.html.
//
// Pair this with the worker.js route handler for /questlog.js, which sets a
// long Cache-Control header when the request has a non-empty v= query string.
//
// Usage: node scripts/hash-questlog-js.mjs
// Idempotent: safe to run repeatedly. Exits non-zero on validation failure.

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const jsPath = resolve(root, 'questlog.js');
const htmlPath = resolve(root, 'questlog.html');

const js = readFileSync(jsPath);
const hash = createHash('sha256').update(js).digest('hex').slice(0, 12);

const html = readFileSync(htmlPath, 'utf8');

// Match <script ... src="/questlog.js" ... > or with existing ?v= query.
const re = /<script\b([^>]*?)\bsrc="\/questlog\.js(?:\?v=[a-f0-9]+)?"([^>]*)><\/script>/;
const m = html.match(re);
if (!m) {
  console.error('FAIL: could not find <script src="/questlog.js"> reference in questlog.html');
  process.exit(1);
}

const attrsBefore = m[1];
const attrsAfter = m[2];
const replacement = `<script${attrsBefore}src="/questlog.js?v=${hash}"${attrsAfter}></script>`;
const updated = html.replace(re, replacement);

// Sanity: exactly one match.
const matchCount = (html.match(new RegExp(re.source, 'g')) || []).length;
if (matchCount !== 1) {
  console.error(`FAIL: expected exactly 1 questlog.js script tag, found ${matchCount}`);
  process.exit(1);
}

if (updated === html) {
  console.log(`hash unchanged: ${hash}`);
  process.exit(0);
}

writeFileSync(htmlPath, updated);
console.log(`updated /questlog.js?v=${hash}`);
