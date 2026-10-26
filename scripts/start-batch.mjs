#!/usr/bin/env node
// Öppnar nästa batch: väljer frågefamilj, skriver frågorna, lämnar filen öppen.
//
// Familjevalet är inte slumpmässigt. En familj som nyss gett noll nya
// organisationer får vila, så en natt inte bränner alla sökningar på samma
// återvändsgränd. Är alla familjer uttömda vägrar scriptet öppna en batch —
// det är stoppvillkoret, inte ett fel.

import { writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, lasConfig, idag, runDir, readJsonSafe } from './lib/paths.mjs';
import { säkerställRunDir, initieraLogg, logga, lasSeen } from './lib/log.mjs';

const scope = lasConfig('scope.json');
const datum = idag();
const dir = säkerställRunDir(datum);

const seen = lasSeen(datum);

// Hitta ledigt batchnummer.
const befintliga = readdirSync(dir).filter((f) => /^batch-\d+\.json$/.test(f));
const nummer = befintliga.length + 1;
const batchId = String(nummer).padStart(2, '0');
const fil = join(dir, `batch-${batchId}.json`);

if (existsSync(fil)) {
  console.error(`batch-${batchId} finns redan. Stäng den eller ta bort den.`);
  process.exit(1);
}

// Öppen batch? Då ska den stängas först, inte en ny öppnas.
for (const f of befintliga) {
  const b = readJsonSafe(join(dir, f));
  if (b && b.status === 'open') {
    console.error(`batch-${b.batch} är fortfarande öppen. Kör close-batch först.`);
    process.exit(1);
  }
}

// Välj familj: minst antal körningar, och empty_streak under taket.
const kandidater = scope.families.map((f) => {
  const stat = seen.families[f.id] ?? { runs: 0, empty_streak: 0 };
  return { ...f, stat, uttömd: stat.empty_streak >= scope.stop.emptyBatchesInARow };
});

const kvar = kandidater.filter((f) => !f.uttömd);
if (kvar.length === 0) {
  console.error('Alla frågefamiljer är uttömda. Stoppvillkoret är nått — kör report.mjs.');
  process.exit(2);
}

kvar.sort(
  (a, b) =>
    a.stat.runs - b.stat.runs ||
    a.stat.empty_streak - b.stat.empty_streak ||
    (a.priority ?? 99) - (b.priority ?? 99) ||
    a.id.localeCompare(b.id),
);
const vald = kvar[0];

const batch = {
  batch: batchId,
  date: datum,
  family: vald.id,
  family_label: vald.label,
  goal: vald.goal,
  status: 'open',
  started_at: new Date().toISOString(),
  queries: vald.queries.map((q) => ({ q, done: false, note: null })),
  candidates: [],
  closed_at: null,
  outcome: null,
};

mkdirSync(dir, { recursive: true });
writeFileSync(fil, JSON.stringify(batch, null, 2) + '\n', 'utf8');

initieraLogg({ datum, familj: vald.label, batch: batchId });
logga('batch öppnad', `batch-${batchId} — ${vald.label}`);

console.log(`Öppnade ${fil}`);
console.log(`Familj: ${vald.label} (${vald.id})`);
console.log(`Mål: ${vald.goal}`);
console.log(`Körningar hittills: ${vald.stat.runs}, tomma i rad: ${vald.stat.empty_streak}`);
console.log('\nFrågor:');
batch.queries.forEach((q, i) => console.log(`  ${i + 1}. ${q.q}`));
console.log(`\nMål: ${scope.batch.targetCandidatesPerBatch} kandidater, max ${scope.batch.maxCandidatesPerBatch}.`);
console.log('Fyll i candidates[] och kör close-batch.');
