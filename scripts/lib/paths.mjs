// Delade sökvägar och datum. Ingen konfiguration utanför config/.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..', '..');

export const PATHS = {
  root: ROOT,
  config: join(ROOT, 'config'),
  schema: join(ROOT, 'schema'),
  data: join(ROOT, 'data'),
  state: join(ROOT, 'state'),
  runs: join(ROOT, 'runs'),
};

/** Dagens datum som YYYY-MM-DD i lokal tid (inte UTC — en nattkörning ska inte byta datum midnatt). */
export function idag(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function lasJson(path, fallback = null) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`Kan inte läsa JSON i ${path}: ${err.message}`);
  }
}

export function lasConfig(namn) {
  return lasJson(join(PATHS.config, namn), null);
}

/** Som lasJson men kastar aldrig. Används när en trasig fil inte ska fälla körningen. */
export function readJsonSafe(path, fallback = null) {
  try {
    return lasJson(path, fallback);
  } catch {
    return fallback;
  }
}

export function runDir(datum = idag()) {
  return join(PATHS.runs, datum);
}

export function candidatesFil(datum = idag()) {
  return join(PATHS.data, `candidates-${datum}.json`);
}
