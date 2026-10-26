#!/usr/bin/env node
// Läget just nu: progress, nästa familj, och om stoppvillkoret är nått.
//
// Det här är kommandot man kör när en natt avbröts. Det ska svara på en fråga:
// fortsätter vi, eller är det slut? Inget mer.

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, lasConfig, idag, runDir, readJsonSafe, candidatesFil } from './lib/paths.mjs';
import { lasSeen } from './lib/log.mjs';

const scope = lasConfig('scope.json');
const datum = idag();
const dir = runDir(datum);

const fil = readJsonSafe(candidatesFil(datum), { candidates: [] });
const seen = existsSync(join(dir, 'seen.json')) ? lasSeen(datum) : { families: {}, rejected: [] };
const batchar = existsSync(dir)
  ? readdirSync(dir)
      .filter((f) => /^batch-\d+\.json$/.test(f))
      .sort()
      .map((f) => readJsonSafe(join(dir, f)))
      .filter(Boolean)
  : [];

const oppen = batchar.find((b) => b.status === 'open');
const stangda = batchar.filter((b) => b.status === 'closed');

console.log(`Datum: ${datum}`);
console.log(`Kandidater i filen: ${fil.candidates?.length ?? 0} (tak ${scope.stop.maxCandidates})`);
console.log(`Batchar: ${stangda.length} stängda${oppen ? `, 1 öppen (batch-${oppen.batch})` : ''}`);

if (stangda.length) {
  const nya = stangda.reduce((s, b) => s + (b.outcome?.new ?? 0), 0);
  const avv = stangda.reduce((s, b) => s + (b.outcome?.rejected ?? 0), 0);
  console.log(`Utfall: ${nya} nya, ${avv} avvisade`);
}

console.log('\nFamiljer:');
for (const f of scope.families) {
  const s = seen.families[f.id] ?? { runs: 0, new: 0, empty_streak: 0 };
  const uttömd = s.empty_streak >= scope.stop.emptyBatchesInARow;
  const markering = uttömd ? 'UTTÖMD' : s.runs === 0 ? 'ej körd' : '';
  console.log(`  ${f.id.padEnd(24)} körningar ${String(s.runs).padStart(2)}  nya ${String(s.new).padStart(3)}  tomma i rad ${s.empty_streak}  ${markering}`);
}

// ── stoppvillkor ──────────────────────────────────────────────────────────
const skäl = [];

if ((fil.candidates?.length ?? 0) >= scope.stop.maxCandidates) {
  skäl.push(`kandidattaket nått (${fil.candidates.length} >= ${scope.stop.maxCandidates})`);
}

if (seen.families) {
  const uttömda = scope.families.filter((f) => (seen.families[f.id]?.empty_streak ?? 0) >= scope.stop.emptyBatchesInARow);
  if (uttömda.length === scope.families.length) {
    skäl.push('alla frågefamiljer uttömda — inga nya verifierbara organisationer kvar i scope');
  }
}

const först = stangda[0]?.started_at ?? oppen?.started_at;
if (först) {
  const timmar = (Date.now() - new Date(först).getTime()) / 3_600_000;
  if (timmar >= scope.stop.maxHours) {
    skäl.push(`tidsgränsen nådd (${timmar.toFixed(1)} h >= ${scope.stop.maxHours} h)`);
  } else {
    console.log(`\nTid i körning: ${timmar.toFixed(1)} h av ${scope.stop.maxHours} h`);
  }
}

if (skäl.length) {
  console.log('\nSTOPP — stoppvillkoret är nått:');
  for (const s of skäl) console.log(`  - ${s}`);
  console.log('\nKör report.mjs för sammanfattningen.');
  process.exit(3);
}

console.log('\nFortsätt.');
if (oppen) console.log(`  Nästa steg: fyll i candidates[] i batch-${oppen.batch}.json och kör close-batch.`);
else console.log('  Nästa steg: node scripts/start-batch.mjs');
