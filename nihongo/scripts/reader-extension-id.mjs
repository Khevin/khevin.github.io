#!/usr/bin/env node
/*
 * reader-extension-id.mjs — prints the extension ID Chrome derives from the
 * `key` field in reader-extension/manifest.json (sha256 of the DER public key,
 * first 32 hex chars mapped 0-9a-f → a-p). A fixed key keeps the unpacked
 * extension's ID stable across machines and reinstalls, which the e2e test,
 * exact Nihongo routes, and a future externally_connectable bridge rely on.
 *
 *   node scripts/reader-extension-id.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function extensionIdFromKey(keyBase64) {
  const der = Buffer.from(keyBase64, 'base64');
  return crypto.createHash('sha256').update(der).digest('hex').slice(0, 32)
    .replace(/[0-9a-f]/g, (c) => String.fromCharCode('a'.charCodeAt(0) + parseInt(c, 16)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'reader-extension', 'manifest.json'), 'utf8'));
  if (!manifest.key) { console.error('manifest.json has no "key" field'); process.exit(1); }
  console.log(extensionIdFromKey(manifest.key));
}
