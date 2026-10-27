#!/usr/bin/env node
// Kvalitetskontroll, lager 1: nätverket.
//
// Validatorn i lib/validate.mjs är ren och snabb. Den kan inte veta om en URL
// lever. Det gör den här filen: den hämtar varje källa efter robots-kontroll,
// skriver det faktiska svaret i posten och fäller posten om källan inte bär.
//
// En källa som svarar 403 eller som robots förbjuder får aldrig stå som
// underlag för ett confirmed. Punkten med databasen är att länken ska hålla.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS, idag, readJsonSafe, candidatesFil, valtDatum } from './lib/paths.mjs';
import { hamtaRespektfullt } from './lib/robots.mjs';
import { valideraKandidat } from './lib/validate.mjs';
import { logga } from './lib/log.mjs';

const argv = process.argv.slice(2);
const strikt = argv.includes('--strict');
const datum = valtDatum();
const filPath = candidatesFil(datum);

const fil = readJsonSafe(filPath, null);
if (!fil) {
  console.error(`Ingen kandidatfil för ${datum}. Kör close-batch först.`);
  process.exit(1);
}

let andrade = false;
const sammanstallning = [];

for (const post of fil.candidates ?? []) {
  const issues = [];

  for (const kalla of post.sources ?? []) {
    const res = await hamtaRespektfullt(kalla.url);

    kalla.http_status = res.status || null;
    kalla.robots_allowed = res.robots?.allowed ?? null;
    andrade = true;

    if (!res.ok) {
      issues.push(`källan svarar inte: ${kalla.url} (HTTP ${res.status || 'nätverksfel'}${res.error ? `, ${res.error}` : ''})`);
    } else if (res.robots && res.robots.allowed === false) {
      issues.push(`robots.txt förbjuder ${kalla.url}`);
    }
  }

  // Strukturvalidering efter nätverksfälten är på plats, så den ser sanningen.
  const v = valideraKandidat(post);
  issues.push(...v.errors);

  post.qc = {
    reviewer: 'deterministic',
    passed: issues.length === 0,
    issues,
  };
  andrade = true;

  sammanstallning.push({ id: post.id, passed: post.qc.passed, issues });
}

if (andrade) {
  fil.qc = {
    run_at: new Date().toISOString(),
    reviewer: 'deterministic',
    passed: sammanstallning.every((s) => s.passed),
    checked: sammanstallning.length,
    failed: sammanstallning.filter((s) => !s.passed).length,
  };
  writeFileSync(filPath, JSON.stringify(fil, null, 2) + '\n', 'utf8');
}

const trasiga = sammanstallning.filter((s) => !s.passed);

console.log(`QC: ${sammanstallning.length} poster, ${trasiga.length} underkända.`);
for (const t of trasiga) {
  console.log(`\n  ${t.id}`);
  for (const i of t.issues) console.log(`    - ${i}`);
}

if (trasiga.length) {
  logga('qc underkänd', `${trasiga.length} av ${sammanstallning.length}: ${trasiga.map((t) => t.id).join(', ')}`);
  if (strikt) process.exit(1);
  console.log('\nPosterna finns kvar men är märkta. Rätta källan eller sänk status till claimed.');
} else {
  logga('qc godkänd', `${sammanstallning.length} poster`);
  console.log('Alla poster bär sina källor.');
}
