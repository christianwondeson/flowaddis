#!/usr/bin/env node
/**
 * Injects Cloud Run SSR env for `firebase deploy --only hosting` without committing secrets.
 * RAPIDAPI_KEY / STRAPI_API_TOKEN are read from local env files (same as `next dev`) and
 * written to firebase.json only for the duration of deploy.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = {
  ...parseEnvFile(path.join(root, '.env')),
  ...parseEnvFile(path.join(root, '.env.production')),
  ...parseEnvFile(path.join(root, '.env.local')),
  ...process.env,
};

const rapidKey = (env.RAPIDAPI_KEY || env.NEXT_PUBLIC_RAPIDAPI_KEY || '').trim();
const strapiToken = (env.STRAPI_API_TOKEN || '').trim();
const fbPath = path.join(root, 'firebase.json');
const original = fs.readFileSync(fbPath, 'utf8');
const json = JSON.parse(original);

if (!json.hosting?.frameworksBackend) {
  console.error(
    '[deploy-hosting] firebase.json hosting.frameworksBackend is missing.',
  );
  process.exit(1);
}

json.hosting.frameworksBackend.environmentVariables = {
  BACKEND_URL: 'https://api-prod.bookaddis.com',
  NEXT_PUBLIC_STRAPI_URL: 'https://cms.bookaddis.com',
  STRAPI_URL: 'https://cms.bookaddis.com',
};

if (rapidKey) {
  json.hosting.frameworksBackend.environmentVariables.RAPIDAPI_KEY = rapidKey;
} else {
  console.warn(
    '[deploy-hosting] RAPIDAPI_KEY not found in .env / .env.local / .env.production — hotel RapidAPI routes will 503 in production.',
  );
}

if (strapiToken) {
  json.hosting.frameworksBackend.environmentVariables.STRAPI_API_TOKEN =
    strapiToken;
} else {
  console.warn(
    '[deploy-hosting] STRAPI_API_TOKEN not found — CMS uploads/admin media may fail in production.',
  );
}

fs.writeFileSync(fbPath, `${JSON.stringify(json, null, 2)}\n`);

let status = 1;
try {
  const r = spawnSync('firebase', ['deploy', '--only', 'hosting'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, FIREBASE_CLI_EXPERIMENTS: 'webframeworks' },
    shell: process.platform === 'win32',
  });
  status = r.status ?? 1;
} finally {
  // Always restore committed firebase.json (no secrets left on disk).
  fs.writeFileSync(fbPath, original);
}

process.exit(status);
