// Körlogg och sedda domäner.
//
// Loggen är inte dekoration. Den är det enda som gör en avbruten natt
// begriplig: vilka frågor ställdes, vilka sidor öppnades, vad avvisades och
// varför. En natt som inte går att läsa i efterhand är en förlorad natt.

import { appendFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runDir, lasJson, idag } from './paths.mjs';

export function säkerställRunDir(datum = idag()) {
  const dir = runDir(datum);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function kornloggPath(datum = idag()) {
  return join(säkerställRunDir(datum), 'kornlogg.md');
}

/** Initierar loggen för dagen om den inte finns. */
export function initieraLogg({ datum = idag(), familj, batch }) {
  const p = kornloggPath(datum);
  if (existsSync(p)) return p;
  const rader = [
    `# Körlogg ${datum}`,
    '',
    'Genererad av v3r1t4s-map-pipeline. En rad per händelse, i tidsordning.',
    '',
    '| Tid | Händelse | Detalj |',
    '|---|---|---|',
    `| ${new Date().toISOString()} | start | familj ${familj ?? '-'} |`,
    '',
  ];
  writeFileSync(p, rader.join('\n'), 'utf8');
  return p;
}

/** Appendar en händelse till körloggen. Rader får inte innehålla | utan escape. */
export function logga(händelse, detalj, { datum = idag() } = {}) {
  const p = kornloggPath(datum);
  if (!existsSync(p)) {
    writeFileSync(p, `# Körlogg ${datum}\n\n| Tid | Händelse | Detalj |\n|---|---|---|\n`, 'utf8');
  }
  const d = String(detalj ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  appendFileSync(p, `| ${new Date().toISOString()} | ${händelse} | ${d} |\n`, 'utf8');
}

/** Rubrik mellan batchar, så loggen går att skumma. */
export function loggRubrik(text, { datum = idag() } = {}) {
  const p = kornloggPath(datum);
  appendFileSync(p, `\n## ${text}\n\n`, 'utf8');
}

function seenPath(datum = idag()) {
  return join(säkerställRunDir(datum), 'seen.json');
}

export function lasSeen(datum = idag()) {
  return lasJson(seenPath(datum), { updated_at: null, domains: {}, rejected: [], families: {} });
}

export function sparaSeen(d, datum = idag()) {
  d.updated_at = new Date().toISOString();
  writeFileSync(seenPath(datum), JSON.stringify(d, null, 2) + '\n', 'utf8');
  return d;
}

/** Markera en domän som sedd. Syftet är att aldrig öppna samma sida två nätter i rad utan skäl. */
export function markeraSedd(seen, doman, info = {}) {
  if (!doman) return seen;
  seen.domains[doman] = { ...(seen.domains[doman] ?? {}), ...info, seen_at: idag() };
  return seen;
}

/** Avvisad kandidat sparas med orsak — aldrig tyst. */
export function markeraAvvisad(seen, post, orsak) {
  seen.rejected.push({
    id: post?.id ?? null,
    name: post?.name?.value ?? null,
    website: post?.website ?? null,
    reason: orsak,
    rejected_at: idag(),
  });
  return seen;
}

/** Bokför utfall per frågefamilj, så start-batch kan se vad som är uttömt. */
export function bokforFamilj(seen, familj, { nya = 0, dubbletter = 0, avvisade = 0, raknaTom = true } = {}) {
  const f = (seen.families[familj] ??= { runs: 0, new: 0, duplicates: 0, rejected: 0, empty_streak: 0 });
  f.runs += 1;
  f.new += nya;
  f.duplicates += dubbletter;
  f.rejected += avvisade;
  // Verifieringsfamiljer får aldrig streak: deras nollor betyder "inget att
  // verifiera", inte "inget kvar att hitta".
  if (raknaTom) f.empty_streak = nya === 0 ? f.empty_streak + 1 : 0;
  f.last_run = idag();
  return seen;
}
