#!/usr/bin/env node
// Stoppar körningen och skriver varför.
//
// Stoppvillkoren i status.mjs är automatiska. Det här kommandot finns för det
// som inte är automatiskt: sessionen tar slut, någon drar ur sladden, eller en
// människa säger stopp. Då ska orsaken stå på disk, inte bara i ett
// chatfönster som försvinner.
//
//   node scripts/stop.mjs "sessionen avslutades efter 6 batchar"
//   node scripts/stop.mjs --villkor   # skriver automatisk orsak om en finns

import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { lasConfig, idag, runDir, readJsonSafe, candidatesFil } from './lib/paths.mjs';
import { logga } from './lib/log.mjs';

const scope = lasConfig('scope.json');
const datum = idag();
const dir = runDir(datum);

const argv = process.argv.slice(2);
const franVillkor = argv.includes('--villkor');
const text = argv.filter((a) => !a.startsWith('--')).join(' ').trim();

if (!text && !franVillkor) {
  console.error('Ange en orsak: node scripts/stop.mjs "varför körningen stannar"');
  process.exit(1);
}

const fil = readJsonSafe(candidatesFil(datum), { candidates: [] });
const seen = readJsonSafe(join(dir, 'seen.json'), { families: {} });

const uttomda = scope.families
  .filter((f) => f.discovery !== false)
  .filter((f) => (seen.families[f.id]?.empty_streak ?? 0) >= scope.stop.emptyBatchesInARow)
  .map((f) => f.id);

const kandidater = fil.candidates?.length ?? 0;

let orsak = text;
let automatisk = null;

if (franVillkor) {
  if (kandidater >= scope.stop.maxCandidates) automatisk = `kandidattaket nått (${kandidater})`;
  else if (uttomda.length) automatisk = `familjer uttömda: ${uttomda.join(', ')}`;
  if (!orsak) orsak = automatisk ?? 'inget automatiskt stoppvillkor var uppfyllt';
}

const stopp = {
  stopped_at: new Date().toISOString(),
  reason: orsak,
  automatic_condition: automatisk,
  candidates: kandidater,
  batches: existsSync(dir) ? readdirSync(dir).filter((f) => /^batch-\d+\.json$/.test(f)).length : 0,
  families_exhausted: uttomda,
  note: automatisk
    ? 'Stoppvillkoret i config/scope.json är uppfyllt.'
    : 'Körningen stannade utan att ett automatiskt stoppvillkor var uppfyllt. Det betyder inte att sökandet är slut — bara att den här körningen tog slut. Återuppta med scripts/status.mjs.',
};

writeFileSync(join(dir, 'stopp.json'), JSON.stringify(stopp, null, 2) + '\n', 'utf8');
logga('stopp', orsak);
console.log(`Stopp registrerat: ${orsak}`);
console.log(`  ${kandidater} kandidater, ${stopp.batches} batchar`);
if (!automatisk) console.log('  Inget automatiskt stoppvillkor var uppfyllt — körningen kan återupptas.');
